from fastapi import APIRouter, Request
from datetime import datetime, time
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/overview")
async def get_dashboard_overview(request: Request):
    from app.database import database
    db = database
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Fetch queue items for today
    queue_cursor = db.queue.find({"arrival_time": {"$gte": today}})
    queue_items = await queue_cursor.to_list(length=None)
    
    # 2. Patients count (total queue items)
    patients_today = len(queue_items)
    
    # 3. Active consultations
    active_consultations = sum(1 for q in queue_items if q.get("status") == "In Consultation")
    
    # 4. Waiting tokens
    waiting_tokens = [q for q in queue_items if q.get("status") == "Waiting"]
    current_queue = len(waiting_tokens)
    
    # Heuristics for wait time (e.g. 15 mins per patient in queue)
    avg_wait = current_queue * 15 if current_queue > 0 else 0
    
    clinic_load = current_queue + active_consultations
    clinic_status = {"status": "Optimal"} if active_consultations < 5 and current_queue < 10 else {"status": "Busy"}
    
    # Fetch doctors
    doctors = await db.doctors.count_documents({})
    available_doctors = doctors if doctors > 0 else 1
    
    # Anomalies
    anomalies = []
    if avg_wait > 30:
        anomalies.append("Wait times exceeding normal thresholds")
        
    recommendations = []
    if current_queue > 15:
        recommendations.append({"reason": "Queue building", "recommendation": "Reassign idle doctors", "confidence": 0.9})
        
    return {
        "success": True,
        "data": {
            "clinic_status": clinic_status,
            "patients_today": patients_today,
            "appointments_today": await db.appointments.count_documents({"created_at": {"$gte": today}}),
            "current_queue": current_queue,
            "active_consultations": active_consultations,
            "average_wait": avg_wait,
            "clinic_load": clinic_load,
            "predicted_peak": {"time": "18:00"},
            "bottleneck": {"stage": "Doctor Consultation"} if current_queue > 5 else {},
            "doctor_workload": {"status": "Normal"},
            "medicine_alerts": {"status": "OK"},
            "medication_events": {"due": await db.medication_events.count_documents({"status": "Scheduled"})},
            "recommendations": recommendations,
            "anomalies": anomalies,
            "model_status": {"status": "Active"}
        }
    }
