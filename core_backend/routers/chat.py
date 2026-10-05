from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.chat_service import ChatService

# We'll use the orchestrator's event bus or just import sio if we can,
# but to avoid circular import, we can do it lazily or just let main.py handle it.
# Actually, we can import manager from main but it might cause circular import.
# Let's write a small helper in main.py to broadcast or just do it.
# For simplicity, we'll import sio and manager inside the route handlers!

router = APIRouter(prefix="/api/chat", tags=["Chat"])
chat_service = ChatService()

class ChatMessageRequest(BaseModel):
    sender_id: str
    sender_role: str
    channel: str
    message: str
    message_type: str = "text"
    related_entity_type: str = None
    related_entity_id: str = None
    receiver_id: str = None

class BotQueryRequest(BaseModel):
    sender_id: str
    sender_role: str
    message: str

async def broadcast_chat_message(msg):
    try:
        from main import sio, manager
        await sio.emit('chat_message_created', msg)
        await manager.broadcast({'type': 'chat_message_created', 'data': msg})
    except ImportError:
        pass

@router.get("/channels/{channel}/messages")
def get_channel_messages(channel: str):
    return {"data": chat_service.get_messages(channel)}

@router.post("/messages")
async def post_message(req: ChatMessageRequest):
    msg = chat_service.save_message(
        sender_id=req.sender_id,
        sender_role=req.sender_role,
        channel=req.channel,
        message=req.message,
        message_type=req.message_type,
        related_entity_type=req.related_entity_type,
        related_entity_id=req.related_entity_id,
        receiver_id=req.receiver_id
    )
    await broadcast_chat_message(msg)
    return {"ok": True, "data": msg}

@router.post("/bot/query")
async def query_bot(req: BotQueryRequest):
    user_msg, bot_msg = chat_service.handle_bot_query(
        sender_id=req.sender_id,
        sender_role=req.sender_role,
        message=req.message
    )
    await broadcast_chat_message(user_msg)
    await broadcast_chat_message(bot_msg)
    return {"ok": True, "data": {"user_message": user_msg, "bot_response": bot_msg}}
