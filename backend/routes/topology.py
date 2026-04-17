"""
Topology layout and settings API routes.
"""
from fastapi import APIRouter, HTTPException
from models import BulkPositionUpdate, TopologySettingUpdate
from database import get_db

router = APIRouter(prefix="/api/topology", tags=["topology"])


@router.put("/positions")
async def update_positions(data: BulkPositionUpdate):
    """Bulk update node positions (after drag-and-drop)."""
    db = await get_db()
    try:
        for pos in data.positions:
            await db.execute(
                "UPDATE devices SET pos_x = ?, pos_y = ? WHERE id = ?",
                (pos.pos_x, pos.pos_y, pos.id)
            )
        await db.commit()
        return {"message": f"Updated {len(data.positions)} positions"}
    finally:
        await db.close()


@router.get("/settings")
async def get_settings():
    """Get all topology settings."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT key, value FROM topology_settings")
        rows = await cursor.fetchall()
        return {row["key"]: row["value"] for row in rows}
    finally:
        await db.close()


@router.put("/settings")
async def update_setting(data: TopologySettingUpdate):
    """Update a topology setting."""
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO topology_settings (key, value, updated_at)
               VALUES (?, ?, datetime('now'))
               ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')""",
            (data.key, data.value, data.value)
        )
        await db.commit()
        return {"message": "Setting updated"}
    finally:
        await db.close()
