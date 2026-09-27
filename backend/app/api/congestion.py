from fastapi import APIRouter
from datetime import datetime

from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/current", response_model=StandardResponse)
async def get_current_congestion():
    # Fetch waiting queue
    current_queue = await database.queue.count_documents({"status": "Waiting"})
    doctors_count = await database.doctors.count_documents({})
    doctors_count = doctors_count if doctors_count > 0 else 1
    
    score = min(100, int((current_queue / (doctors_count * 5)) * 100))
    status = "Busy" if score > 70 else ("Moderate" if score > 40 else "Normal")
    
    return StandardResponse(success=True, data={
        "status": status,
        "score": score,
        "current_queue": current_queue,
        "predicted_queue": int(current_queue * 1.2), # Mock ML
        "predicted_peak": "11:30",
        "bottleneck": "Doctor Consultation" if current_queue > 5 else "None",
        "confidence": 0.87
    })

@router.get("/forecast", response_model=StandardResponse)
async def get_congestion_forecast():
    # Mock ML forecast
    forecast = [
        {"time": "10:00", "predicted_queue": 5, "risk": "Low"},
        {"time": "11:00", "predicted_queue": 12, "risk": "Moderate"},
        {"time": "12:00", "predicted_queue": 21, "risk": "High"},
    ]
    return StandardResponse(success=True, data=forecast)

@router.get("/bottlenecks", response_model=StandardResponse)
async def get_bottlenecks():
    return StandardResponse(success=True, data=[
        {"stage": "Doctor Consultation", "impact": "High", "current_wait": 45}
    ])
