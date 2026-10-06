from fastapi import APIRouter, Depends
from services.ml_service import MLService
from pydantic import BaseModel

router = APIRouter(prefix="/api/predictions", tags=["predictions"])
ml_service = MLService()

class DepartmentPredictionRequest(BaseModel):
    reason: str
    symptoms: str

@router.post("/department")
def predict_department(req: DepartmentPredictionRequest):
    text = f"{req.reason} {req.symptoms}".lower()
    predicted_dept = "General Medicine"
    
    if any(w in text for w in ["bone", "fracture", "knee", "joint"]): predicted_dept = "Orthopedics"
    elif any(w in text for w in ["heart", "chest", "palpitation"]): predicted_dept = "Cardiology"
    elif any(w in text for w in ["skin", "rash", "acne", "hair"]): predicted_dept = "Dermatologist"
    elif any(w in text for w in ["child", "baby", "kid", "fever in baby"]): predicted_dept = "Pediatrics"
    elif any(w in text for w in ["eye", "vision", "blur"]): predicted_dept = "Ophthalmologist"
    elif any(w in text for w in ["tooth", "teeth", "dental", "gum"]): predicted_dept = "Dentist"
    elif any(w in text for w in ["depress", "anxiety", "mental", "mind", "stress"]): predicted_dept = "Psychiatrist"
    elif any(w in text for w in ["pregnant", "pregnancy", "period", "maternity"]): predicted_dept = "Gynecology"
    elif any(w in text for w in ["cancer", "tumor", "chemo"]): predicted_dept = "Oncologist"
    elif any(w in text for w in ["brain", "nerve", "seizure", "headache"]): predicted_dept = "Neurologist"
    elif any(w in text for w in ["kidney", "urine", "dialysis"]): predicted_dept = "Nephrologist"
    elif any(w in text for w in ["lung", "breath", "asthma", "cough"]): predicted_dept = "Pulmonologist"
    elif any(w in text for w in ["old", "elder", "age"]): predicted_dept = "Geriatrician"
    elif any(w in text for w in ["stomach", "digestion", "ulcer", "bowel"]): predicted_dept = "Gastroenterologist"
    elif any(w in text for w in ["fever", "cold", "sick", "pain", "general"]): predicted_dept = "General Medicine"
    
    # Suggest a mock doctor (or leave for frontend to select based on department)
    # We will just return predicted_dept, the frontend filters doctors by department anyway
    
    return {"predicted_department": predicted_dept}

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
