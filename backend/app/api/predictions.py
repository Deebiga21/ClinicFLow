from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()

class WaitingTimeRequest(BaseModel):
    patient_id: str
    stage: str

@router.post("/waiting-time")
async def predict_waiting_time(data: WaitingTimeRequest, request: Request):
    return {"predicted_waiting_time": 45, "unit": "minutes"}

@router.get("/waiting-time/{patient_id}")
async def get_waiting_time(patient_id: str, request: Request):
    return {"patient_id": patient_id, "predicted_waiting_time": 30, "unit": "minutes"}
