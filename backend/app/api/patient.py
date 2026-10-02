from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard/{patient_id}")
async def get_patient_dashboard(patient_id: str):
    return {
        "patient": {"name": "Alex Johnson"},
        "today_appointment": {
            "doctor_id": "Smith",
            "appointment_time": "10:30 AM"
        },
        "check_in_status": True,
        "queue_status": {
            "token_number": 42,
            "queue_position": 3
        },
        "waiting_prediction": {
            "predicted_wait": 18,
            "explanation": "2 patients ahead of you. Dr. Smith is averaging 9 mins per consult."
        },
        "journey": [
            {"stage_name": "Appointment", "stage_completed_at": "2023-10-01T10:00:00Z"},
            {"stage_name": "Arrival", "stage_completed_at": "2023-10-01T10:15:00Z"},
            {"stage_name": "Check-in", "stage_completed_at": "2023-10-01T10:16:00Z"},
            {"stage_name": "Queue", "stage_completed_at": None},
            {"stage_name": "Nurse", "stage_completed_at": None},
            {"stage_name": "Doctor", "stage_completed_at": None},
            {"stage_name": "Completed", "stage_completed_at": None}
        ],
        "next_expected_event": {
            "event": "Nurse Triage",
            "time": "in ~5 mins"
        },
        "readiness": {
            "readiness_score": 90,
            "missing_info": "Insurance Card Update"
        },
        "medication_summary": [
            {"medicine_name": "Amoxicillin", "dosage": "500mg", "frequency": "2x daily"}
        ]
    }
