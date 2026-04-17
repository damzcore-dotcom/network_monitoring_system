"""
WebSocket connection manager for broadcasting real-time updates.
"""
import json
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections and broadcasts messages to all connected clients."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Send a message to all connected clients."""
        if not self.active_connections:
            return

        data = json.dumps(message)
        disconnected = []

        async with self._lock:
            for connection in self.active_connections:
                try:
                    await connection.send_text(data)
                except Exception:
                    disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            async with self._lock:
                if conn in self.active_connections:
                    self.active_connections.remove(conn)

    async def broadcast_device_update(self, device_data: Dict[str, Any]):
        """Broadcast a device status update to all clients."""
        await self.broadcast({
            "type": "device_update",
            "data": device_data
        })

    async def broadcast_alert(self, alert_data: Dict[str, Any]):
        """Broadcast a new alert to all clients."""
        await self.broadcast({
            "type": "new_alert",
            "data": alert_data
        })

    async def broadcast_bulk_update(self, devices_data: list):
        """Broadcast bulk device status updates."""
        await self.broadcast({
            "type": "bulk_update",
            "data": devices_data
        })


# Singleton instance
manager = ConnectionManager()
