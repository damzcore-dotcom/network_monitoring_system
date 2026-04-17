/**
 * API client for backend communication.
 */
const API_BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Devices ──────────────────────────────────────────
export function fetchDevices() {
  return request('/devices');
}

export function fetchDevice(id) {
  return request(`/devices/${id}`);
}

export function createDevice(data) {
  return request('/devices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateDevice(id, data) {
  return request(`/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteDevice(id) {
  return request(`/devices/${id}`, {
    method: 'DELETE',
  });
}

export function fetchDeviceHistory(id, hours = 1) {
  return request(`/devices/${id}/history?hours=${hours}`);
}

// ─── Stats ────────────────────────────────────────────
export function fetchStats() {
  return request('/stats');
}

// ─── Topology ─────────────────────────────────────────
export function updatePositions(positions) {
  return request('/topology/positions', {
    method: 'PUT',
    body: JSON.stringify({ positions }),
  });
}

// ─── Alerts ───────────────────────────────────────────
export function fetchAlerts(limit = 50) {
  return request(`/alerts?limit=${limit}`);
}

export function acknowledgeAlert(id) {
  return request(`/alerts/${id}/acknowledge`, {
    method: 'PUT',
  });
}

// ─── Maintenance ──────────────────────────────────────
export function fetchMaintenanceLogs(deviceId) {
  return request(`/maintenance/${deviceId}`);
}

export function createMaintenanceLog(data) {
  return request('/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Health ───────────────────────────────────────────
export function healthCheck() {
  return request('/health');
}
