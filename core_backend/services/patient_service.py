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
                "SELECT * FROM appointments WHERE patient_id = :patient_id ORDER BY appointment_date DESC, appointment_time DESC LIMIT 1"
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
                "readiness": dict(readiness) if readiness else None
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

    def get_wait_explanation(self, patient_id: str):
        with self.Session() as session:
            today = session.execute(text(
                "SELECT id FROM appointments WHERE patient_id = :patient_id ORDER BY appointment_date DESC LIMIT 1"
            ), {"patient_id": patient_id}).mappings().first()

            if not today:
                return {"explanation": "Explanation currently unavailable.", "factors": []}

            queue_entry = session.execute(text(
                "SELECT id, queue_position FROM queue_entries WHERE appointment_id = :appointment_id"
            ), {"appointment_id": today['id']}).mappings().first()

            if not queue_entry:
                return {"explanation": "Explanation currently unavailable.", "factors": []}

            from services.ml_service import MLService
            ml = MLService()
            ml_pred = ml.get_waiting_time_prediction(queue_entry['id'])
            
            if ml_pred.get("status") == "SUCCESS" and ml_pred.get("shap"):
                shap_data = ml_pred.get("shap")
                factors = []
                for k, v in shap_data.items():
                    factors.append({"label": k.replace("_", " ").title(), "impact": f"{v:+.2f}"})
                
                # Sort by absolute impact descending
                factors.sort(key=lambda x: abs(float(x["impact"])), reverse=True)
                
                return {
                    "explanation": "Based on real-time clinic workload models.",
                    "factors": factors,
                    "estimated_wait": ml_pred.get("predicted_waiting_time")
                }
            
            return {"explanation": "Explanation currently unavailable.", "factors": []}

    def get_patient_medications(self, patient_id: str):
        with self.Session() as session:
            prescriptions = session.execute(text(
                "SELECT * FROM prescriptions WHERE patient_id = :patient_id"
            ), {"patient_id": patient_id}).mappings().all()

            meds = []
            for rx in prescriptions:
                rx_dict = dict(rx)
                schedules = session.execute(text(
                    "SELECT * FROM medication_schedules WHERE prescription_id = :prescription_id"
                ), {"prescription_id": rx['id']}).mappings().all()
                rx_dict['schedules'] = [dict(s) for s in schedules]
                meds.append(rx_dict)

            return meds
