from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from bson import ObjectId

from app.schemas.core import Appointment, AppointmentCreate, StandardResponse, PatientJourney, QueueItem
from app.database import database
from app.websocket.manager import manager

router = APIRouter()

@router.get("/", response_model=StandardResponse)
async def get_appointments():
    cursor = database.appointments.find({})
    appointments = await cursor.to_list(length=100)
    
    # Collect IDs for batch fetching
    patient_ids = [ObjectId(appt["patient_id"]) for appt in appointments if ObjectId.is_valid(appt.get("patient_id"))]
    doctor_ids = [ObjectId(appt["doctor_id"]) for appt in appointments if ObjectId.is_valid(appt.get("doctor_id"))]
    
    # Fetch patients and doctors
    patients_cursor = database.patients.find({"_id": {"$in": patient_ids}})
    patients = {str(p["_id"]): p async for p in patients_cursor}
    
    doctors_cursor = database.doctors.find({"_id": {"$in": doctor_ids}})
    doctors = {str(d["_id"]): d async for d in doctors_cursor}

    for appt in appointments:
        appt["id"] = str(appt["_id"])
        del appt["_id"]
        
        # Enrich data
        p_id = appt.get("patient_id")
        d_id = appt.get("doctor_id")
        if p_id in patients:
            appt["patient_name"] = patients[p_id].get("name", "Unknown Patient")
            appt["patient_contact"] = patients[p_id].get("contact", "")
        if d_id in doctors:
            appt["doctor_name"] = doctors[d_id].get("name", "Unknown Doctor")

    return StandardResponse(success=True, data=appointments)

@router.post("/", response_model=StandardResponse)
async def create_appointment(appointment: AppointmentCreate):
    appt_dict = appointment.dict()
    appt_dict["status"] = "Scheduled"
    appt_dict["created_at"] = datetime.utcnow()
    
    result = await database.appointments.insert_one(appt_dict)
    appt_dict["id"] = str(result.inserted_id)
    if "_id" in appt_dict:
        del appt_dict["_id"]
    
    # Notify dashboard/workload
    await manager.broadcast({"event": "appointment_created", "data": appt_dict})
    
    return StandardResponse(success=True, data=appt_dict)

@router.post("/{appointment_id}/check-in", response_model=StandardResponse)
async def check_in_appointment(appointment_id: str):
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    appointment = await database.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    now = datetime.utcnow()
    
    # 1. Update appointment
    await database.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "Waiting", "arrival_time": now}}
    )
    
    # 2. Create Patient Journey
    journey = {
        "patient_id": appointment["patient_id"],
        "appointment_id": appointment_id,
        "current_stage": "Registration",
        "arrival_time": now,
        "registration_time": now
    }
    await database.patient_journeys.insert_one(journey)
    
    # 3. Create Queue Entry
    # Generate token number
    token_counter = await database.counters.find_one_and_update(
        {"_id": "token_number"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    token_num = token_counter["seq"] if token_counter else 1
    
    # Calculate queue position
    queue_pos = await database.queue.count_documents({"status": "Waiting", "doctor_id": appointment["doctor_id"]}) + 1
    
    queue_item = {
        "appointment_id": appointment_id,
        "patient_id": appointment["patient_id"],
        "doctor_id": appointment["doctor_id"],
        "token_number": token_num,
        "queue_position": queue_pos,
        "arrival_time": now,
        "status": "Waiting"
    }
    await database.queue.insert_one(queue_item)
    
    # 4. Broadcast Events
    await manager.broadcast({"event": "patient_checked_in", "data": {"appointment_id": appointment_id}})
    await manager.broadcast({"event": "queue_updated", "data": {"queue_size": queue_pos, "doctor_id": appointment["doctor_id"]}})
    await manager.broadcast({"event": "journey_updated", "data": {"patient_id": appointment["patient_id"], "stage": "Registration"}})
    
    return StandardResponse(success=True, data={"message": "Checked in successfully"})

@router.post("/{appointment_id}/status", response_model=StandardResponse)
async def update_appointment_status(appointment_id: str, status: str):
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    valid_statuses = ["Confirmed", "Cancelled", "No-Show"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    appointment = await database.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    await database.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": status}}
    )
    
    # Broadcast event
    await manager.broadcast({"event": "appointment_updated", "data": {"appointment_id": appointment_id, "status": status}})
    
    return StandardResponse(success=True, data={"message": f"Appointment status updated to {status}"})

@router.delete("/{appointment_id}", response_model=StandardResponse)
async def delete_appointment(appointment_id: str):
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = await database.appointments.delete_one({"_id": ObjectId(appointment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    await manager.broadcast({"event": "appointment_deleted", "data": {"appointment_id": appointment_id}})
    return StandardResponse(success=True, data={"message": "Appointment deleted successfully"})

@router.put("/{appointment_id}", response_model=StandardResponse)
async def update_appointment(appointment_id: str, appointment: AppointmentCreate):
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    appt_dict = appointment.dict(exclude_unset=True)
    
    result = await database.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": appt_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    await manager.broadcast({"event": "appointment_updated", "data": {"appointment_id": appointment_id}})
    return StandardResponse(success=True, data={"message": "Appointment updated successfully"})
