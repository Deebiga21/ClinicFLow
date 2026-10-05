import json
from sqlalchemy import text
from services.orchestration import OrchestrationService

class PatientService:
    def __init__(self):
        self.orchestrator = OrchestrationService()
        self.Session = self.orchestrator.Session

    def get_visit_status(self, patient_id: str):
        with self.Session() as session:
            today = session.execute(text(
                """SELECT a.*, d.name as doctor_name, d.department as doctor_department 
                   FROM appointments a 
                   LEFT JOIN doctors d ON a.doctor_id = d.id 
                   WHERE a.patient_id = :patient_id 
                   ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 1"""
            ), {"patient_id": patient_id}).mappings().first()

            if not today:
                return {}

            appointment_id = today['id']
            queue_status = session.execute(text(
                "SELECT * FROM queue_entries WHERE appointment_id = :appointment_id"
            ), {"appointment_id": appointment_id}).mappings().first()

            waiting_prediction = session.execute(text(
                "SELECT * FROM predictions WHERE patient_id = :patient_id AND prediction_type = 'waiting_time' ORDER BY created_at DESC LIMIT 1"
            ), {"patient_id": patient_id}).mappings().first()

            readiness = session.execute(text(
                "SELECT * FROM patient_readiness WHERE appointment_id = :appointment_id"
            ), {"appointment_id": appointment_id}).mappings().first()

            

            return {
                "appointment": dict(today),
                "queue_status": dict(queue_status) if queue_status else None,
                "waiting_prediction": dict(waiting_prediction) if waiting_prediction else None,
                "readiness": dict(readiness) if readiness else None,
                
            }

    def get_patient_journey(self, patient_id: str):
        with self.Session() as session:
            today = session.execute(text(
                "SELECT id FROM appointments WHERE patient_id = :patient_id ORDER BY appointment_date DESC LIMIT 1"
            ), {"patient_id": patient_id}).mappings().first()

            if not today:
                return []

            j_rows = session.execute(text(
                "SELECT * FROM patient_journeys WHERE appointment_id = :appointment_id ORDER BY stage_started_at"
            ), {"appointment_id": today['id']}).mappings().all()

            return [dict(r) for r in j_rows]

    def get_patient_medications(self, patient_id: str):
        with self.Session() as session:
            prescriptions = session.execute(text(
                "SELECT * FROM prescriptions WHERE patient_id = :patient_id ORDER BY prescribed_at DESC"
            ), {"patient_id": patient_id}).mappings().all()

            schedules = session.execute(text(
                "SELECT * FROM medication_schedules WHERE patient_id = :patient_id ORDER BY scheduled_time ASC"
            ), {"patient_id": patient_id}).mappings().all()

            results = []
            for p in prescriptions:
                p_dict = dict(p)
                p_dict['schedules'] = [dict(s) for s in schedules if s['prescription_id'] == p['id']]
                results.append(p_dict)

            return results

    def get_wait_explanation(self, patient_id: str):
        with self.Session() as session:
            prediction = session.execute(text(
                "SELECT * FROM predictions WHERE patient_id = :patient_id AND prediction_type = 'waiting_time' ORDER BY created_at DESC LIMIT 1"
            ), {"patient_id": patient_id}).mappings().first()
            
            if not prediction:
                return {"factors": []}
            
            # Simulated explanation from ML model (would use SHAP in real system)
            return {
                "factors": [
                    {"name": "Patients Ahead", "impact": "High", "value": "Adds 20 mins"},
                    {"name": "Doctor Workload", "impact": "Medium", "value": "Adds 5 mins"},
                ],
                "confidence": prediction.get('confidence_score', 0.85)
            }
