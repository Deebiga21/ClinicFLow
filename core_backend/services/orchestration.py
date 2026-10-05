from sqlalchemy import text
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import joblib
import pandas as pd
import numpy as np
import os
import json

class OrchestrationService:
    def _update_journey(self, session, patient_id, appointment_id, new_stage):
        from database.models import PatientJourney
        import datetime
        import uuid
        now = datetime.datetime.utcnow()
        # Find existing active journey
        journey = session.query(PatientJourney).filter_by(appointment_id=appointment_id).first()
        if not journey:
            journey = PatientJourney(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                appointment_id=appointment_id,
                current_stage=new_stage,
                stage_started_at=now,
                status='Active'
            )
            session.add(journey)
        else:
            journey.previous_stage = journey.current_stage
            journey.current_stage = new_stage
            journey.stage_completed_at = now
            # Create a new record for historical tracking or just update the row?
            # The schema looks like it just tracks current_stage. 
            # We will update it.
            journey.stage_started_at = now
    def __init__(self, db_url="sqlite:///clinic_core_v2.db"):
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)
        
        # Load models
        base_path = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
        self.wait_model = joblib.load(f"{base_path}/waiting_time_model.pkl")
        self.wait_cols = joblib.load(f"{base_path}/waiting_time_columns.pkl")
        
        self.dur_model = joblib.load(f"{base_path}/consultation_duration_model.pkl")
        self.dur_cols = joblib.load(f"{base_path}/consultation_duration_columns.pkl")
        
        self.ns_model = joblib.load(f"{base_path}/no_show_model.pkl")
        self.ns_cols = joblib.load(f"{base_path}/no_show_columns.pkl")

    def _align_features(self, df, required_columns):
        """Aligns a dataframe to the exact columns expected by a model (e.g., after one-hot encoding)."""
        for col in required_columns:
            if col not in df.columns:
                df[col] = 0
        return df[required_columns]

    def process_patient_check_in(self, appointment_id):
        # 1. Update queue/check-in in DB
        with self.Session() as session:
            # Find appointment
            res = session.execute(text(f"SELECT patient_id, doctor_id FROM appointments WHERE id = '{appointment_id}'")).fetchone()
            if not res:
                return {"error": "Appointment not found"}
            patient_id, doctor_id = res
            
            # Count patients ahead
            ahead = session.execute(text(f"SELECT count(*) FROM queue_entries WHERE doctor_id = '{doctor_id}' AND status = 'Waiting'")).scalar()
            
            queue_id = f"Q_NEW_{int(datetime.datetime.now().timestamp())}"
            now = datetime.datetime.now()
            
            session.execute(text(f"""
                INSERT INTO queue_entries (id, appointment_id, patient_id, doctor_id, token_number, queue_position, status, entered_queue_at, created_at, updated_at)
                VALUES ('{queue_id}', '{appointment_id}', '{patient_id}', '{doctor_id}', {ahead + 1}, {ahead + 1}, 'Waiting', '{now}', '{now}', '{now}')
            """))
            session.commit()
            
            # Predict Waiting Time
            features = self._get_wait_features(session, queue_id, patient_id, doctor_id, ahead)
            wait_pred = float(self.wait_model.predict(features)[0])
            
            # Update estimated wait time
            session.execute(text(f"UPDATE queue_entries SET estimated_wait_minutes = {wait_pred} WHERE id = '{queue_id}'"))
            
            pred_id = f"PRED_W_{int(now.timestamp())}"
            session.execute(text(f"""
                INSERT INTO predictions (id, patient_id, appointment_id, prediction_type, model_name, model_version, input_timestamp, prediction_value, status, created_at)
                VALUES ('{pred_id}', '{patient_id}', '{appointment_id}', 'waiting_time', 'XGBoost_Wait', 'v1.0', '{now}', {wait_pred}, 'Pending', '{now}')
            """))
            self._update_journey(session, patient_id, appointment_id, 'WAITING')
            session.commit()
            
            return {
                "event": "PATIENT_CHECKED_IN",
                "queue_id": queue_id,
                "appointment_id": appointment_id,
                "predicted_wait_time": wait_pred,
                "prediction_explanation": {
                    "patients_ahead": ahead,
                    "doctor_workload": features['doctor_workload'].iloc[0]
                }
            }

    def _get_wait_features(self, session, queue_id, patient_id, doctor_id, ahead):
        # Build realtime feature row
        hist_dur = session.execute(text(f"SELECT average_consultation_duration FROM doctors WHERE id = '{doctor_id}'")).scalar() or 15.0
        appt_type = session.execute(text(f"SELECT appointment_type FROM appointments WHERE id = (SELECT appointment_id FROM queue_entries WHERE id = '{queue_id}')")).scalar() or 'Routine'
        
        now = datetime.datetime.now()
        df = pd.DataFrame([{
            'patients_ahead': ahead,
            'queue_length': ahead + 1,
            'doctor_workload': ahead * hist_dur,
            'historical_consultation_duration': hist_dur,
            'hour': now.hour,
            'day_of_week': now.weekday()
        }])
        
        df[f'appointment_type_{appt_type}'] = 1
        df = self._align_features(df, self.wait_cols)
        return df


    def process_nurse_start(self, queue_id):
        with self.Session() as session:
            session.execute(text(f"UPDATE queue_entries SET status = 'With Nurse' WHERE id = '{queue_id}'"))
            res = session.execute(text(f"SELECT appointment_id, patient_id FROM queue_entries WHERE id = '{queue_id}'")).fetchone()
            if res:
                self._update_journey(session, res[1], res[0], 'NURSE_PREPARATION')
            session.commit()
            return {"event": "NURSE_PREPARATION_STARTED", "queue_id": queue_id, "patient_id": res[1] if res else None}

    def process_nurse_mark_ready(self, queue_id):
        with self.Session() as session:
            session.execute(text(f"UPDATE queue_entries SET status = 'Ready' WHERE id = '{queue_id}'"))
            res = session.execute(text(f"SELECT appointment_id, patient_id FROM queue_entries WHERE id = '{queue_id}'")).fetchone()
            if res:
                self._update_journey(session, res[1], res[0], 'READY_FOR_DOCTOR')
            session.commit()
            return {"event": "PATIENT_READY", "queue_id": queue_id, "patient_id": res[1] if res else None}

    def process_send_to_doctor(self, queue_id):
        with self.Session() as session:
            session.execute(text(f"UPDATE queue_entries SET status = 'With Doctor' WHERE id = '{queue_id}'"))
            res = session.execute(text(f"SELECT appointment_id, patient_id FROM queue_entries WHERE id = '{queue_id}'")).fetchone()
            if res:
                self._update_journey(session, res[1], res[0], 'WITH_DOCTOR')
            session.commit()
            return {"event": "PATIENT_SENT_TO_DOCTOR", "queue_id": queue_id, "patient_id": res[1] if res else None}

    def process_consultation_start(self, queue_id):
        with self.Session() as session:
            # Update queue
            session.execute(text(f"UPDATE queue_entries SET status = 'In Consultation', called_at = '{datetime.datetime.now()}', consultation_started_at = '{datetime.datetime.now()}' WHERE id = '{queue_id}'"))
            
            # Get data
            res = session.execute(text(f"SELECT appointment_id, patient_id, doctor_id FROM queue_entries WHERE id = '{queue_id}'")).fetchone()
            appt_id, pat_id, doc_id = res
            
            # Insert consultation
            consult_id = f"C_NEW_{int(datetime.datetime.now().timestamp())}"
            session.execute(text(f"""
                INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, started_at, status)
                VALUES ('{consult_id}', '{appt_id}', '{pat_id}', '{doc_id}', '{datetime.datetime.now()}', 'In Progress')
            """))
            
            # Predict Duration
            hist_dur = session.execute(text(f"SELECT average_consultation_duration FROM doctors WHERE id = '{doc_id}'")).scalar() or 15.0
            
            df_dur = pd.DataFrame([{
                'historical_duration': hist_dur,
                'hour': datetime.datetime.now().hour,
                'day_of_week': datetime.datetime.now().weekday()
            }])
            df_dur = self._align_features(df_dur, self.dur_cols)
            
            dur_pred = float(self.dur_model.predict(df_dur)[0])
            
            # Update consultation with prediction
            session.execute(text(f"UPDATE consultations SET predicted_duration_minutes = {dur_pred} WHERE id = '{consult_id}'"))
            
            pred_id = f"PRED_D_{int(datetime.datetime.now().timestamp())}"
            session.execute(text(f"""
                INSERT INTO predictions (id, patient_id, appointment_id, prediction_type, model_name, model_version, input_timestamp, prediction_value, status, created_at)
                VALUES ('{pred_id}', '{pat_id}', '{appt_id}', 'consultation_duration', 'XGBoost_Dur', 'v1.0', '{datetime.datetime.now()}', {dur_pred}, 'Pending', '{datetime.datetime.now()}')
            """))
            self._update_journey(session, pat_id, appt_id, 'CONSULTATION')
            session.commit()
            
            return {
                "event": "CONSULTATION_STARTED",
                "consultation_id": consult_id,
                "predicted_duration": dur_pred
            }

    def process_consultation_end(self, consultation_id, actual_duration_minutes):
        with self.Session() as session:
            # Update consultation
            now = datetime.datetime.now()
            session.execute(text(f"""
                UPDATE consultations 
                SET completed_at = '{now}', actual_duration_minutes = {actual_duration_minutes}, status = 'Completed'
                WHERE id = '{consultation_id}'
            """))
            
            # Find the prediction
            appt_id = session.execute(text(f"SELECT appointment_id FROM consultations WHERE id = '{consultation_id}'")).scalar()
            pred = session.execute(text(f"""
                SELECT id, prediction_value 
                FROM predictions 
                WHERE appointment_id = '{appt_id}' AND prediction_type = 'consultation_duration'
            """)).fetchone()
            
            error_data = {}
            if pred:
                pred_id, pred_val = pred
                abs_err = abs(pred_val - actual_duration_minutes)
                perc_err = abs_err / max(actual_duration_minutes, 1)
                session.execute(text(f"""
                    INSERT INTO prediction_outcomes (id, prediction_id, actual_value, absolute_error, percentage_error, recorded_at)
                    VALUES ('OUT_D_{int(now.timestamp())}', '{pred_id}', {actual_duration_minutes}, {abs_err}, {perc_err}, '{now}')
                """))
                session.execute(text(f"UPDATE predictions SET status = 'Completed' WHERE id = '{pred_id}'"))
                
                # Update duration error in consultation
                session.execute(text(f"UPDATE consultations SET duration_error = {abs_err} WHERE id = '{consultation_id}'"))
                error_data = {"predicted": pred_val, "actual": actual_duration_minutes, "error_minutes": abs_err}
                
            pat_id = session.execute(text(f"SELECT patient_id FROM consultations WHERE id = '{consultation_id}'")).scalar()
            if appt_id and pat_id:
                self._update_journey(session, pat_id, appt_id, 'COMPLETED')
                
            session.commit()
            
            return {
                "event": "CONSULTATION_COMPLETED",
                "consultation_id": consultation_id,
                "outcome": error_data
            }
