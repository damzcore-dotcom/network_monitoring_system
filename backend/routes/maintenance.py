"""
Maintenance log API routes.
"""
from fastapi import APIRouter, HTTPException
from models import MaintenanceCreate
from database import get_db

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("/{device_id}")
async def get_maintenance_logs(device_id: int):
    """Get maintenance history for a device."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT * FROM maintenance_logs
               WHERE device_id = ?
               ORDER BY performed_at DESC""",
            (device_id,)
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "device_id": row["device_id"],
                "action": row["action"],
                "notes": row["notes"],
                "performed_by": row["performed_by"],
                "performed_at": row["performed_at"]
            }
            for row in rows
        ]
    finally:
        await db.close()


@router.post("")
async def create_maintenance_log(log: MaintenanceCreate):
    """Add a maintenance log entry."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO maintenance_logs (device_id, action, notes, performed_by)
               VALUES (?, ?, ?, ?)""",
            (log.device_id, log.action, log.notes, log.performed_by)
        )
        await db.commit()
        return {"id": cursor.lastrowid, "message": "Maintenance log created"}
    finally:
        await db.close()
