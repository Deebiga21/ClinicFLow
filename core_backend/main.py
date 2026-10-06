from sqlalchemy import text
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.orchestration import OrchestrationService
import socketio
import json

from routers.patient_dashboard import router as patient_router
from routers.nurse_dashboard import router as nurse_router
from routers.admin_dashboard import router as admin_router
from routers.clinical import router as clinical_router
from routers.medicines import router as medicines_router
from routers.medications import router as medications_router
from routers.admin_dummy import router as admin_dummy_router
from routers.predictions import router as predictions_router
from routers.operational import router as operational_router
from routers.auth import router as auth_router
from routers.chat import router as chat_router
from routers.billing_notify import router as billing_router

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
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(billing_router)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

orchestrator = OrchestrationService()

class CheckInRequest(BaseModel):
    appointment_id: str

class ConsultStartRequest(BaseModel):
    queue_id: str

class ConsultEndRequest(BaseModel):
    consultation_id: str
    actual_duration_minutes: float

@app.post("/api/pipeline/check-in")
async def check_in_patient(req: CheckInRequest):
    result = orchestrator.process_patient_check_in(req.appointment_id)
    await sio.emit('systemBroadcast', result)
    await manager.broadcast({'type': 'update', 'data': result})
    return result


class NurseActionRequest(BaseModel):
    queue_id: str

@app.post("/api/pipeline/nurse/start")
async def nurse_start(req: NurseActionRequest):
    result = orchestrator.process_nurse_start(req.queue_id)
    await sio.emit('systemBroadcast', result)
    await manager.broadcast({'type': 'update', 'data': result})
    return result

@app.post("/api/pipeline/nurse/ready")
async def nurse_ready(req: NurseActionRequest):
    result = orchestrator.process_nurse_mark_ready(req.queue_id)
    await sio.emit('systemBroadcast', result)
    await manager.broadcast({'type': 'update', 'data': result})
    return result

@app.post("/api/pipeline/nurse/send-doctor")
async def nurse_send_doctor(req: NurseActionRequest):
    result = orchestrator.process_send_to_doctor(req.queue_id)
    await sio.emit('systemBroadcast', result)
    await manager.broadcast({'type': 'update', 'data': result})
    return result

@app.post("/api/pipeline/consultation/start")

async def start_consultation(req: ConsultStartRequest):
    result = orchestrator.process_consultation_start(req.queue_id)
    await sio.emit('systemBroadcast', result)
    await manager.broadcast({'type': 'update', 'data': result})
    return result

@app.post("/api/pipeline/consultation/end")
async def end_consultation(req: ConsultEndRequest):
    result = orchestrator.process_consultation_end(req.consultation_id, req.actual_duration_minutes)
    await sio.emit('systemBroadcast', result)
    await manager.broadcast({'type': 'update', 'data': result})
    return result

@sio.event
async def connect(sid, environ, auth=None):
    print("Socket.IO client connected:", sid)

@sio.event
async def disconnect(sid):
    print("Socket.IO client disconnected:", sid)

# Also expose standard WS for the Pipeline page if it wants it, or the Pipeline page can use socket.io too

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


@app.get("/api/dashboard/overview")
def get_dashboard_overview():
    with orchestrator.Session() as session:
        waiting = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Waiting'")).scalar()
        in_consult = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'In Consultation'")).scalar()
        patients_today = session.execute(text("SELECT count(*) FROM queue_entries")).scalar()
        
        # mock averages for dashboard based on DB data
        return {
            "patients_today": patients_today,
            "active_consultations": in_consult,
            "current_waiting": waiting,
            "average_wait": 22,
            "clinic_load": min(100, waiting * 5),
            "bottleneck_risk": {"severity": "High" if waiting > 10 else "Med" if waiting > 5 else "Low"}
        }

@app.get("/api/pipeline/state")
def get_clinic_state():
    with orchestrator.Session() as session:
        waiting = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'Waiting'")).scalar()
        in_consult = session.execute(text("SELECT count(*) FROM queue_entries WHERE status = 'In Consultation'")).scalar()
        return {
            "waiting_count": waiting,
            "in_consultation_count": in_consult,
            "models_loaded": True
        }

@app.get("/api/appointments")
def get_appointments():
    with orchestrator.Session() as session:
        # Get appointments for today or recent
        # Just return the latest 50 for the UI
        query = text("""
            SELECT a.id as appointment_id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.status,
                   p.id as p_id, d.specialization
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
            LIMIT 50
        """)
        results = session.execute(query).fetchall()
        
        appointments = []
        for r in results:
            appointments.append({
                "id": r[0],
                "patient_name": f"Patient {r[1]}",
                "doctor_name": f"Doctor {r[2]} ({r[7]})",
                "date": r[3],
                "time": r[4],
                "status": r[5]
            })
            
        return {"data": appointments}

@app.post("/api/appointments/{id}/status")
def update_appointment_status(id: str, status: str):
    with orchestrator.Session() as session:
        session.execute(text(f"UPDATE appointments SET status = '{status}' WHERE id = '{id}'"))
        session.commit()
    return {"ok": True}

@app.post("/api/appointments/{id}/check-in")
async def check_in_appointment(id: str):
    # Route it to the ML orchestration pipeline!
    result = orchestrator.process_patient_check_in(id)
    await sio.emit('systemBroadcast', result)
    await manager.broadcast({'type': 'update', 'data': result})
    return {"ok": True, "result": result}

@app.get("/api/pipeline/test-flow")
async def test_end_to_end_flow():
    # Pick a random appointment that hasn't checked in
    with orchestrator.Session() as session:
        res = session.execute(text("SELECT appointment_id FROM appointments WHERE status != 'No-Show' LIMIT 1")).fetchone()
        if not res:
            return {"error": "No appointment available"}
        appt_id = res[0]
        
    # Run the pipeline flow
    out_checkin = orchestrator.process_patient_check_in(appt_id)
    queue_id = out_checkin.get("queue_id")
    
    out_start = orchestrator.process_consultation_start(queue_id)
    consult_id = out_start.get("consultation_id")
    
    # fake duration
    out_end = orchestrator.process_consultation_end(consult_id, 16.5)
    
    return {
        "status": "Success",
        "flow": [out_checkin, out_start, out_end]
    }

@app.get("/api/notifications/admin")
def get_admin_notifications():
    return {"data": []}

if __name__ == "__main__":
    import uvicorn
    # Important: run socket_app to enable Socket.IO
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)

