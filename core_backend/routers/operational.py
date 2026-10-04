from fastapi import APIRouter
from services.ml_service import MLService
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

router = APIRouter(tags=["operational"])
ml_service = MLService()

engine = create_engine("sqlite:///clinic_core_v2.db")
Session = sessionmaker(bind=engine)

@router.get("/api/congestion/current")
def get_current_congestion():
    with Session() as session:
        waiting = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Waiting'")).scalar()
        if waiting > 10:
            status = "HIGH"
        elif waiting > 5:
            status = "MODERATE"
        else:
            status = "LOW"
        return {"current_waiting": waiting, "congestion_level": status}

@router.get("/api/congestion/forecast")
def get_congestion_forecast():
    return ml_service.get_congestion_forecast()

@router.get("/api/anomalies")
def get_anomalies():
    return ml_service.get_anomalies(recent=False)

@router.get("/api/anomalies/recent")
def get_recent_anomalies():
    return ml_service.get_anomalies(recent=True)

@router.get("/api/medicines")
def get_medicines():
    with Session() as session:
        res = session.execute(text("SELECT id, name, category, reorder_level FROM medicines")).fetchall()
        return {"medicines": [dict(row._mapping) for row in res]}

@router.get("/api/medicines/demand")
def get_medicines_demand():
    return {"status": "NOT_TRAINED", "reason": "Medicine demand model not implemented"}

import uuid
from pydantic import BaseModel

class CallNextReq(BaseModel):
    doctorId: str
    queueId: str

@router.get("/api/operational/queue")
def get_live_queue():
    from services.orchestration import orchestrator
    with orchestrator.Session() as session:
        # Get active queue items
        query = """
            SELECT q.id, q.patient_id, p.name as patient_name, q.doctor_id, d.name as doctor_name, 
                   q.status, a.token_status, q.queue_position 
            FROM queue_entries q
            JOIN patients p ON q.patient_id = p.id
            JOIN doctors d ON q.doctor_id = d.id
            JOIN appointments a ON q.appointment_id = a.id
            WHERE q.status NOT IN ('Completed', 'Cancelled')
            ORDER BY q.queue_position ASC
        """
        rows = session.execute(text(query)).mappings().all()
        
        res = []
        for r in rows:
            # simple mock wait time for the view based on pos
            res.append({
                "id": r["id"],
                "token": r["token_status"] if r["token_status"] and r["token_status"] != 'Pending' else f"A-{r['queue_position']}",
                "patient_name": r["patient_name"],
                "doctor_id": r["doctor_id"],
                "doctor_name": r["doctor_name"],
                "status": r["status"],
                "predicted_wait": r["queue_position"] * 10
            })
        return {"queue": res}

@router.post("/api/operational/call-next")
def call_next_patient(req: CallNextReq):
    from services.orchestration import orchestrator
    with orchestrator.Session() as session:
        # End current
        session.execute(text("UPDATE queue_entries SET status = 'Completed', consultation_completed_at = CURRENT_TIMESTAMP WHERE doctor_id = :did AND status = 'In Consultation'"), {'did': req.doctorId})
        
        # Call this specific queue ID
        session.execute(text("UPDATE queue_entries SET status = 'In Consultation', consultation_started_at = CURRENT_TIMESTAMP WHERE id = :qid"), {'qid': req.queueId})
        
        # Find the appointment_id to update patient journey
        q_row = session.execute(text("SELECT patient_id, appointment_id FROM queue_entries WHERE id = :qid"), {'qid': req.queueId}).mappings().first()
        if q_row:
            session.execute(text('''
                UPDATE patient_journeys SET previous_stage = current_stage, current_stage = 'Consultation', stage_started_at = CURRENT_TIMESTAMP 
                WHERE patient_id = :pat AND appointment_id = :app
            '''), {'pat': q_row['patient_id'], 'app': q_row['appointment_id']})
            
            session.commit()
            
            orchestrator._broadcast("queue_updated", {})
            orchestrator._broadcast("patient_called", {"patient_id": q_row['patient_id']})
            orchestrator._broadcast("patient_journey_updated", {"patient_id": q_row['patient_id'], "stage": "Consultation"})
            
        return {"status": "success"}
