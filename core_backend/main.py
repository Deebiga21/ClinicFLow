from sqlalchemy import text
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.orchestration import OrchestrationService
import socketio
import json
import datetime

from routers.patient_dashboard import router as patient_router
from routers.nurse_dashboard import router as nurse_router
from routers.admin_dashboard import router as admin_router
from routers.clinical import router as clinical_router
from routers.medicines import router as medicines_router
from routers.medications import router as medications_router
from routers.admin_dummy import router as admin_dummy_router
from routers.predictions import router as predictions_router
from routers.operational import router as operational_router
from routers.chat import router as chat_router

app = FastAPI(title="ClinicFlow Intelligence Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient_router)
app.include_router(nurse_router)
app.include_router(admin_router)
app.include_router(clinical_router)
app.include_router(medicines_router)
app.include_router(medications_router)
app.include_router(admin_dummy_router)
app.include_router(predictions_router)
app.include_router(operational_router)
app.include_router(chat_router)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

orchestrator = OrchestrationService()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

async def broadcast_event(event_name: str, payload: dict):
    msg = {'type': event_name, 'data': payload}
    await sio.emit(event_name, payload)
    await sio.emit('systemBroadcast', msg) # Legacy support
    await manager.broadcast(msg)

@app.websocket("/ws/clinic")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except:
        manager.disconnect(websocket)

@sio.event
async def connect(sid, environ, auth=None):
    print("Socket.IO client connected:", sid)

@sio.event
async def disconnect(sid):
    print("Socket.IO client disconnected:", sid)


class CheckInRequest(BaseModel):
    appointment_id: str

class ReadinessRequest(BaseModel):
    patient_id: str
    readiness_score: float = 100.0

class QueueIdRequest(BaseModel):
    queue_id: str

class ConsultEndRequest(BaseModel):
    consultation_id: str
    actual_duration_minutes: float

class PrescriptionRequest(BaseModel):
    patient_id: str
    appointment_id: str
    doctor_id: str
    consultation_id: str
    medicine_name: str
    dosage: str
    frequency: str
    duration_days: int

@app.post("/api/pipeline/check-in")
async def check_in_patient(req: CheckInRequest):
    result = orchestrator.process_patient_check_in(req.appointment_id)
    if "error" not in result:
        await broadcast_event('patient_checked_in', result)
        await broadcast_event('queue_updated', result)
        await broadcast_event('prediction_updated', result)
    return result

@app.post("/api/pipeline/readiness")
async def update_readiness(req: ReadinessRequest):
    result = orchestrator.process_patient_readiness(req.patient_id, req.dict())
    if "error" not in result:
        await broadcast_event('patient_readiness_updated', result)
    return result

@app.post("/api/pipeline/call-next")
async def call_next(req: QueueIdRequest):
    result = orchestrator.process_call_next(req.queue_id)
    if "error" not in result:
        await broadcast_event('patient_called', result)
        await broadcast_event('queue_updated', result)
    return result

@app.post("/api/pipeline/consultation/start")
async def start_consultation(req: QueueIdRequest):
    result = orchestrator.process_consultation_start(req.queue_id)
    if "error" not in result:
        await broadcast_event('consultation_started', result)
        await broadcast_event('queue_updated', result)
        await broadcast_event('prediction_updated', result)
    return result

@app.post("/api/pipeline/consultation/end")
async def end_consultation(req: ConsultEndRequest):
    result = orchestrator.process_consultation_end(req.consultation_id, req.actual_duration_minutes)
    if "error" not in result:
        await broadcast_event('consultation_completed', result)
        await broadcast_event('queue_updated', result)
    return result

@app.post("/api/pipeline/prescription")
async def create_prescription(req: PrescriptionRequest):
    result = orchestrator.process_prescription(**req.dict())
    if "error" not in result:
        await broadcast_event('prescription_created', result)
        await broadcast_event('medication_schedule_created', result)
    return result

@app.get("/api/dashboard/overview")
def get_dashboard_overview():
    with orchestrator.Session() as session:
        waiting = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Waiting'")).scalar() or 0
        in_consult = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'In Consultation'")).scalar() or 0
        patients_today = session.execute(text("SELECT count(*) FROM queue_entries")).scalar() or 0
        completed_today = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Completed'")).scalar() or 0
        
        # Calculate real averages from DB
        avg_wait_res = session.execute(text("SELECT avg(estimated_wait_minutes) FROM queue_entries WHERE status = 'Waiting'")).scalar()
        avg_wait = round(avg_wait_res, 1) if avg_wait_res else 0.0

        avg_dur_res = session.execute(text("SELECT avg(actual_duration_minutes) FROM consultations WHERE status = 'Completed'")).scalar()
        avg_dur = round(avg_dur_res, 1) if avg_dur_res else 0.0

        return {
            "patients_today": patients_today,
            "completed_today": completed_today,
            "active_consultations": in_consult,
            "current_waiting": waiting,
            "average_wait": avg_wait,
            "average_consultation": avg_dur,
            "clinic_load": min(100, waiting * 5),
            "bottleneck_risk": {"severity": "High" if waiting > 10 else "Med" if waiting > 5 else "Low"}
        }

@app.get("/api/pipeline/state")
def get_clinic_state():
    with orchestrator.Session() as session:
        waiting = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Waiting'")).scalar() or 0
        in_consult = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'In Consultation'")).scalar() or 0
        return {
            "waiting_count": waiting,
            "in_consultation_count": in_consult,
            "models_loaded": (orchestrator.wait_model is not None)
        }

@app.get("/api/appointments")
def get_appointments():
    with orchestrator.Session() as session:
        query = text("""
            SELECT a.id as appointment_id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.status,
                   p.name as patient_name, d.name as doctor_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
            LIMIT 50
        """)
        results = session.execute(query).mappings().all()
        return {"data": [dict(r) for r in results]}

@app.get("/api/queue")
def get_queue():
    with orchestrator.Session() as session:
        query = text("""
            SELECT q.id, q.patient_id, q.appointment_id, q.status, q.token_number, q.queue_position, q.estimated_wait_minutes, p.name as patient_name
            FROM queue_entries q
            JOIN patients p ON q.patient_id = p.id
            WHERE q.status NOT IN ('Completed', 'Cancelled')
            ORDER BY q.queue_position ASC
        """)
        results = session.execute(query).mappings().all()
        return {"data": [dict(r) for r in results]}

@app.post("/api/appointments/{id}/status")
def update_appointment_status(id: str, status: str):
    with orchestrator.Session() as session:
        session.execute(text("UPDATE appointments SET status = :st WHERE id = :id"), {"st": status, "id": id})
        session.commit()
    return {"ok": True}

@app.get("/api/notifications/admin")
def get_admin_notifications():
    with orchestrator.Session() as session:
        n = session.execute(text("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20")).mappings().all()
        return {"data": [dict(x) for x in n]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
