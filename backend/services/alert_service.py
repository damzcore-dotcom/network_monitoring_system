"""
Alert service for managing notifications and alert creation.
"""
from datetime import datetime
from database import get_db


async def create_alert(device_id: int, alert_type: str, message: str) -> dict:
    """Create a new alert in the database and return it."""
    db = await get_db()
    try:
        now = datetime.now().isoformat()
        cursor = await db.execute(
            """INSERT INTO alerts (device_id, alert_type, message, created_at)
               VALUES (?, ?, ?, ?)""",
            (device_id, alert_type, message, now)
        )
        await db.commit()
        alert_id = cursor.lastrowid

        # Get device info for the alert
        cursor2 = await db.execute(
            "SELECT name, ip_address FROM devices WHERE id = ?",
            (device_id,)
        )
        device = await cursor2.fetchone()
        device_name = device["name"] if device else "Unknown"
        device_ip = device["ip_address"] if device else ""

        return {
            "id": alert_id,
            "device_id": device_id,
            "device_name": device_name,
            "device_ip": device_ip,
            "alert_type": alert_type,
            "message": message,
            "acknowledged": False,
            "created_at": now
        }
    finally:
        await db.close()


async def get_recent_alerts(limit: int = 50) -> list:
    """Get recent alerts with device info."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT a.*, d.name as device_name, d.ip_address as device_ip
               FROM alerts a
               LEFT JOIN devices d ON a.device_id = d.id
               ORDER BY a.created_at DESC
               LIMIT ?""",
            (limit,)
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "device_id": row["device_id"],
                "device_name": row["device_name"] or "Unknown",
                "device_ip": row["device_ip"] or "",
                "alert_type": row["alert_type"],
                "message": row["message"],
                "acknowledged": bool(row["acknowledged"]),
                "created_at": row["created_at"]
            }
            for row in rows
        ]
    finally:
        await db.close()


async def acknowledge_alert(alert_id: int) -> bool:
    """Mark an alert as acknowledged."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "UPDATE alerts SET acknowledged = 1 WHERE id = ?",
            (alert_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()
