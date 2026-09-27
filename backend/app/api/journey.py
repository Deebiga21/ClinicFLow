from fastapi import APIRouter, Request
import random

router = APIRouter()

@router.get("/current")
async def get_current_journey(request: Request):
    return {"status": "ok", "message": "Current journey"}

@router.get("/{patient_id}")
async def get_patient_journey(patient_id: str, request: Request):
    return {"patient_id": patient_id, "journey_stages": ["Registration", "Waiting", "Consultation"]}

@router.get("/{patient_id}/prediction")
async def get_patient_prediction(patient_id: str, request: Request):
    return {"patient_id": patient_id, "predicted_end_time": "12:45", "confidence_score": 0.9}
