from fastapi import APIRouter
from sqlalchemy import text
from services.patient_service import PatientService
from services.orchestration import OrchestrationService

router = APIRouter(tags=["patient"])
patient_service = PatientService()
orchestrator = OrchestrationService()

@router.get("/api/patient/dashboard/{patient_id}")
def get_patient_dashboard(patient_id: str):
    with orchestrator.Session() as session:
        # Patient Info
        patient = session.execute(text("SELECT * FROM patients WHERE id = :patient_id"), {"patient_id": patient_id}).mappings().first()
        if not patient:
            return {"error": "Patient not found"}
            
        visit_status = patient_service.get_visit_status(patient_id)
        journey = patient_service.get_patient_journey(patient_id)
        medications = patient_service.get_patient_medications(patient_id)
        
        upcoming = session.execute(text(
            "SELECT * FROM appointments WHERE patient_id = :patient_id AND status = 'Scheduled'"
        ), {"patient_id": patient_id}).mappings().all()

        return {
            "patient": dict(patient),
            "today_appointment": visit_status.get("appointment"),
            "check_in_status": bool(visit_status.get("queue_status")),
            "queue_status": visit_status.get("queue_status"),
            "waiting_prediction": visit_status.get("waiting_prediction"),
            "readiness": visit_status.get("readiness"),
            "journey": journey,
            "next_expected_event": {"event": "Consultation", "time": "Soon"} if visit_status.get("queue_status") and visit_status.get("queue_status").get('status') == 'Waiting' else None,
            "medication_summary": medications,
            "upcoming_appointments": [dict(u) for u in upcoming],
            "notifications": []
        }

@router.get("/api/patient/{patient_id}/visit-status")
def get_visit_status(patient_id: str):
    return patient_service.get_visit_status(patient_id)

@router.get("/api/patient-journey/{patient_id}")
def get_patient_journey(patient_id: str):
    return patient_service.get_patient_journey(patient_id)

@router.get("/api/readiness/{patient_id}")
def get_patient_readiness(patient_id: str):
    status = patient_service.get_visit_status(patient_id)
    return status.get("readiness", {})

@router.get("/api/patient/{patient_id}/wait-explanation")
def get_wait_explanation(patient_id: str):
    return patient_service.get_wait_explanation(patient_id)

@router.get("/api/prescriptions/{patient_id}")
def get_prescriptions(patient_id: str):
    meds = patient_service.get_patient_medications(patient_id)
    # Just returning the prescriptions without schedules if preferred, or the full meds structure
    return meds

@router.get("/api/medication-schedules/{patient_id}")
def get_medication_schedules(patient_id: str):
    with orchestrator.Session() as session:
        schedules = session.execute(text(
            "SELECT * FROM medication_schedules WHERE patient_id = :patient_id"
        ), {"patient_id": patient_id}).mappings().all()
        return [dict(s) for s in schedules]

from pydantic import BaseModel
import uuid
import datetime

class CreateAppointmentRequest(BaseModel):
    doctor_id: str
    appointment_date: str
    appointment_time: str
    appointment_type: str

@router.post("/api/patient/{patient_id}/appointments")
def create_appointment(patient_id: str, req: CreateAppointmentRequest):
    with orchestrator.Session() as session:
        appt_id = str(uuid.uuid4())
        session.execute(text("""
            INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status, created_at, updated_at)
            VALUES (:id, :pid, :did, :date, :time, :type, 'Scheduled', :now, :now)
        """), {
            "id": appt_id,
            "pid": patient_id,
            "did": req.doctor_id,
            "date": req.appointment_date,
            "time": req.appointment_time,
            "type": req.appointment_type,
            "now": datetime.datetime.now()
        })
        session.commit()
        return {"status": "Success", "appointment_id": appt_id}
