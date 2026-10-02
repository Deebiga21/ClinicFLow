import re

with open("core_backend/main.py", "r") as f:
    code = f.read()

ws_manager = """
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/clinic")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except:
        manager.disconnect(websocket)
"""

# Replace the old ws
code = re.sub(r'@app\.websocket\("/ws"\).*?pass', ws_manager, code, flags=re.DOTALL)

# Also add broadcast
code = code.replace("await sio.emit('systemBroadcast', result)", "await sio.emit('systemBroadcast', result)\n    await manager.broadcast({'type': 'update', 'data': result})")

with open("core_backend/main.py", "w") as f:
    f.write(code)
