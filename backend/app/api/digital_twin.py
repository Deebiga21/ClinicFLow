from fastapi import APIRouter, Request
from pydantic import BaseModel
import random

router = APIRouter()

class SimulationRequest(BaseModel):
    added_patients: int = 5
    removed_doctors: int = 0

@router.post("/simulate")
async def simulate_clinic(request: Request, sim_req: SimulationRequest):
    # Retrieve current state to base simulation on
    db = request.app.state.db
    current_waiting = await db.tokens.count_documents({"status": "waiting"})
    
    # Simulate impact
    simulated_waiting = current_waiting + sim_req.added_patients
    
    # Assume base of 5 doctors if none are found in DB
    doctors_count = await db.doctors.count_documents({})
    effective_doctors = max(1, (doctors_count or 5) - sim_req.removed_doctors)
    
    simulated_wait_time = max(0, (simulated_waiting * 15) // effective_doctors)
    
    return {
        "simulation_scenario": {
            "added_patients": sim_req.added_patients,
            "removed_doctors": sim_req.removed_doctors
        },
        "impact": {
            "projected_wait_time": simulated_wait_time,
            "projected_queue_length": simulated_waiting,
            "bottleneck_risk": "High" if simulated_wait_time > 45 else "Low"
        },
        "recommendation": "Deploy backup doctor immediately" if simulated_wait_time > 45 else "Current capacity is sufficient"
    }
