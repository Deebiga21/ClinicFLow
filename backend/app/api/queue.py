from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from bson import ObjectId

from app.schemas.core import QueueItem, StandardResponse, Consultation
from app.database import database
from app.websocket.manager import manager

router = APIRouter()

@router.get("/", response_model=StandardResponse)
async def get_queue():
    cursor = database.queue.find({"status": {"$in": ["Waiting", "In Consultation"]}}).sort("queue_position", 1)
    queue = await cursor.to_list(length=100)
    for q in queue:
        q["id"] = str(q["_id"])
        del q["_id"]
    return StandardResponse(success=True, data=queue)

@router.post("/call-next", response_model=StandardResponse)
async def call_next_patient(doctor_id: str):
    # Find next patient waiting
    next_patient = await database.queue.find_one(
        {"doctor_id": doctor_id, "status": "Waiting"},
        sort=[("queue_position", 1)]
    )
    
    if not next_patient:
        return StandardResponse(success=False, message="No patients waiting for this doctor")
        
    now = datetime.utcnow()
    queue_id = str(next_patient["_id"])
    
    # Update queue status
    await database.queue.update_one(
        {"_id": ObjectId(queue_id)},
        {"$set": {"status": "In Consultation", "called_at": now, "consultation_start": now}}
    )
    
    # Update Patient Journey
    await database.patient_journeys.update_one(
        {"appointment_id": next_patient["appointment_id"]},
        {"$set": {"current_stage": "Doctor Consultation", "doctor_start": now}}
    )
    
    # Start Consultation Record
    consultation = {
        "appointment_id": next_patient["appointment_id"],
        "patient_id": next_patient["patient_id"],
        "doctor_id": doctor_id,
        "visit_type": "General", # Can be fetched from appointment
        "start_time": now,
        "complexity": "Low"
    }
    await database.consultations.insert_one(consultation)
    
    # Recalculate queue positions for remaining
    await database.queue.update_many(
        {"doctor_id": doctor_id, "status": "Waiting", "queue_position": {"$gt": next_patient["queue_position"]}},
        {"$inc": {"queue_position": -1}}
    )
    
    # Broadcast events
    await manager.broadcast({"event": "token_called", "data": {"token_number": next_patient["token_number"], "doctor_id": doctor_id}})
    await manager.broadcast({"event": "consultation_started", "data": {"patient_id": next_patient["patient_id"], "doctor_id": doctor_id}})
    await manager.broadcast({"event": "queue_updated", "data": {"doctor_id": doctor_id}})
    
    # Optional: trigger ML recalculation of waiting times here or async
    
    return StandardResponse(success=True, data={"called_token": next_patient["token_number"]})

@router.post("/{queue_id}/complete", response_model=StandardResponse)
async def complete_consultation(queue_id: str):
    if not ObjectId.is_valid(queue_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    queue_item = await database.queue.find_one({"_id": ObjectId(queue_id)})
    if not queue_item:
        raise HTTPException(status_code=404, detail="Queue item not found")
        
    now = datetime.utcnow()
    
    # Complete Queue
    await database.queue.update_one(
        {"_id": ObjectId(queue_id)},
        {"$set": {"status": "Completed", "consultation_end": now}}
    )
    
    # Update Patient Journey
    await database.patient_journeys.update_one(
        {"appointment_id": queue_item["appointment_id"]},
        {"$set": {"doctor_end": now}}
    )
    
    # Complete Consultation Record and calculate actual duration
    consultation = await database.consultations.find_one({"appointment_id": queue_item["appointment_id"], "end_time": None})
    if consultation:
        duration_seconds = int((now - consultation["start_time"]).total_seconds())
        await database.consultations.update_one(
            {"_id": consultation["_id"]},
            {"$set": {"end_time": now, "actual_duration": duration_seconds}}
        )
        
        # Here we would normally record feedback prediction vs actual error
        predicted = consultation.get("predicted_duration", 0)
        if predicted > 0:
            error = abs(predicted - duration_seconds)
            await database.feedback.insert_one({
                "type": "consultation_duration",
                "predicted": predicted,
                "actual": duration_seconds,
                "error": error,
                "timestamp": now,
                "consultation_id": str(consultation["_id"])
            })
    
    await manager.broadcast({"event": "consultation_completed", "data": {"doctor_id": queue_item["doctor_id"]}})
    
    return StandardResponse(success=True, message="Consultation completed")
