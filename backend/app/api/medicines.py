from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/", response_model=StandardResponse)
async def get_medicines():
    cursor = database.medicines.find({})
    medicines = await cursor.to_list(length=100)
    for med in medicines:
        med["id"] = str(med["_id"])
        del med["_id"]
    return StandardResponse(success=True, data=medicines)

@router.get("/inventory", response_model=StandardResponse)
async def get_inventory():
    # Similar to get_medicines but potentially aggregates stock
    cursor = database.medicines.find({"quantity": {"$gt": 0}})
    inventory = await cursor.to_list(length=100)
    for item in inventory:
        item["id"] = str(item["_id"])
        del item["_id"]
    return StandardResponse(success=True, data=inventory)

@router.get("/expiry-risk", response_model=StandardResponse)
async def get_expiry_risk():
    # Calculate expiry risk: days_to_expiry, usage_rate, expected_waste
    now = datetime.utcnow()
    cursor = database.medicines.find({"quantity": {"$gt": 0}})
    medicines = await cursor.to_list(length=100)
    
    risks = []
    for med in medicines:
        expiry_date = med.get("expiry_date")
        if not expiry_date:
            continue
        
        # If expiry_date is a string, parse it. (Assuming datetime for now)
        if isinstance(expiry_date, str):
            try:
                expiry_date = datetime.fromisoformat(expiry_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                continue
                
        days_to_expiry = (expiry_date - now).days
        
        # Mock historical usage rate (would come from DB in reality)
        historical_usage_rate = med.get("daily_usage", 5) 
        
        expected_consumption = historical_usage_rate * max(days_to_expiry, 0)
        remaining_stock = max(med["quantity"] - expected_consumption, 0)
        
        waste_risk = "HIGH" if remaining_stock > 0 and days_to_expiry < 30 else "LOW"
        
        risks.append({
            "medicine_id": str(med["_id"]),
            "name": med.get("name"),
            "batch_number": med.get("batch_number"),
            "quantity": med["quantity"],
            "days_to_expiry": days_to_expiry,
            "expected_consumption": expected_consumption,
            "potential_leftover": remaining_stock,
            "waste_risk": waste_risk
        })
        
    # Sort by risk
    risks.sort(key=lambda x: x["days_to_expiry"])
    
    return StandardResponse(success=True, data=risks)
