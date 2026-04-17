"""
Database initialization and connection management for SQLite.
"""
import aiosqlite
import sqlite3
from config import DATABASE_PATH

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('modem', 'router', 'switch', 'ap', 'pc', 'server', 'printer')),
    ip_address TEXT NOT NULL,
    parent_id INTEGER,
    snmp_community TEXT DEFAULT 'public',
    location TEXT DEFAULT '',
    floor TEXT DEFAULT '',
    pos_x REAL DEFAULT 100,
    pos_y REAL DEFAULT 100,
    icon TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES devices(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS device_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('online', 'offline', 'warning', 'unreachable')),
    latency_ms REAL,
    tx_rate REAL DEFAULT 0,
    rx_rate REAL DEFAULT 0,
    packet_loss REAL DEFAULT 0,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('down', 'high_latency', 'recovered', 'unreachable')),
    message TEXT,
    acknowledged INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    notes TEXT DEFAULT '',
    performed_by TEXT DEFAULT '',
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topology_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_status_device_id ON device_status(device_id);
CREATE INDEX IF NOT EXISTS idx_device_status_checked_at ON device_status(checked_at);
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
"""

SEED_SQL = """
-- Demo data: garment factory network topology
INSERT OR IGNORE INTO devices (id, name, type, ip_address, parent_id, location, floor, pos_x, pos_y) VALUES
    (1, 'ISP Modem', 'modem', '192.168.1.1', NULL, 'Server Room', 'Lt. 1', 400, 50),
    (2, 'Mikrotik Core', 'router', '10.10.1.1', 1, 'Server Room', 'Lt. 1', 400, 180),
    (3, 'Switch Utama', 'switch', '10.10.1.2', 2, 'Server Room', 'Lt. 1', 400, 310),
    (4, 'Switch Cutting', 'switch', '10.10.2.1', 3, 'Ruang Cutting', 'Lt. 1', 150, 440),
    (5, 'Switch Sewing', 'switch', '10.10.3.1', 3, 'Ruang Sewing', 'Lt. 1', 400, 440),
    (6, 'Switch Finishing', 'switch', '10.10.4.1', 3, 'Ruang Finishing', 'Lt. 1', 650, 440),
    (7, 'AP Cutting', 'ap', '10.10.2.10', 4, 'Ruang Cutting', 'Lt. 1', 80, 570),
    (8, 'AP Sewing', 'ap', '10.10.3.10', 5, 'Ruang Sewing', 'Lt. 1', 330, 570),
    (9, 'AP Finishing', 'ap', '10.10.4.10', 6, 'Ruang Finishing', 'Lt. 1', 580, 570),
    (10, 'PC Admin Cutting', 'pc', '10.10.2.50', 4, 'Ruang Cutting', 'Lt. 1', 220, 570),
    (11, 'PC Admin Sewing', 'pc', '10.10.3.50', 5, 'Ruang Sewing', 'Lt. 1', 470, 570),
    (12, 'Server Produksi', 'server', '10.10.1.100', 3, 'Server Room', 'Lt. 1', 200, 310),
    (13, 'Printer Office', 'printer', '10.10.1.200', 3, 'Office', 'Lt. 2', 600, 310),
    (14, 'Switch Lt.2', 'switch', '10.10.5.1', 2, 'Office Lt.2', 'Lt. 2', 700, 180),
    (15, 'AP Office', 'ap', '10.10.5.10', 14, 'Office Lt.2', 'Lt. 2', 750, 310);
"""


def init_db_sync():
    """Initialize database synchronously (used at startup)."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.executescript(SCHEMA_SQL)
    # Check if devices table is empty and seed
    cursor = conn.execute("SELECT COUNT(*) FROM devices")
    count = cursor.fetchone()[0]
    if count == 0:
        conn.executescript(SEED_SQL)
    conn.commit()
    conn.close()


async def get_db() -> aiosqlite.Connection:
    """Get an async database connection."""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db
