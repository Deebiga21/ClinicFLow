import socketio

# Create a Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

class ConnectionManager:
    async def broadcast(self, message: dict, room: str = None):
        event = message.get("event", "message")
        data = message.get("data", {})
        if room:
            await sio.emit(event, data, room=room)
        else:
            await sio.emit(event, data)

manager = ConnectionManager()

from datetime import datetime

@sio.on('chat:join')
async def on_chat_join(sid, data):
    token_number = data.get('tokenNumber')
    if token_number:
        sio.enter_room(sid, f"token:{token_number}")

@sio.on('chat:leave')
async def on_chat_leave(sid, data):
    token_number = data.get('tokenNumber')
    if token_number:
        sio.leave_room(sid, f"token:{token_number}")

@sio.on('doctor:join')
async def on_doctor_join(sid, data):
    doctor_id = data.get('doctorId')
    if doctor_id:
        sio.enter_room(sid, f"doctor:{doctor_id}")

@sio.on('chat:send')
async def on_chat_send(sid, data):
    token_number = data.get('tokenNumber')
    text = data.get('text', '').strip()
    sender_role = data.get('senderRole')
    sender_name = data.get('senderName', '')
    
    if not token_number or not text:
        return
        
    sender_role = 'staff' if sender_role == 'staff' else 'patient'
    
    # Needs access to database. For now we will import it
    from app.database import database
    
    msg = {
        "tokenNumber": int(token_number),
        "senderRole": sender_role,
        "senderName": sender_name,
        "text": text,
        "createdAt": datetime.utcnow()
    }
    
    result = await database.messages.insert_one(msg.copy())
    msg["_id"] = str(result.inserted_id)
    msg["createdAt"] = msg["createdAt"].isoformat()
    
    await sio.emit('chat:message', msg, room=f"token:{token_number}")
    await sio.emit('chat:new_message', msg)
    
    if sender_role != 'staff':
        await sio.emit('notify', {
            "tone": "info",
            "title": f"New Message from Token #{token_number}",
            "message": f"{sender_name or 'Patient'}: \"{text[:45]}\"",
            "tokenNumber": token_number
        })
