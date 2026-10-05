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
        
        live_queue = None
        if visit_status.get("queue_status") and visit_status.get("appointment"):
            doctor_id = visit_status["appointment"].get("doctor_id")
            if doctor_id:
                # Get currently serving
                current = session.execute(text("SELECT token_number FROM queue_entries WHERE doctor_id = :did AND status IN ('In Consultation', 'With Nurse', 'Ready', 'With Doctor') LIMIT 1"), {"did": doctor_id}).scalar()
                
                # Get next
                next_token = session.execute(text("SELECT token_number FROM queue_entries WHERE doctor_id = :did AND status = 'Waiting' ORDER BY queue_position ASC LIMIT 1"), {"did": doctor_id}).scalar()
                
                live_queue = {
                    "current": current if current else None,
                    "next": next_token if next_token else None
                }

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
            "notifications": [],
            "live_queue": live_queue
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


@router.post("/api/medication-schedules/{schedule_id}/taken")
def mark_medication_taken(schedule_id: str):
    import uuid
    with orchestrator.Session() as session:
        # Check if schedule exists
        sch = session.execute(text("SELECT * FROM medication_schedules WHERE id = :id"), {"id": schedule_id}).mappings().first()
        if not sch:
            return {"error": "Schedule not found"}
        
        # Update status
        session.execute(text("UPDATE medication_schedules SET status = 'Taken' WHERE id = :id"), {"id": schedule_id})
        
        # Add to medication_events history
        event_id = f"ME_{uuid.uuid4().hex[:8]}"
        session.execute(text("""
            INSERT INTO medication_events (id, medication_schedule_id, patient_id, scheduled_time, event_time, status, recorded_at)
            VALUES (:id, :sch_id, :pid, :stime, CURRENT_TIMESTAMP, 'Taken', CURRENT_TIMESTAMP)
        """), {
            "id": event_id,
            "sch_id": schedule_id,
            "pid": sch["patient_id"],
            "stime": f"{sch['scheduled_date']} {sch['scheduled_time']}"
        })
        session.commit()
        
        # Notify Nurse Chat
        try:
            from services.chat_service import ChatService
            from routers.chat import broadcast_chat_message
            import asyncio
            
            # Find patient name or use ID
            patient_name = sch["patient_id"]
            patient_rec = session.execute(text("SELECT name FROM patients WHERE id = :id"), {"id": sch["patient_id"]}).mappings().first()
            if patient_rec:
                patient_name = patient_rec["name"]
                
            med_name = sch.get("medicine_name", "Medication")
            if "medicine_name" not in sch:
                med_rec = session.execute(text("SELECT medicine_name FROM prescriptions WHERE id = :id"), {"id": sch.get("prescription_id")}).mappings().first()
                if med_rec:
                    med_name = med_rec["medicine_name"]
            
            chat_service = ChatService()
            msg = chat_service.save_message(
                sender_id="System",
                sender_role="system",
                channel="clinic_operations",
                message=f"✅ Patient {patient_name} just marked their {med_name} dose as Taken."
            )
            # Try to run broadcast safely since we are inside a sync route
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(broadcast_chat_message(msg))
            else:
                loop.run_until_complete(broadcast_chat_message(msg))
        except Exception as e:
            print("Failed to notify chat:", e)
        
        return {"success": True}
