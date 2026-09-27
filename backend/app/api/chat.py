from fastapi import APIRouter
from typing import List
from datetime import datetime

from app.schemas.core import StandardResponse
from app.database import database

router = APIRouter()

@router.get("/{token_number}", response_model=StandardResponse)
async def get_chat_history(token_number: int):
    cursor = database.messages.find({"tokenNumber": token_number}).sort("createdAt", 1).limit(200)
    messages = await cursor.to_list(length=200)
    for m in messages:
        m["_id"] = str(m["_id"])
        # Format createdAt if needed, but dict already has it as datetime
    return StandardResponse(success=True, data={"messages": messages})

@router.get("/", response_model=StandardResponse)
async def get_chat_threads():
    # Aggregate to get latest message per token
    pipeline = [
        {"$sort": {"createdAt": -1}},
        {"$group": {
            "_id": "$tokenNumber",
            "lastMessage": {"$first": "$text"},
            "lastAt": {"$first": "$createdAt"}
        }},
        {"$sort": {"lastAt": -1}}
    ]
    cursor = database.messages.aggregate(pipeline)
    threads = await cursor.to_list(length=100)
    
    return StandardResponse(success=True, data={"threads": threads})
