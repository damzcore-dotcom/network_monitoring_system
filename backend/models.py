"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── Device Models ─────────────────────────────────────────────

class DeviceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(modem|router|switch|ap|pc|server|printer)$")
    ip_address: str = Field(..., min_length=7)
    parent_id: Optional[int] = None
    snmp_community: str = "public"
    location: str = ""
    floor: str = ""
    pos_x: float = 100
    pos_y: float = 100


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ip_address: Optional[str] = None
    parent_id: Optional[int] = None
    snmp_community: Optional[str] = None
    location: Optional[str] = None
    floor: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None


class DeviceResponse(BaseModel):
    id: int
    name: str
    type: str
    ip_address: str
    parent_id: Optional[int] = None
    snmp_community: str = "public"
    location: str = ""
    floor: str = ""
    pos_x: float = 0
    pos_y: float = 0
    created_at: Optional[str] = None
    # Live status fields (joined from latest status)
    status: str = "offline"
    latency_ms: Optional[float] = None
    tx_rate: float = 0
    rx_rate: float = 0


# ─── Position Models ───────────────────────────────────────────

class PositionUpdate(BaseModel):
    id: int
    pos_x: float
    pos_y: float


class BulkPositionUpdate(BaseModel):
    positions: List[PositionUpdate]


# ─── Alert Models ──────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: int
    device_id: int
    device_name: str = ""
    device_ip: str = ""
    alert_type: str
    message: str = ""
    acknowledged: bool = False
    created_at: Optional[str] = None


# ─── Maintenance Models ───────────────────────────────────────

class MaintenanceCreate(BaseModel):
    device_id: int
    action: str = Field(..., min_length=1)
    notes: str = ""
    performed_by: str = ""


class MaintenanceResponse(BaseModel):
    id: int
    device_id: int
    action: str
    notes: str = ""
    performed_by: str = ""
    performed_at: Optional[str] = None


# ─── Topology Settings ────────────────────────────────────────

class TopologySettingUpdate(BaseModel):
    key: str
    value: str


# ─── WebSocket Message Models ─────────────────────────────────

class DeviceStatusUpdate(BaseModel):
    """Sent via WebSocket when device status changes."""
    device_id: int
    name: str
    ip_address: str
    status: str
    latency_ms: Optional[float] = None
    tx_rate: float = 0
    rx_rate: float = 0
    timestamp: str = ""


class AlertNotification(BaseModel):
    """Sent via WebSocket when new alert is created."""
    id: int
    device_id: int
    device_name: str
    alert_type: str
    message: str
    created_at: str = ""
