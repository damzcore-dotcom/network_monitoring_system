"""
Configuration settings for the Network Monitoring System backend.
"""
import os

# Database
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "network_monitor.db")

# Monitoring
PING_INTERVAL_SECONDS = 5          # How often to ping devices
PING_TIMEOUT_SECONDS = 2           # Timeout for each ping
LATENCY_WARNING_THRESHOLD_MS = 100 # Above this = warning status
HISTORY_RETENTION_HOURS = 72       # Keep status history for 72 hours

# SNMP defaults
SNMP_COMMUNITY = "public"
SNMP_PORT = 161

# Server
API_HOST = "0.0.0.0"
API_PORT = 8000
CORS_ORIGINS = [
    "http://localhost:5174",   # Vite dev server
    "http://localhost:3000",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]
