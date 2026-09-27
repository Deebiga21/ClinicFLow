from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import dashboard, congestion, digital_twin, appointments, queue
from app.database import client, database, MONGO_DETAILS
from app.websocket.manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = database
    yield
    client.close()

from app.websocket.manager import manager, sio
import socketio

app = FastAPI(title="ClinicFlow Intelligence Layer", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(congestion.router, prefix="/api/congestion", tags=["congestion"])
app.include_router(digital_twin.router, prefix="/api/digital_twin", tags=["digital_twin"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])
app.include_router(queue.router, prefix="/api/queue", tags=["queue"])
from app.api import medicines, medications, feedback, reports, doctors, chat, consultations, settings
app.include_router(medicines.router, prefix="/api/medicines", tags=["medicines"])
app.include_router(medications.router, prefix="/api/medications", tags=["medications"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["doctors"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(consultations.router, prefix="/api/consultations", tags=["consultations"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

@app.get("/")
async def root():
    return {"message": "ClinicFlow Intelligence Layer API is running"}

