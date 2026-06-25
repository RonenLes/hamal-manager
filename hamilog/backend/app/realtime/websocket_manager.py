from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    """Tracks active driver and dispatcher WebSocket connections."""

    def __init__(self) -> None:
        self.driver_connections: Dict[str, WebSocket] = {}
        self.dispatcher_connections: List[WebSocket] = []

    async def connect_driver(self, driver_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.driver_connections[driver_id] = websocket

    async def connect_dispatcher(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.dispatcher_connections.append(websocket)

    def disconnect_driver(self, driver_id: str) -> None:
        self.driver_connections.pop(driver_id, None)

    def disconnect_dispatcher(self, websocket: WebSocket) -> None:
        if websocket in self.dispatcher_connections:
            self.dispatcher_connections.remove(websocket)

    async def broadcast_to_dispatchers(self, message: dict) -> None:
        stale: List[WebSocket] = []
        for websocket in self.dispatcher_connections:
            try:
                await websocket.send_json(message)
            except Exception:
                stale.append(websocket)

        for websocket in stale:
            self.disconnect_dispatcher(websocket)

    async def send_to_driver(self, driver_id: str, message: dict) -> None:
        websocket = self.driver_connections.get(driver_id)
        if websocket is None:
            return

        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect_driver(driver_id)
