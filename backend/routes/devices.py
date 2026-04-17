"""
Device management API routes.
"""
from fastapi import APIRouter, HTTPException
from models import DeviceCreate, DeviceUpdate, DeviceResponse
from database import get_db
from services.monitor import get_current_status

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("")
async def list_devices():
    """Get all devices with their current status."""
    devices = await get_current_status()
    return devices


@router.get("/{device_id}")
async def get_device(device_id: int):
    """Get a single device with current status."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT d.*,
                      ds.status, ds.latency_ms, ds.tx_rate, ds.rx_rate
               FROM devices d
               LEFT JOIN (
                   SELECT device_id, status, latency_ms, tx_rate, rx_rate,
                          ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY checked_at DESC) as rn
                   FROM device_status
               ) ds ON d.id = ds.device_id AND ds.rn = 1
               WHERE d.id = ?""",
            (device_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Device not found")
        return {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "ip_address": row["ip_address"],
            "parent_id": row["parent_id"],
            "snmp_community": row["snmp_community"],
            "location": row["location"],
            "floor": row["floor"],
            "pos_x": row["pos_x"],
            "pos_y": row["pos_y"],
            "created_at": row["created_at"],
            "status": row["status"] or "offline",
            "latency_ms": row["latency_ms"],
            "tx_rate": row["tx_rate"] or 0,
            "rx_rate": row["rx_rate"] or 0,
        }
    finally:
        await db.close()


@router.post("")
async def create_device(device: DeviceCreate):
    """Add a new device to monitor."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO devices (name, type, ip_address, parent_id, snmp_community,
                                    location, floor, pos_x, pos_y)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (device.name, device.type, device.ip_address, device.parent_id,
             device.snmp_community, device.location, device.floor,
             device.pos_x, device.pos_y)
        )
        await db.commit()
        return {"id": cursor.lastrowid, "message": "Device created successfully"}
    finally:
        await db.close()


@router.put("/{device_id}")
async def update_device(device_id: int, device: DeviceUpdate):
    """Update an existing device."""
    db = await get_db()
    try:
        # Build dynamic update query
        updates = []
        values = []
        for field, value in device.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            values.append(value)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        values.append(device_id)
        query = f"UPDATE devices SET {', '.join(updates)} WHERE id = ?"
        cursor = await db.execute(query, values)
        await db.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Device not found")

        return {"message": "Device updated successfully"}
    finally:
        await db.close()


@router.delete("/{device_id}")
async def delete_device(device_id: int):
    """Delete a device."""
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM devices WHERE id = ?", (device_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Device not found")
        return {"message": "Device deleted successfully"}
    finally:
        await db.close()


@router.get("/{device_id}/history")
async def get_device_history(device_id: int, hours: int = 1):
    """Get status history for a device (for charts)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT status, latency_ms, tx_rate, rx_rate, checked_at
               FROM device_status
               WHERE device_id = ?
                 AND checked_at >= datetime('now', ?)
               ORDER BY checked_at ASC""",
            (device_id, f"-{hours} hours")
        )
        rows = await cursor.fetchall()
        return [
            {
                "status": row["status"],
                "latency_ms": row["latency_ms"],
                "tx_rate": row["tx_rate"],
                "rx_rate": row["rx_rate"],
                "checked_at": row["checked_at"]
            }
            for row in rows
        ]
    finally:
        await db.close()
