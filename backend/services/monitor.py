"""
Main monitoring service — background worker that continuously pings all devices
and updates their status. Implements parent-child fault propagation.
"""
import asyncio
import random
from datetime import datetime
from typing import Dict, Optional
from database import get_db
from services.ping_service import ping_host
from services.alert_service import create_alert
from websocket.manager import manager as ws_manager
from config import PING_INTERVAL_SECONDS

# Track previous status to detect changes
_previous_status: Dict[int, str] = {}
_monitor_task: Optional[asyncio.Task] = None


async def start_monitoring():
    """Start the background monitoring loop."""
    global _monitor_task
    if _monitor_task is not None:
        return
    _monitor_task = asyncio.create_task(_monitoring_loop())
    print("[Monitor] Background monitoring started.")


async def stop_monitoring():
    """Stop the background monitoring loop."""
    global _monitor_task
    if _monitor_task:
        _monitor_task.cancel()
        _monitor_task = None
        print("[Monitor] Background monitoring stopped.")


async def _monitoring_loop():
    """Main monitoring loop — runs forever."""
    while True:
        try:
            await _check_all_devices()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Monitor] Error in monitoring loop: {e}")
        await asyncio.sleep(PING_INTERVAL_SECONDS)


async def _check_all_devices():
    """Check all devices and update their status."""
    db = await get_db()
    try:
        # Get all devices with parent info
        cursor = await db.execute(
            "SELECT id, name, ip_address, parent_id, type FROM devices ORDER BY id"
        )
        devices = await cursor.fetchall()
        if not devices:
            return

        # Build parent-child map
        device_map = {}
        children_map = {}  # parent_id -> [child_ids]
        for d in devices:
            device_map[d["id"]] = dict(d)
            parent_id = d["parent_id"]
            if parent_id:
                if parent_id not in children_map:
                    children_map[parent_id] = []
                children_map[parent_id].append(d["id"])

        # Ping all devices concurrently (limited)
        ping_results = {}
        semaphore = asyncio.Semaphore(10)

        async def _ping(device_id, ip):
            async with semaphore:
                status, latency = await ping_host(ip)
                ping_results[device_id] = (status, latency)

        await asyncio.gather(
            *[_ping(d["id"], d["ip_address"]) for d in devices]
        )

        # Apply parent-child propagation
        # If a parent is offline, all children are "unreachable"
        final_status = {}
        for d in devices:
            did = d["id"]
            status, latency = ping_results.get(did, ("offline", None))

            # Check if any ancestor is offline
            if _is_ancestor_offline(did, device_map, ping_results):
                final_status[did] = ("unreachable", None)
            else:
                final_status[did] = (status, latency)

        # Generate simulated traffic data
        now = datetime.now().isoformat()
        updates = []

        for d in devices:
            did = d["id"]
            status, latency = final_status[did]

            # Simulate traffic rates for demo
            tx_rate = random.uniform(100000, 5000000) if status == "online" else 0
            rx_rate = random.uniform(100000, 5000000) if status == "online" else 0

            # Save to database
            await db.execute(
                """INSERT INTO device_status (device_id, status, latency_ms, tx_rate, rx_rate, checked_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (did, status, latency, tx_rate, rx_rate, now)
            )

            # Check for status changes and create alerts
            prev = _previous_status.get(did)
            if prev and prev != status:
                if status == "offline":
                    alert = await create_alert(
                        did, "down",
                        f"{d['name']} ({d['ip_address']}) is DOWN"
                    )
                    await ws_manager.broadcast_alert(alert)
                elif status == "warning":
                    alert = await create_alert(
                        did, "high_latency",
                        f"{d['name']} ({d['ip_address']}) high latency: {latency}ms"
                    )
                    await ws_manager.broadcast_alert(alert)
                elif status == "online" and prev in ("offline", "unreachable"):
                    alert = await create_alert(
                        did, "recovered",
                        f"{d['name']} ({d['ip_address']}) has recovered"
                    )
                    await ws_manager.broadcast_alert(alert)

            _previous_status[did] = status

            updates.append({
                "device_id": did,
                "name": d["name"],
                "ip_address": d["ip_address"],
                "type": d["type"],
                "status": status,
                "latency_ms": latency,
                "tx_rate": round(tx_rate, 0),
                "rx_rate": round(rx_rate, 0),
                "timestamp": now
            })

        await db.commit()

        # Broadcast bulk update to all WebSocket clients
        await ws_manager.broadcast_bulk_update(updates)

        # Clean old status records (keep last 72 hours)
        await db.execute(
            "DELETE FROM device_status WHERE checked_at < datetime('now', '-3 days')"
        )
        await db.commit()

    finally:
        await db.close()


def _is_ancestor_offline(device_id: int, device_map: dict, ping_results: dict) -> bool:
    """Check if any ancestor of a device is offline (recursive)."""
    device = device_map.get(device_id)
    if not device:
        return False

    parent_id = device.get("parent_id")
    if not parent_id:
        return False

    # Check parent status
    parent_result = ping_results.get(parent_id)
    if parent_result and parent_result[0] == "offline":
        return True

    # Recurse up the tree
    return _is_ancestor_offline(parent_id, device_map, ping_results)


async def get_current_status() -> list:
    """Get the current status of all devices (latest record)."""
    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT d.*,
                   ds.status, ds.latency_ms, ds.tx_rate, ds.rx_rate, ds.checked_at
            FROM devices d
            LEFT JOIN (
                SELECT device_id, status, latency_ms, tx_rate, rx_rate, checked_at,
                       ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY checked_at DESC) as rn
                FROM device_status
            ) ds ON d.id = ds.device_id AND ds.rn = 1
            ORDER BY d.id
        """)
        rows = await cursor.fetchall()
        return [
            {
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
            for row in rows
        ]
    finally:
        await db.close()
