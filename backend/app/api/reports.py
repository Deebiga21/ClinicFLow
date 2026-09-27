from fastapi import APIRouter
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/summary", response_model=StandardResponse)
async def get_summary_report():
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Patients served today
    served = await database.queue.count_documents({"status": "Completed", "arrival_time": {"$gte": today}})
    
    # Average consultation time today
    consultations = await database.consultations.find({"end_time": {"$gte": today}}).to_list(length=100)
    avg_consultation = 0
    if consultations:
        total_time = sum(c.get("actual_duration", 0) for c in consultations if c.get("actual_duration"))
        avg_consultation = total_time / len(consultations)
        
    return StandardResponse(success=True, data={
        "patients_served": served,
        "average_consultation_seconds": round(avg_consultation, 2)
    })

@router.get("/patient-flow", response_model=StandardResponse)
async def get_patient_flow():
    cursor = database.patient_journeys.find({"exit_time": {"$ne": None}})
    journeys = await cursor.to_list(length=50)
    
    flow_data = []
    for j in journeys:
        # Calculate times for each stage
        registration_time = (j.get("nurse_start") - j.get("arrival_time")).total_seconds() if j.get("nurse_start") and j.get("arrival_time") else 0
        doctor_wait = (j.get("doctor_start") - j.get("nurse_start")).total_seconds() if j.get("doctor_start") and j.get("nurse_start") else 0
        
        flow_data.append({
            "patient_id": j.get("patient_id"),
            "registration_wait": registration_time,
            "doctor_wait": doctor_wait,
            "total_journey": (j.get("exit_time") - j.get("arrival_time")).total_seconds() if j.get("exit_time") and j.get("arrival_time") else 0
        })
        
    return StandardResponse(success=True, data=flow_data)
