import re

with open('core_backend/routers/clinical.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Change def create_appointment to async def
content = content.replace('def create_appointment(req: AppointmentCreate):', 'async def create_appointment(req: AppointmentCreate):')
content = content.replace('loop.create_task(sio.emit(', 'await sio.emit(')
content = content.replace("loop.create_task(manager.broadcast({'type': 'update', 'data': ws_data}))", "await manager.broadcast({'type': 'update', 'data': ws_data})")
content = content.replace('loop = asyncio.get_event_loop()', '')

with open('core_backend/routers/clinical.py', 'w', encoding='utf-8') as f:
    f.write(content)
