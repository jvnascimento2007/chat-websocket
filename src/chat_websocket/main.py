from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, dict[WebSocket, str]] = {}

    async def connect(self, room: str, ws: WebSocket, name: str):
        await ws.accept()

        self.rooms.setdefault(room, {})[ws] = name

    async def disconnect(self, room: str, ws: WebSocket) -> str:
        name = self.rooms.get(room, {}).pop(ws, None)

        if room in self.rooms and not self.rooms[room]:
            del self.rooms[room]

        return name

    def get_users(self, room: str) -> list[str]:
        return list(self.rooms.get(room, {}).values())

    async def broadcast(self, room: str, data: dict):
        for ws in list(self.rooms.get(room, {})):
            try:
                await ws.send_json(data)
            except Exception as err:
                print(f'Ocorreu um erro: {err}')

manager = ConnectionManager()

app = FastAPI()

app.mount('/static', StaticFiles(directory='static'), name='static')

@app.get('/')
def index():
    return FileResponse('static/index.html')

@app.websocket('/chat/{room}/{name}')
async def chat(ws: WebSocket, room: str, name: str):
    await manager.connect(room, ws, name)
    
    await manager.broadcast(
        room,
        {
            'type': 'system',
            'content': f'{name} se conectou',
            'users': manager.get_users(room)
        }
    )

    try:
        while True:
            data = await ws.receive_json()

            content = str(data.get('content', '')).strip()[:500]

            if content:
                await manager.broadcast(
                    room,
                    {
                        'type': 'message',
                        'content': content,
                        'author': name,
                    }
                )
    except WebSocketDisconnect:
        manager.disconnect(room, ws)
        await manager.broadcast(
            room,
            {
                'type': 'system',
                'content': f'{name} se desconectou',
                'users': manager.get_users()
            }
        )