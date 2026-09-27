from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/status")
async def get_resource_status(request: Request):
    return {
        "rooms_available": 3,
        "doctors_available": 2,
        "nurses_available": 5,
        "utilization_rate": 85
    }

@router.get("/forecast")
async def get_resource_forecast(request: Request):
    return {
        "predicted_shortage": "doctors",
        "time": "15:00",
        "severity": "Medium"
    }
