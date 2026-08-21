from fastapi import WebSocket
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        # Maps workspace_id -> list of active websockets
        self.active_connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, workspace_id: int):
        await websocket.accept()
        self.active_connections[workspace_id].append(websocket)

    def disconnect(self, websocket: WebSocket, workspace_id: int):
        if websocket in self.active_connections[workspace_id]:
            self.active_connections[workspace_id].remove(websocket)
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]

    async def broadcast(self, workspace_id: int, message: str):
        if workspace_id in self.active_connections:
            for connection in self.active_connections[workspace_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Ignore errors from disconnected clients that haven't been cleaned up yet
                    pass

manager = ConnectionManager()
