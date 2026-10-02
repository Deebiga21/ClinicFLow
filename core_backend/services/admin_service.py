import os
from sqlalchemy import create_engine, text, func, and_
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from database.models import QueueEntry, Appointment, Doctor, Prediction, PredictionOutcome, ModelVersion, Anomaly

class AdminService:
    def __init__(self, db_url="sqlite:///clinic_core_v2.db"):
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)

    def get_analytics(self):
        with self.Session() as session:
            today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
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
            today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            total = session.query(func.count(QueueEntry.id)).filter(QueueEntry.created_at >= today).scalar() or 0
            completed = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Completed', QueueEntry.created_at >= today).scalar() or 0
            waiting = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'Waiting', QueueEntry.created_at >= today).scalar() or 0
            in_consult = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'In Consultation', QueueEntry.created_at >= today).scalar() or 0
            checked_in = total - waiting - in_consult - completed if (total - waiting - in_consult - completed) > 0 else total
            
            return {
                "patientsToday": total,
                "checkedIn": total,
                "currentlyWaiting": waiting,
                "currentlyConsulting": in_consult,
                "completed": completed,
                "stages": [
                    {"name": "Check-in", "count": total, "avgDuration": "5 min"},
                    {"name": "Waiting", "count": waiting, "avgDuration": "25 min", "predictedDelay": "5 min"},
                    {"name": "Consultation", "count": in_consult, "avgDuration": "15 min"},
                    {"name": "Completed", "count": completed, "avgDuration": "-"}
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
            active_docs = session.query(func.count(Doctor.id)).filter(Doctor.active == True).scalar() or 0
            active_consultations = session.query(func.count(QueueEntry.id)).filter(QueueEntry.status == 'In Consultation').scalar() or 0
            total_patients = session.query(func.count(QueueEntry.id)).scalar() or 0
            
            return {
                "activeDoctors": active_docs,
                "activeConsultations": active_consultations,
                "upcomingAppointments": session.query(func.count(Appointment.id)).filter(Appointment.status == 'Scheduled').scalar() or 0,
                "avgDuration": "15 min",
                "currentWorkload": "High",
                "predictedPeak": "11:00 AM"
            }

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
                    "training_date": m.training_date.isoformat() if m.training_date else None,
                    "metrics": m.metrics
                })
            
            if not res:
                models_dir = "saved_models"
                expected_models = [
                    {"name": "Waiting Time", "file": "waiting_time_model.pkl"},
                    {"name": "Consultation Duration", "file": "consultation_duration_model.pkl"},
                    {"name": "No-show", "file": "no_show_model.pkl"},
                    {"name": "Anomaly Detection", "file": "anomaly_model.pkl"}
                ]
                
                for i, m in enumerate(expected_models):
                    path = os.path.join(models_dir, m["file"])
                    if os.path.exists(path):
                        res.append({
                            "id": f"model_{i}",
                            "name": m["name"],
                            "version": "1.0",
                            "status": "Active",
                            "training_date": datetime.now().isoformat(),
                            "metrics": None
                        })
                    else:
                        res.append({
                            "id": f"model_{i}",
                            "name": m["name"],
                            "version": "N/A",
                            "status": "NOT_TRAINED",
                            "training_date": None,
                            "metrics": None
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
                    "type": p.prediction_type,
                    "value": p.prediction_value,
                    "timestamp": p.created_at.isoformat() if p.created_at else None
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
