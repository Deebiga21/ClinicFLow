import os
from sqlalchemy import create_engine, text, func, and_
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from database.models import QueueEntry, Appointment, Doctor, Prediction, PredictionOutcome, ModelVersion, Anomaly

class AdminService:
    def __init__(self, db_url="sqlite:///d:/clinic-queue -updated/core_backend/clinic_core_v2.db"):
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)

    def get_analytics(self):
        with self.Session() as session:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            patients_today = session.query(func.count(QueueEntry.id)).filter(QueueEntry.created_at >= today).scalar() or 0
            appointments_today = session.query(func.count(Appointment.id)).filter(Appointment.created_at >= today).scalar() or 0
            
            current_queue = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Waiting', QueueEntry.created_at >= today).scalar() or 0
            active_consultations = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'In Consultation').scalar() or 0
            
            shapData = []
            try:
                first_waiting = session.query(QueueEntry).filter(QueueEntry.status == 'Waiting', QueueEntry.created_at >= today).first()
                if first_waiting:
                    from services.ml_service import MLService
                    ml = MLService()
                    pred_res = ml.get_waiting_time_prediction(first_waiting.id)
                    if "shap" in pred_res and "contributions" in pred_res["shap"]:
                        raw_contributions = pred_res["shap"]["contributions"]
                        for item in raw_contributions:
                            shapData.append({"name": item["feature"].replace('_', ' ').title(), "value": item["contribution"]})
            except Exception as e:
                pass
            
            return {
                "patients_today": patients_today,
                "appointments_today": appointments_today,
                "current_queue": current_queue,
                "active_consultations": active_consultations,
                "clinic_load": min(100, (current_queue * 10) + (active_consultations * 15)),
                "predicted_peak": {"time": "11:00 AM"},
                "clinic_status": "Normal" if current_queue < 10 else "Congested",
                "shapData": shapData,
                "flow": {
                    "appointments": appointments_today,
                    "check_in": session.query(func.count(Appointment.id)).filter(Appointment.status == 'Checked In', Appointment.created_at >= today).scalar() or 0,
                    "queue": current_queue,
                    "nurse": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'With Nurse', QueueEntry.created_at >= today).scalar() or 0,
                    "doctor": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'With Doctor', QueueEntry.created_at >= today).scalar() or 0,
                    "consultation": active_consultations,
                    "completed": session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Completed', QueueEntry.created_at >= today).scalar() or 0
                }
            }

    
    def get_patient_flow_summary(self):
        with self.Session() as session:
            today = datetime.now().date()
            start_today = datetime.combine(today, datetime.min.time())
            
            # Appointments
            appointments = session.query(func.count(Appointment.id)).filter(Appointment.created_at >= start_today).scalar() or 0
            
            # Check-ins
            checked_in = session.query(func.count(Appointment.id)).filter(Appointment.check_in_time >= start_today).scalar() or 0
            
            # Queue
            waiting = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Waiting').scalar() or 0
            in_consult = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'In Consultation').scalar() or 0
            completed = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Completed', QueueEntry.created_at >= start_today).scalar() or 0
            
            # Additional Journey stages
            nurse_prep = session.query(func.count(PatientJourney.id)).filter(PatientJourney.current_stage == 'Nurse', PatientJourney.status == 'In Progress').scalar() or 0
            doctor = session.query(func.count(PatientJourney.id)).filter(PatientJourney.current_stage == 'Doctor', PatientJourney.status == 'In Progress').scalar() or 0
            prescribing = session.query(func.count(PatientJourney.id)).filter(PatientJourney.current_stage == 'Prescription', PatientJourney.status == 'In Progress').scalar() or 0
            medication = session.query(func.count(PatientJourney.id)).filter(PatientJourney.current_stage == 'Medication', PatientJourney.status == 'In Progress').scalar() or 0
            followup = session.query(func.count(PatientJourney.id)).filter(PatientJourney.current_stage == 'Follow-up', PatientJourney.status == 'In Progress').scalar() or 0
            
            avg_wait = session.query(func.avg(QueueEntry.actual_wait_minutes)).filter(QueueEntry.status == 'Completed', QueueEntry.created_at >= start_today).scalar()
            avg_consult = session.query(func.avg(Consultation.actual_duration_minutes)).filter(Consultation.started_at >= start_today).scalar()
            
            hours_elapsed = (datetime.now() - start_today).total_seconds() / 3600.0
            flow_velocity = completed / hours_elapsed if hours_elapsed > 0 else 0
            
            # Wait prediction
            pred = session.execute(text("SELECT prediction_value FROM predictions WHERE prediction_type = 'waiting_time' ORDER BY created_at DESC LIMIT 1")).mappings().first()
            predicted_wait = float(pred['prediction_value']) if pred else 0
            
            # Alerts
            alerts = []
            if avg_wait and avg_wait > 30:
                alerts.append({"type": "warning", "message": "Queue wait times exceeding 30 minutes.", "timestamp": datetime.now().isoformat()})
            if waiting > 10:
                alerts.append({"type": "danger", "message": "Queue accumulation detected (>10).", "timestamp": datetime.now().isoformat()})
                
            return {
                "patientsToday": appointments,
                "checkedIn": checked_in,
                "currentlyWaiting": waiting,
                "currentlyConsulting": in_consult,
                "completed": completed,
                "avgWait": round(float(avg_wait or 0), 1),
                "predictedWait": round(predicted_wait, 1),
                "avgConsultation": round(float(avg_consult or 0), 1),
                "flowVelocity": round(flow_velocity, 1),
                "alerts": alerts,
                "pipeline": {
                    "Appointment": appointments,
                    "Check-in": checked_in,
                    "Queue": waiting,
                    "Nurse": nurse_prep,
                    "Doctor": doctor,
                    "Consultation": in_consult,
                    "Prescription": prescribing,
                    "Medication": medication,
                    "Follow-up": followup,
                    "Completed": completed
                },
                "funnel": [
                    {"stage": "Check-in -> Queue", "avg": "8 min", "pct": 95},
                    {"stage": "Queue -> Doctor", "avg": f"{round(float(avg_wait or 0), 1)} min", "pct": 80},
                    {"stage": "Doctor -> Consultation", "avg": "2 min", "pct": 100}
                ]
            }

    def get_patient_flow_chart(self):
        with self.Session() as session:
            hours = [f"{str(i).zfill(2)}" for i in range(8, 19)]
            results = []
            for h in hours:
                arrivals = session.query(func.count(QueueEntry.id)).filter(func.strftime('%H', QueueEntry.entered_queue_at) == h).scalar() or 0
                consulting = session.query(func.count(QueueEntry.id)).filter(func.strftime('%H', QueueEntry.consultation_started_at) == h).scalar() or 0
                completed = session.query(func.count(QueueEntry.id)).filter(func.strftime('%H', QueueEntry.consultation_completed_at) == h).scalar() or 0
                
                if arrivals > 0 or consulting > 0 or completed > 0:
                    results.append({
                        "hour": f"{h}:00",
                        "arrivals": arrivals,
                        "queueing": arrivals,
                        "consulting": consulting,
                        "completed": completed
                    })
            return results

    def get_workload_summary(self):
        with self.Session() as session:
            # 1. Fetch all doctors and their departments
            doctors = session.query(Doctor).all()
            departments = list(set([d.department or "General" for d in doctors]))
            
            # Dictionary to hold stats for "All Departments" + each individual one
            stats = {}
            
            # Helper to calculate stats for a specific list of doctors
            def calc_stats(doc_list):
                if not doc_list:
                    return {
                        "activeDoctors": 0, "activeConsultations": 0, "upcomingAppointments": 0,
                        "avgDuration": "0 min", "currentWorkload": "Low", "predictedPeak": "N/A"
                    }
                doc_ids = [d.id for d in doc_list]
                
                active_docs = len([d for d in doc_list if d.active])
                
                active_consultations = session.query(func.count(QueueEntry.id)).filter(
                    QueueEntry.doctor_id.in_(doc_ids), QueueEntry.status == 'In Consultation'
                ).scalar() or 0
                
                upcoming = session.query(func.count(Appointment.id)).filter(
                    Appointment.doctor_id.in_(doc_ids), Appointment.status == 'Scheduled'
                ).scalar() or 0
                
                total_q = session.query(func.count(QueueEntry.id)).filter(QueueEntry.doctor_id.in_(doc_ids)).scalar() or 0
                
                workload = "High" if total_q > 5 else "Medium" if total_q > 2 else "Low"
                
                avg_dur = sum([float(d.average_consultation_duration or 15) for d in doc_list]) / len(doc_list)
                
                return {
                    "activeDoctors": active_docs,
                    "activeConsultations": active_consultations,
                    "upcomingAppointments": upcoming,
                    "avgDuration": f"{int(avg_dur)} min",
                    "currentWorkload": workload,
                    "predictedPeak": "11:00 AM"
                }

            # Calculate for All Departments
            stats["All Departments"] = calc_stats(doctors)
            
            # Calculate for each department
            for dept in departments:
                dept_docs = [d for d in doctors if (d.department or "General") == dept]
                stats[dept] = calc_stats(dept_docs)
                
            return stats

    def get_workload_doctors(self):
        with self.Session() as session:
            docs = session.query(Doctor).all()
            res = []
            for d in docs:
                waiting = session.query(func.count(QueueEntry.id)).filter(QueueEntry.doctor_id == d.id, QueueEntry.status == 'Waiting').scalar() or 0
                completed = session.query(func.count(QueueEntry.id)).filter(QueueEntry.doctor_id == d.id, QueueEntry.status == 'Completed').scalar() or 0
                res.append({
                    "id": d.id,
                    "name": d.name,
                    "department": d.department or "General",
                    "currentConsultations": 1 if d.active else 0,
                    "upcomingAppointments": waiting,
                    "avgDuration": f"{int(d.average_consultation_duration or 15)} min",
                    "currentWorkload": f"{completed} pts",
                    "predictedWorkload": f"{completed + waiting} pts",
                    "status": "Available" if d.active else "Offline"
                })
            return res

    def get_workload_chart(self):
        with self.Session() as session:
            hours = [f"{str(i).zfill(2)}" for i in range(8, 19)]
            results = []
            for h in hours:
                current = session.query(func.count(QueueEntry.id)).filter(func.strftime('%H', QueueEntry.consultation_started_at) == h).scalar() or 0
                if current > 0:
                    results.append({
                        "time": f"{h}:00",
                        "current": current,
                        "predicted": int(current * 1.1),
                        "isPeak": False
                    })
            if results:
                max_entry = max(results, key=lambda x: x["predicted"])
                max_entry["isPeak"] = True
            return results

    def get_congestion_summary(self):
        with self.Session() as session:
            waiting = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Waiting').scalar() or 0
            active_docs = session.query(func.count(Doctor.id)).filter(Doctor.active == True).scalar() or 0
            
            return {
                "current": {
                    "queueSize": waiting,
                    "arrivalRate": "50/hr",
                    "serviceRate": "45/hr",
                    "activeDoctors": active_docs,
                    "appointmentLoad": "High",
                    "currentWaitTime": "25 min",
                    "currentCongestion": "Moderate"
                },
                "prediction": {
                    "congestion": "High",
                    "peakTime": "11:00 AM",
                    "expectedQueue": waiting + 10,
                    "expectedWait": "35 min",
                    "expectedArrivals": 55,
                    "riskLevel": "Medium"
                },
                "bottleneck": {
                    "predicted": "Doctor Availability",
                    "expectedTime": "11:30 AM",
                    "reason": "High patient volume",
                    "affectedStage": "Consultation"
                }
            }

    def get_congestion_chart(self):
        with self.Session() as session:
            hours = [f"{str(i).zfill(2)}" for i in range(8, 19)]
            results = []
            for h in hours:
                avg_wait = session.query(func.avg(QueueEntry.actual_wait_minutes)).filter(func.strftime('%H', QueueEntry.entered_queue_at) == h).scalar() or 0
                if avg_wait > 0:
                    results.append({
                        "time": f"{h}:00",
                        "historical": round(avg_wait, 1),
                        "predicted": round(avg_wait * 1.05, 1)
                    })
            return results

    def get_ml_models(self):
        with self.Session() as session:
            models = session.query(ModelVersion).all()
            res = []
            for m in models:
                res.append({
                    "id": m.id,
                    "name": m.model_name,
                    "version": m.version,
                    "status": m.status,
                    "trainingDate": m.training_date.isoformat().split('T')[0] if m.training_date else None,
                    "metrics": m.metrics,
                    "trainingRows": m.training_rows,
                    "target": m.target,
                    "modelFile": m.model_path,
                    "algorithm": "XGBoost Regressor" if "Time" in m.model_name else ("Random Forest" if "Show" in m.model_name else "Isolation Forest"),
                    "features": ["day_of_week", "hour", "doctor_workload", "queue_size"] if m.features else []
                })
            return res

    def get_model_performance(self, model_id):
        import json
        MODEL_NAME_MAP = {
            'waitingTime': 'Waiting Time',
            'consultationDuration': 'Consultation Duration',
            'noShow': 'No-Show',
            'anomalyDetection': 'Anomaly Detection'
        }
        db_name = MODEL_NAME_MAP.get(model_id)
        if not db_name: return None
        
        with self.Session() as session:
            row = session.execute(text("SELECT * FROM model_versions WHERE model_name = :name AND status = 'Active' ORDER BY training_date DESC LIMIT 1"), {'name': db_name}).mappings().fetchone()
            if not row: return None
            
            metrics = json.loads(row['metrics']) if row['metrics'] else {}
            if 'MAE' in metrics:
                m_type = 'regression'
                m = {'mae': metrics.get('MAE'), 'rmse': metrics.get('RMSE'), 'r2': metrics.get('R2')}
            elif 'Precision' in metrics:
                m_type = 'classification'
                m = {'precision': metrics.get('Precision'), 'recall': metrics.get('Recall'), 'f1': metrics.get('F1'), 'rocAuc': metrics.get('ROC-AUC')}
            else:
                m_type = 'anomaly'
                m = metrics
                
            return {
                'trainingDatasetSize': int(row['training_rows'] * 0.8) if row['training_rows'] else 0,
                'testDatasetSize': int(row['training_rows'] * 0.2) if row['training_rows'] else 0,
                'trainingDate': row['training_date'].split(' ')[0] if row['training_date'] else 'N/A',
                'modelVersion': row['version'],
                'lastEvaluation': row['training_date'],
                'modelType': m_type,
                'metrics': m,
                'performanceOverTime': [],
                'chartData': []
            }

    def get_explainability_data(self, model_id):
        return None

    def get_prediction_feedback(self):
        with self.Session() as session:
            outcomes = session.query(PredictionOutcome, Prediction).join(Prediction, PredictionOutcome.prediction_id == Prediction.id).limit(20).all()
            res = []
            for outcome, pred in outcomes:
                res.append({
                    "id": outcome.id,
                    "prediction_type": pred.prediction_type,
                    "predicted_value": pred.prediction_value,
                    "actual_value": outcome.actual_value,
                    "error": outcome.absolute_error,
                    "recorded_at": outcome.recorded_at.isoformat() if outcome.recorded_at else None
                })
            return res

    def get_predictions(self):
        with self.Session() as session:
            preds = session.query(Prediction).order_by(Prediction.created_at.desc()).limit(20).all()
            res = []
            for p in preds:
                res.append({
                    "id": p.id,
                    "type": p.prediction_type.replace('_', ' ').title(),
                    "prediction": f"{round(p.prediction_value, 2)} {'min' if 'time' in p.prediction_type or 'duration' in p.prediction_type else ''}",
                    "timestamp": p.created_at.isoformat().replace('T', ' ')[:16] if p.created_at else None,
                    "model": p.model_name + " v" + (p.model_version or "1.0"),
                    "explanationAvailable": True,
                    "inputContext": {"patient_id": p.patient_id, "appointment": p.appointment_id, "current_queue_size": 4},
                    "featuresUsed": ["day_of_week", "hour", "doctor_workload"]
                })
            return res

    def get_anomalies(self):
        with self.Session() as session:
            anomalies = session.query(Anomaly).order_by(Anomaly.timestamp.desc()).limit(20).all()
            res = []
            for a in anomalies:
                res.append({
                    "id": a.id,
                    "type": a.type,
                    "description": a.description,
                    "severity": a.severity,
                    "timestamp": a.timestamp.isoformat() if a.timestamp else None
                })
            return res

    def get_digital_twin_state(self):
        with self.Session() as session:
            num_doctors = session.query(func.count(Doctor.id)).filter(Doctor.active == True).scalar() or 3
            avg_consult = session.query(func.avg(Doctor.average_consultation_duration)).scalar() or 20.0
            total_appts = session.query(func.count(Appointment.id)).scalar() or 100
            arrival_rate = int(total_appts / 8) if total_appts > 0 else 15
            curr_q = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Waiting').scalar() or 0
            
            return {
                "numDoctors": num_doctors,
                "arrivalRate": arrival_rate,
                "avgConsultationDuration": float(avg_consult),
                "appointmentCapacity": 100,
                "workingHours": 8,
                "expectedQueue": curr_q,
                "expectedWaitTime": round(curr_q * float(avg_consult) / max(1, num_doctors), 1),
                "congestionLevel": min(100, int((curr_q / max(1, num_doctors)) * 10)),
                "doctorUtilization": 85,
                "patientThroughput": total_appts
            }

    def run_digital_twin_simulation(self, config):
        c = max(1, int(config.get("numDoctors", 3)))
        lam = float(config.get("arrivalRate", 15))
        dur = float(config.get("avgConsultationDuration", 20))
        hours = float(config.get("workingHours", 8))
        
        mu = 60.0 / max(1.0, dur)
        rho = lam / (c * mu)
        
        if rho >= 1:
            utilization = 99.9
            growth_rate = lam - (c * mu)
            avg_q = growth_rate * hours / 2.0
            wait_time = (avg_q / max(1, (c * mu))) * 60.0 if (c * mu) > 0 else 999
            congestion = 100
            throughput = c * mu * hours
        else:
            utilization = rho * 100
            import math
            try:
                p0_inv = sum(((c * rho)**n) / math.factorial(n) for n in range(c)) + (((c * rho)**c) / (math.factorial(c) * (1 - rho)))
                p0 = 1.0 / p0_inv
                lq = (p0 * ((lam / mu)**c) * rho) / (math.factorial(c) * ((1 - rho)**2))
                avg_q = lq
                wait_time = (lq / lam) * 60.0 if lam > 0 else 0
            except:
                avg_q = 0
                wait_time = 0
                
            congestion = min(100, (avg_q / 5.0) * 100)
            throughput = lam * hours

        return {
            "expectedQueue": round(avg_q, 1),
            "expectedWaitTime": round(wait_time, 1),
            "congestionLevel": round(congestion, 1),
            "doctorUtilization": round(utilization, 1),
            "patientThroughput": round(throughput, 0)
        }
