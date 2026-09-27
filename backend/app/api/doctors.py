from fastapi import APIRouter
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

from app.schemas.core import StandardResponse
from app.database import database
from app.websocket.manager import manager

router = APIRouter()

@router.get("/", response_model=StandardResponse)
async def get_doctors():
    cursor = database.doctors.find({})
    doctors = await cursor.to_list(length=100)
    for d in doctors:
        d["id"] = str(d["_id"])
        del d["_id"]
    return StandardResponse(success=True, data=doctors)

@router.get("/workload", response_model=StandardResponse)
async def get_doctors_workload():
    cursor = database.doctors.find({})
    doctors = await cursor.to_list(length=100)
    
    workload = []
    for d in doctors:
        doc_id = str(d["_id"])
        
        # Current load: active appointments / queue size
        current_queue = await database.queue.count_documents({"doctor_id": doc_id, "status": "Waiting"})
        
        # Completed today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        completed = await database.queue.count_documents({"doctor_id": doc_id, "status": "Completed", "arrival_time": {"$gte": today}})
        
        capacity = d.get("capacity", 40)
        predicted_load = current_queue + completed + 5 # mock prediction
        
        overload_risk = "High" if predicted_load > capacity else "Low"
        
        workload.append({
            "doctor_id": doc_id,
            "name": d["name"],
            "current_load": current_queue + completed,
            "predicted_load": predicted_load,
            "overload_risk": overload_risk,
            "capacity": capacity
        })
        
    return StandardResponse(success=True, data=workload)

@router.get("/{doctor_id}", response_model=StandardResponse)
async def get_doctor(doctor_id: str):
    if not ObjectId.is_valid(doctor_id):
        return StandardResponse(success=False, message="Invalid Doctor ID")
    
    doctor = await database.doctors.find_one({"_id": ObjectId(doctor_id)})
    if not doctor:
        return StandardResponse(success=False, message="Doctor not found")
        
    doctor["id"] = str(doctor["_id"])
    del doctor["_id"]
    return StandardResponse(success=True, data=doctor)
