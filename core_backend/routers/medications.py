from fastapi import APIRouter
from sqlalchemy import text
from services.orchestration import OrchestrationService
import json

router = APIRouter(prefix="/api/medications", tags=["medications"])
orchestrator = OrchestrationService()

@router.get("/prescriptions")
def get_prescriptions():
    with orchestrator.Session() as session:
        query = text("""
            SELECT id, consultation_id, patient_id, doctor_id, medications, notes, status, created_at 
            FROM prescriptions
            ORDER BY created_at DESC
        """)
        results = session.execute(query).mappings().all()
        
        data = []
        for r in results:
            meds = []
            if r["medications"]:
                try:
                    meds = json.loads(r["medications"])
                except:
                    pass
            
            data.append({
                "id": r["id"],
                "consultation_id": r["consultation_id"],
                "patient_id": r["patient_id"],
                "doctor_id": r["doctor_id"],
                "medications": meds,
                "notes": r["notes"],
                "status": r["status"],
                "created_at": r["created_at"]
            })
            
        return {"data": data}
