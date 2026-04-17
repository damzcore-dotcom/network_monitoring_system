"""
Alert management API routes.
"""
from fastapi import APIRouter, HTTPException
from services.alert_service import get_recent_alerts, acknowledge_alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(limit: int = 50):
    """Get recent alerts."""
    alerts = await get_recent_alerts(limit)
    return alerts


@router.put("/{alert_id}/acknowledge")
async def ack_alert(alert_id: int):
    """Acknowledge an alert."""
    success = await acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged"}
