"""
Network Monitoring System — FastAPI Backend Entry Point
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import API_HOST, API_PORT, CORS_ORIGINS
from database import init_db_sync
from websocket.manager import manager as ws_manager
from services.monitor import start_monitoring, stop_monitoring

# Import route modules
from routes.devices import router as devices_router
from routes.topology import router as topology_router
from routes.alerts import router as alerts_router
from routes.maintenance import router as maintenance_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("=" * 50)
    print("  Network Monitoring System — Starting...")
    print("=" * 50)
    init_db_sync()
    print("[DB] Database initialized.")
    await start_monitoring()
    print("[Monitor] Monitoring worker started.")
    print(f"[API] Server running at http://{API_HOST}:{API_PORT}")
    print("=" * 50)
    yield
    # Shutdown
    await stop_monitoring()
    print("[Monitor] Monitoring worker stopped.")


app = FastAPI(
    title="Network Monitoring System",
    description="Real-time network device monitoring for garment factory",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(devices_router)
app.include_router(topology_router)
app.include_router(alerts_router)
app.include_router(maintenance_router)


# ─── WebSocket Endpoint ───────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time device status updates."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive — client can also send messages
            data = await websocket.receive_text()
            # Echo back or handle client messages if needed
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)


# ─── Health Check ──────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Network Monitoring System",
        "websocket_clients": len(ws_manager.active_connections)
    }


# ─── Stats Endpoint ───────────────────────────────────────────

@app.get("/api/stats")
async def get_stats():
    """Get overview statistics."""
    from database import get_db
    db = await get_db()
    try:
        # Device counts by status
        cursor = await db.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN ds.status = 'online' THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN ds.status = 'offline' THEN 1 ELSE 0 END) as offline,
                SUM(CASE WHEN ds.status = 'warning' THEN 1 ELSE 0 END) as warning,
                SUM(CASE WHEN ds.status = 'unreachable' THEN 1 ELSE 0 END) as unreachable,
                AVG(CASE WHEN ds.latency_ms IS NOT NULL THEN ds.latency_ms END) as avg_latency
            FROM devices d
            LEFT JOIN (
                SELECT device_id, status, latency_ms,
                       ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY checked_at DESC) as rn
                FROM device_status
            ) ds ON d.id = ds.device_id AND ds.rn = 1
        """)
        row = await cursor.fetchone()

        # Active alerts count
        alert_cursor = await db.execute(
            "SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0"
        )
        alert_row = await alert_cursor.fetchone()

        return {
            "total_devices": row["total"] or 0,
            "online": row["online"] or 0,
            "offline": row["offline"] or 0,
            "warning": row["warning"] or 0,
            "unreachable": row["unreachable"] or 0,
            "avg_latency": round(row["avg_latency"] or 0, 1),
            "active_alerts": alert_row["count"] or 0
        }
    finally:
        await db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
