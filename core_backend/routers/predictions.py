from fastapi import APIRouter, Depends
from services.ml_service import MLService

router = APIRouter(prefix="/api/predictions", tags=["predictions"])
ml_service = MLService()

@router.get("/waiting-time/{queue_id}")
def get_waiting_time(queue_id: str):
    return ml_service.get_waiting_time_prediction(queue_id)

@router.get("/consultation-duration/{appointment_id}")
def get_consultation_duration(appointment_id: str):
    return ml_service.get_consultation_duration_prediction(appointment_id)

@router.get("/arrival-forecast")
def get_arrival_forecast():
    return ml_service.get_arrival_forecast()

@router.get("/no-show/{appointment_id}")
def get_no_show(appointment_id: str):
    return ml_service.get_no_show_prediction(appointment_id)
