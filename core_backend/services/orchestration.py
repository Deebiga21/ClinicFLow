import pandas as pd
import numpy as np
import datetime
import uuid
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pickle
import xgboost as xgb

class OrchestrationService:
    def __init__(self, db_url="sqlite:///clinic_core_v2.db"):
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)
        self._load_models()

    def _load_models(self):
        try:
            self.wait_model = xgb.XGBRegressor()
            self.wait_model.load_model("saved_models/waiting_time_model.json")
            with open("saved_models/waiting_time_columns.pkl", "rb") as f:
                self.wait_cols = pickle.load(f)
        except:
            self.wait_model = None
            self.wait_cols = []
            
        try:
            self.dur_model = xgb.XGBRegressor()
            self.dur_model.load_model("saved_models/consultation_duration_model.json")
            with open("saved_models/consultation_duration_columns.pkl", "rb") as f:
                self.dur_cols = pickle.load(f)
        except:
            self.dur_model = None
            self.dur_cols = []

    def _align_features(self, df, required_columns):
        if not required_columns: return df
        for col in required_columns:
            if col not in df.columns:
                df[col] = 0
        return df[required_columns]

    def _track_journey(self, session, patient_id, appointment_id, stage, status="Active"):
        now = datetime.datetime.now()
        session.execute(text("UPDATE patient_journeys SET stage_completed_at = :now, status = 'Completed' WHERE patient_id = :pid AND status = 'Active'"), {"now": now, "pid": patient_id})
        jid = f"J_{uuid.uuid4().hex[:8]}"
        session.execute(text("INSERT INTO patient_journeys (id, patient_id, appointment_id, current_stage, stage_started_at, status, created_at) VALUES (:id, :pid, :aid, :stg, :now, :status, :now)"), {
            "id": jid, "pid": patient_id, "aid": appointment_id, "stg": stage, "now": now, "status": status
        })

    def process_patient_check_in(self, appointment_id):
        with self.Session() as session:
            res = session.execute(text("SELECT patient_id, doctor_id FROM appointments WHERE id = :aid"), {"aid": appointment_id}).fetchone()
            if not res: return {"error": "Appointment not found"}
            patient_id, doctor_id = res
            
            session.execute(text("UPDATE appointments SET status = 'Checked-In' WHERE id = :aid"), {"aid": appointment_id})
            ahead = session.execute(text("SELECT count(*) FROM queue_entries WHERE doctor_id = :did AND status IN ('Waiting', 'Called')"), {"did": doctor_id}).scalar()
            
            queue_id = f"Q_{uuid.uuid4().hex[:8]}"
            now = datetime.datetime.now()
            
            session.execute(text("INSERT INTO queue_entries (id, appointment_id, patient_id, doctor_id, token_number, queue_position, status, entered_queue_at, created_at, updated_at) VALUES (:qid, :aid, :pid, :did, :pos, :pos, 'Waiting', :now, :now, :now)"), {
                "qid": queue_id, "aid": appointment_id, "pid": patient_id, "did": doctor_id, "pos": ahead + 1, "now": now
            })
            
            self._track_journey(session, patient_id, appointment_id, "Queue")
            
            wait_pred = 15.0
            if self.wait_model:
                features = self._get_wait_features(session, queue_id, patient_id, doctor_id, ahead)
                wait_pred = float(self.wait_model.predict(features)[0])
                session.execute(text("UPDATE queue_entries SET estimated_wait_minutes = :w WHERE id = :qid"), {"w": wait_pred, "qid": queue_id})
                session.execute(text("INSERT INTO predictions (id, patient_id, appointment_id, prediction_type, model_name, model_version, input_timestamp, prediction_value, status, created_at) VALUES (:pid, :patid, :aid, 'waiting_time', 'XGBoost_Wait', 'v1.0', :now, :pval, 'Pending', :now)"), {
                    "pid": f"PRED_W_{uuid.uuid4().hex[:8]}", "patid": patient_id, "aid": appointment_id, "now": now, "pval": wait_pred
                })
            
            session.commit()
            return {"event": "patient_checked_in", "queue_id": queue_id, "appointment_id": appointment_id, "patient_id": patient_id, "predicted_wait_time": wait_pred}

    def _get_wait_features(self, session, queue_id, patient_id, doctor_id, ahead):
        hist_dur = session.execute(text("SELECT average_consultation_duration FROM doctors WHERE id = :did"), {"did": doctor_id}).scalar() or 15.0
        appt_type = session.execute(text("SELECT appointment_type FROM appointments WHERE id = (SELECT appointment_id FROM queue_entries WHERE id = :qid)"), {"qid": queue_id}).scalar() or 'Routine'
        now = datetime.datetime.now()
        df = pd.DataFrame([{
            'patients_ahead': ahead, 'queue_length': ahead + 1, 'doctor_workload': ahead * hist_dur,
            'historical_consultation_duration': hist_dur, 'hour': now.hour, 'day_of_week': now.weekday()
        }])
        df[f'appointment_type_{appt_type}'] = 1
        return self._align_features(df, self.wait_cols)

    def process_patient_readiness(self, patient_id, payload):
        with self.Session() as session:
            q = session.execute(text("SELECT id, appointment_id FROM queue_entries WHERE patient_id = :pid AND status = 'Waiting'"), {"pid": patient_id}).fetchone()
            if not q: return {"error": "Patient not in waiting queue"}
            now = datetime.datetime.now()
            existing = session.execute(text("SELECT id FROM patient_readiness WHERE patient_id = :pid"), {"pid": patient_id}).fetchone()
            if existing:
                session.execute(text("UPDATE patient_readiness SET readiness_score = :rs, updated_at = :now WHERE patient_id = :pid"), {"rs": payload.get('readiness_score', 100.0), "now": now, "pid": patient_id})
            else:
                session.execute(text("INSERT INTO patient_readiness (id, patient_id, appointment_id, intake_status, readiness_score, generated_at, updated_at) VALUES (:id, :pid, :aid, 'Ready', :rs, :now, :now)"), {
                    "id": f"PR_{uuid.uuid4().hex[:8]}", "pid": patient_id, "aid": q[1], "rs": payload.get('readiness_score', 100.0), "now": now
                })
            
            self._track_journey(session, patient_id, q[1], "Nurse Preparation")
            session.commit()
            return {"event": "patient_readiness_updated", "patient_id": patient_id, "readiness_score": payload.get('readiness_score', 100.0)}

    def process_call_next(self, queue_id):
        with self.Session() as session:
            res = session.execute(text("SELECT patient_id, appointment_id FROM queue_entries WHERE id = :qid"), {"qid": queue_id}).fetchone()
            if not res: return {"error": "Queue entry not found"}
            now = datetime.datetime.now()
            session.execute(text("UPDATE queue_entries SET status = 'Called', called_at = :now WHERE id = :qid"), {"qid": queue_id, "now": now})
            
            doc_id = session.execute(text("SELECT doctor_id FROM queue_entries WHERE id = :qid"), {"qid": queue_id}).scalar()
            session.execute(text("UPDATE queue_entries SET queue_position = max(0, queue_position - 1) WHERE doctor_id = :did AND status = 'Waiting'"), {"did": doc_id})
            self._track_journey(session, res[0], res[1], "Called")
            session.commit()
            return {"event": "patient_called", "queue_id": queue_id, "patient_id": res[0]}

    def process_consultation_start(self, queue_id):
        with self.Session() as session:
            now = datetime.datetime.now()
            session.execute(text("UPDATE queue_entries SET status = 'In Consultation', consultation_started_at = :now WHERE id = :qid"), {"qid": queue_id, "now": now})
            res = session.execute(text("SELECT appointment_id, patient_id, doctor_id FROM queue_entries WHERE id = :qid"), {"qid": queue_id}).fetchone()
            appt_id, pat_id, doc_id = res
            
            consult_id = f"C_{uuid.uuid4().hex[:8]}"
            session.execute(text("INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, started_at, status) VALUES (:cid, :aid, :pid, :did, :now, 'In Progress')"), {
                "cid": consult_id, "aid": appt_id, "pid": pat_id, "did": doc_id, "now": now
            })
            self._track_journey(session, pat_id, appt_id, "Consultation")
            
            dur_pred = 15.0
            if self.dur_model:
                hist_dur = session.execute(text("SELECT average_consultation_duration FROM doctors WHERE id = :did"), {"did": doc_id}).scalar() or 15.0
                df_dur = self._align_features(pd.DataFrame([{'historical_duration': hist_dur, 'hour': now.hour, 'day_of_week': now.weekday()}]), self.dur_cols)
                dur_pred = float(self.dur_model.predict(df_dur)[0])
                session.execute(text("UPDATE consultations SET predicted_duration_minutes = :dp WHERE id = :cid"), {"dp": dur_pred, "cid": consult_id})
                session.execute(text("INSERT INTO predictions (id, patient_id, appointment_id, prediction_type, model_name, model_version, input_timestamp, prediction_value, status, created_at) VALUES (:pid, :patid, :aid, 'consultation_duration', 'XGBoost_Dur', 'v1.0', :now, :pval, 'Pending', :now)"), {
                    "pid": f"PRED_D_{uuid.uuid4().hex[:8]}", "patid": pat_id, "aid": appt_id, "now": now, "pval": dur_pred
                })
            session.commit()
            return {"event": "consultation_started", "consultation_id": consult_id, "predicted_duration": dur_pred}

    def process_consultation_end(self, consultation_id, actual_duration_minutes):
        with self.Session() as session:
            now = datetime.datetime.now()
            session.execute(text("UPDATE consultations SET completed_at = :now, actual_duration_minutes = :dur, status = 'Completed' WHERE id = :cid"), {"now": now, "dur": actual_duration_minutes, "cid": consultation_id})
            res = session.execute(text("SELECT appointment_id, patient_id FROM consultations WHERE id = :cid"), {"cid": consultation_id}).fetchone()
            appt_id, pat_id = res
            
            session.execute(text("UPDATE queue_entries SET status = 'Completed', consultation_completed_at = :now WHERE appointment_id = :aid"), {"now": now, "aid": appt_id})
            
            pred = session.execute(text("SELECT id, prediction_value FROM predictions WHERE appointment_id = :aid AND prediction_type = 'consultation_duration'"), {"aid": appt_id}).fetchone()
            error_data = {}
            if pred:
                pred_id, pred_val = pred
                abs_err = abs(pred_val - actual_duration_minutes)
                perc_err = abs_err / max(actual_duration_minutes, 1)
                session.execute(text("INSERT INTO prediction_outcomes (id, prediction_id, actual_value, absolute_error, percentage_error, recorded_at) VALUES (:oid, :pid, :val, :err, :perc, :now)"), {
                    "oid": f"OUT_D_{uuid.uuid4().hex[:8]}", "pid": pred_id, "val": actual_duration_minutes, "err": abs_err, "perc": perc_err, "now": now
                })
                session.execute(text("UPDATE predictions SET status = 'Completed' WHERE id = :pid"), {"pid": pred_id})
                session.execute(text("UPDATE consultations SET duration_error = :err WHERE id = :cid"), {"err": abs_err, "cid": consultation_id})
                error_data = {"predicted": pred_val, "actual": actual_duration_minutes, "error_minutes": abs_err}
                
            self._track_journey(session, pat_id, appt_id, "Consultation Completed")
            session.commit()
            return {"event": "consultation_completed", "consultation_id": consultation_id, "outcome": error_data}

    def process_prescription(self, patient_id, appointment_id, doctor_id, consultation_id, medicine_name, dosage, frequency, duration_days):
        with self.Session() as session:
            now = datetime.datetime.now()
            pid = f"RX_{uuid.uuid4().hex[:8]}"
            session.execute(text("INSERT INTO prescriptions (id, patient_id, appointment_id, doctor_id, consultation_id, medicine_name, dosage, frequency, duration_days, prescribed_at, status) VALUES (:id, :pid, :aid, :did, :cid, :mname, :dos, :freq, :dur, :now, 'Active')"), {
                "id": pid, "pid": patient_id, "aid": appointment_id, "did": doctor_id, "cid": consultation_id, "mname": medicine_name, "dos": dosage, "freq": frequency, "dur": duration_days, "now": now
            })
            
            # Simple mock generation for the schedule
            for day in range(duration_days):
                date_str = (now + datetime.timedelta(days=day)).strftime("%Y-%m-%d")
                for time in ["08:00", "20:00"]: # Simplified frequency map
                    sid = f"MS_{uuid.uuid4().hex[:8]}"
                    session.execute(text("INSERT INTO medication_schedules (id, prescription_id, patient_id, scheduled_date, scheduled_time, frequency, status, created_at) VALUES (:id, :rxid, :pid, :sdate, :stime, :freq, 'Upcoming', :now)"), {
                        "id": sid, "rxid": pid, "pid": patient_id, "sdate": date_str, "stime": time, "freq": frequency, "now": now
                    })
            
            self._track_journey(session, patient_id, appointment_id, "Prescription Created")
            session.commit()
            return {"event": "prescription_created", "prescription_id": pid}
