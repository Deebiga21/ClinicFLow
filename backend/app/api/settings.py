from fastapi import APIRouter
from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/", response_model=StandardResponse)
async def get_settings():
    settings = await database.settings.find_one({"_id": "global"})
    if not settings:
        settings = {
            "clinic_name": "ClinicFlow Hospital",
            "working_hours": "08:00-20:00",
            "queue_settings": "Strict",
            "default_consultation_duration": 15,
            "congestion_threshold": 70,
            "timezone": "UTC",
            "medicine_expiry_warning_days": 30
        }
    else:
        settings["id"] = settings["_id"]
        del settings["_id"]
        
    return StandardResponse(success=True, data=settings)

@router.put("/", response_model=StandardResponse)
async def update_settings(settings: dict):
    await database.settings.update_one(
        {"_id": "global"},
        {"$set": settings},
        upsert=True
    )
    return StandardResponse(success=True, data=settings)
