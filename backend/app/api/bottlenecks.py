from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/current")
async def get_current_bottlenecks(request: Request):
    return {
        "stage": "Doctor Consultation",
        "predicted_time": "11:30",
        "expected_queue": 18,
        "impact": "High",
        "recommendation": "Allocate secondary doctor to room 2"
    }

@router.get("/forecast")
async def get_forecast_bottlenecks(request: Request):
    return [
        {
            "stage": "Pharmacy",
            "predicted_time": "14:00",
            "expected_queue": 25,
            "impact": "Medium",
            "recommendation": "Prepare common prescriptions in advance"
        }
    ]
