from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/prescriptions", response_model=StandardResponse)
async def get_prescriptions():
    cursor = database.prescriptions.find({})
    prescriptions = await cursor.to_list(length=100)
    for p in prescriptions:
        p["id"] = str(p["_id"])
        del p["_id"]
    return StandardResponse(success=True, data=prescriptions)

@router.post("/prescriptions", response_model=StandardResponse)
async def create_prescription(prescription_data: dict):
    prescription_data["created_at"] = datetime.utcnow()
    prescription_data["status"] = "Active"
    
    result = await database.prescriptions.insert_one(prescription_data)
    prescription_data["id"] = str(result.inserted_id)
    
    # Medication Schedule Engine
    # Generate schedule events
    medications = prescription_data.get("medications", [])
    events = []
    
    start_date = datetime.utcnow()
    
    for med in medications:
        freq = med.get("frequency", "Once daily")
        duration = med.get("duration", 1) # days
        
        # Simple parser for frequency
        times_per_day = 1
        if freq.lower() == "twice daily":
            times_per_day = 2
        elif freq.lower() == "thrice daily":
            times_per_day = 3
            
        for day in range(duration):
            for t in range(times_per_day):
                event_time = start_date + timedelta(days=day, hours=(8 + t*6)) # Simple 8am, 2pm, etc.
                events.append({
                    "prescription_id": prescription_data["id"],
                    "patient_id": prescription_data.get("patient_id"),
                    "medicine_id": med.get("medicine_id"),
                    "medicine_name": med.get("medicine_name"),
                    "scheduled_time": event_time,
                    "status": "Scheduled"
                })
                
    if events:
        await database.medication_events.insert_many(events)
        
    return StandardResponse(success=True, data=prescription_data)

@router.get("/schedule/{patient_id}", response_model=StandardResponse)
async def get_schedule(patient_id: str):
    cursor = database.medication_events.find({"patient_id": patient_id}).sort("scheduled_time", 1)
    events = await cursor.to_list(length=100)
    for e in events:
        e["id"] = str(e["_id"])
        del e["_id"]
    return StandardResponse(success=True, data=events)

@router.get("/adherence/{patient_id}", response_model=StandardResponse)
async def get_adherence(patient_id: str):
    total = await database.medication_events.count_documents({"patient_id": patient_id})
    if total == 0:
        return StandardResponse(success=True, data={"adherence": "No Data"})
        
    completed = await database.medication_events.count_documents({"patient_id": patient_id, "status": "Completed"})
    missed = await database.medication_events.count_documents({"patient_id": patient_id, "status": "Missed"})
    
    rate = completed / total if total > 0 else 0
    status = "Regular" if rate > 0.8 else ("Mostly Regular" if rate > 0.5 else "Irregular")
    
    return StandardResponse(success=True, data={
        "scheduled": total,
        "completed": completed,
        "missed": missed,
        "regularity_rate": rate,
        "status": status
    })
