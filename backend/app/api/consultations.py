from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId

from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/", response_model=StandardResponse)
async def get_consultations():
    cursor = database.consultations.find({}).sort("start_time", -1)
    consultations = await cursor.to_list(length=100)
    for c in consultations:
        c["id"] = str(c["_id"])
        del c["_id"]
    return StandardResponse(success=True, data=consultations)

@router.get("/{id}", response_model=StandardResponse)
async def get_consultation(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    c = await database.consultations.find_one({"_id": ObjectId(id)})
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    c["id"] = str(c["_id"])
    del c["_id"]
    return StandardResponse(success=True, data=c)

@router.post("/{id}/start", response_model=StandardResponse)
async def start_consultation(id: str):
    # Typically handled by queue call-next, but can be standalone
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    await database.consultations.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"start_time": datetime.utcnow()}}
    )
    return StandardResponse(success=True, message="Started")

@router.post("/{id}/complete", response_model=StandardResponse)
async def complete_consultation(id: str):
    # Handled by queue completion, but provided here for completeness
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    now = datetime.utcnow()
    c = await database.consultations.find_one({"_id": ObjectId(id)})
    if c:
        duration = int((now - c["start_time"]).total_seconds())
        await database.consultations.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"end_time": now, "actual_duration": duration}}
        )
    return StandardResponse(success=True, message="Completed")

@router.get("/{id}/intelligence", response_model=StandardResponse)
async def get_consultation_intelligence(id: str):
    # Simulated intelligence
    return StandardResponse(success=True, data={
        "patient": "Mock Patient",
        "doctor": "Mock Doctor",
        "visit_type": "General",
        "intake_completeness": "85%",
        "predicted_consultation_duration": 900, # 15 mins in seconds
        "actual_duration": None,
        "operational_complexity": "Medium",
        "missing_information": ["Blood Pressure"],
        "handoff_status": "Ready"
    })
