from fastapi import APIRouter
from typing import List
from datetime import datetime
from bson import ObjectId

from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/", response_model=StandardResponse)
async def get_feedback():
    cursor = database.feedback.find({}).sort("timestamp", -1)
    feedback = await cursor.to_list(length=100)
    for f in feedback:
        f["id"] = str(f["_id"])
        del f["_id"]
    return StandardResponse(success=True, data=feedback)

@router.post("/", response_model=StandardResponse)
async def submit_feedback(feedback_data: dict):
    feedback_data["timestamp"] = datetime.utcnow()
    result = await database.feedback.insert_one(feedback_data)
    feedback_data["id"] = str(result.inserted_id)
    return StandardResponse(success=True, data=feedback_data)

@router.get("/predictions", response_model=StandardResponse)
async def get_prediction_feedback():
    cursor = database.feedback.find({"type": "consultation_duration"}).sort("timestamp", -1)
    feedback = await cursor.to_list(length=100)
    
    # Calculate some basic ML performance metrics
    if not feedback:
        return StandardResponse(success=True, data={"metrics": "Model Not Trained", "records": []})
        
    total_error = sum(f.get("error", 0) for f in feedback)
    mae = total_error / len(feedback)
    
    for f in feedback:
        f["id"] = str(f["_id"])
        del f["_id"]
        
    return StandardResponse(success=True, data={
        "metrics": {
            "model": "Consultation Duration Predictor",
            "version": "1.0",
            "MAE": round(mae, 2),
            "total_evaluations": len(feedback)
        },
        "records": feedback
    })
