import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import StatsCards from './components/Dashboard/StatsCards';
import AlertPanel from './components/Dashboard/AlertPanel';
import TrafficChart from './components/Dashboard/TrafficChart';
import NetworkMap from './components/Topology/NetworkMap';
import DeviceDetail from './components/DevicePanel/DeviceDetail';
import DeviceForm from './components/DevicePanel/DeviceForm';
import { useWebSocket } from './hooks/useWebSocket';
import { DEVICE_ICONS, STATUS_COLORS, DEVICE_TYPE_LABELS } from './utils/constants';
import { formatRate } from './utils/helpers';
import {
  fetchDevices,
  fetchStats,
  fetchAlerts,
  acknowledgeAlert as ackAlertApi,
  createDevice,
  updateDevice,
  deleteDevice,
} from './services/api';
import { Plus, Trash2, Edit2, MapPin, Network, RefreshCw } from 'lucide-react';

// ─── Page Title Helper ────────────────────────────────────────
const PAGE_TITLES = {
  '/': 'Dashboard',
  '/topology': 'Network Map',
  '/devices': 'Devices',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
};

function PageWrapper({ children, isConnected }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className={`main-area ${location.pathname === '/topology' ? 'page-topology' : ''}`}>
      <Header title={title} isConnected={isConnected} />
      <div className="page-content">{children}</div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────
function DashboardPage({ stats, alerts, devices, onAcknowledge }) {
  const [selectedDevice, setSelectedDevice] = useState(null);

  return (
    <>
      <StatsCards stats={stats} />
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <TrafficChart
            deviceId={selectedDevice?.id}
            deviceName={selectedDevice?.name}
          />
          {/* Quick Device List */}
          <div className="devices-table-wrapper" style={{ flex: 1, overflow: 'auto' }}>
            <table className="devices-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Traffic</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDevice(d)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ marginRight: '8px' }}>
                        {DEVICE_ICONS[d.type]}
                      </span>
                      {d.name}
                    </td>
                    <td className="ip-cell">{d.ip_address}</td>
                    <td>
                      <span className={`status-badge ${d.status}`}>
                        <span className="status-badge-dot" />
                        {d.status}
                      </span>
                    </td>
                    <td className="text-mono">
                      {d.latency_ms != null ? `${d.latency_ms}ms` : '—'}
                    </td>
                    <td className="text-mono" style={{ fontSize: '11px' }}>
                      ↑{formatRate(d.tx_rate)} ↓{formatRate(d.rx_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="dashboard-sidebar">
          <AlertPanel alerts={alerts} onAcknowledge={onAcknowledge} />
        </div>
      </div>
    </>
  );
}

// ─── Topology Page ────────────────────────────────────────────
function TopologyPage({ devices, onAddDevice }) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="topology-container">
      <div className="topology-toolbar">
        <button
          className="toolbar-btn primary"
          onClick={() => setShowForm(true)}
          id="btn-add-device-topology"
        >
          <Plus size={14} /> Add Device
        </button>

        <div className="toolbar-separator" />

        <div className="topology-legend">
          <div className="legend-item">
            <div
              className="legend-dot"
              style={{ background: STATUS_COLORS.online, boxShadow: `0 0 6px ${STATUS_COLORS.online}` }}
            />
            Online
          </div>
          <div className="legend-item">
            <div
              className="legend-dot"
              style={{ background: STATUS_COLORS.warning, boxShadow: `0 0 6px ${STATUS_COLORS.warning}` }}
            />
            Warning
          </div>
          <div className="legend-item">
            <div
              className="legend-dot"
              style={{ background: STATUS_COLORS.offline, boxShadow: `0 0 6px ${STATUS_COLORS.offline}` }}
            />
            Offline
          </div>
          <div className="legend-item">
            <div
              className="legend-dot"
              style={{ background: STATUS_COLORS.unreachable }}
            />
            Unreachable
          </div>
        </div>
      </div>

      <NetworkMap
        devices={devices}
        onNodeClick={(device) => setSelectedDevice(device)}
      />

      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      {showForm && (
        <DeviceForm
          parentOptions={devices}
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            await onAddDevice(data);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Devices Page ─────────────────────────────────────────────
function DevicesPage({ devices, onAddDevice, onDeleteDevice, onUpdateDevice }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
          <Network size={20} style={{ marginRight: '8px', verticalAlign: '-3px' }} />
          All Devices ({devices.length})
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingDevice(null);
            setShowForm(true);
          }}
          id="btn-add-device-list"
        >
          <Plus size={14} /> Add Device
        </button>
      </div>

      <div className="devices-table-wrapper">
        <table className="devices-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Type</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Traffic ↑/↓</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>
                  <span style={{ marginRight: '8px' }}>{DEVICE_ICONS[d.type]}</span>
                  <strong>{d.name}</strong>
                </td>
                <td>
                  <span className={`type-${d.type}`}>
                    {DEVICE_TYPE_LABELS[d.type] || d.type}
                  </span>
                </td>
                <td className="ip-cell">{d.ip_address}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} style={{ color: 'var(--text-tertiary)' }} />
                    {d.location || '—'}
                    {d.floor ? ` · ${d.floor}` : ''}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${d.status}`}>
                    <span className="status-badge-dot" />
                    {d.status}
                  </span>
                </td>
                <td className="text-mono">
                  {d.latency_ms != null ? `${d.latency_ms}ms` : '—'}
                </td>
                <td className="text-mono" style={{ fontSize: '11px' }}>
                  ↑{formatRate(d.tx_rate)} / ↓{formatRate(d.rx_rate)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'var(--border-subtle)' }}
                      onClick={() => {
                        setEditingDevice(d);
                        setShowForm(true);
                      }}
                      title="Edit device"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => onDeleteDevice(d.id)}
                      title="Delete device"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      {showForm && (
        <DeviceForm
          parentOptions={devices}
          initialData={editingDevice}
          onClose={() => {
            setShowForm(false);
            setEditingDevice(null);
          }}
          onSubmit={async (data) => {
            if (editingDevice) {
              await onUpdateDevice(editingDevice.id, data);
            } else {
              await onAddDevice(data);
            }
            setShowForm(false);
            setEditingDevice(null);
          }}
        />
      )}
    </>
  );
}

// ─── Alerts Page ──────────────────────────────────────────────
function AlertsPage({ alerts, onAcknowledge }) {
  return (
    <>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
        🔔 Alert History
      </h2>
      <AlertPanel alerts={alerts} onAcknowledge={onAcknowledge} />
    </>
  );
}

// ─── Settings Page ────────────────────────────────────────────
function SettingsPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
        ⚙️ Settings
      </h2>

      <div className="alert-panel">
        <div className="alert-panel-header">
          <h3>Monitoring Configuration</h3>
        </div>
        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label>Ping Interval (seconds)</label>
            <input className="form-input" type="number" defaultValue={5} min={1} max={60} />
          </div>
          <div className="form-group">
            <label>Ping Timeout (seconds)</label>
            <input className="form-input" type="number" defaultValue={2} min={1} max={10} />
          </div>
          <div className="form-group">
            <label>Warning Latency Threshold (ms)</label>
            <input className="form-input" type="number" defaultValue={100} min={10} max={1000} />
          </div>
          <div className="form-group">
            <label>SNMP Community String</label>
            <input className="form-input" type="text" defaultValue="public" />
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);

  // Handle WebSocket messages
  const handleWsMessage = useCallback((message) => {
    if (message.type === 'bulk_update') {
      setDevices((prev) => {
        return prev.map((device) => {
          const update = message.data.find((u) => u.device_id === device.id);
          if (update) {
            return {
              ...device,
              status: update.status,
              latency_ms: update.latency_ms,
              tx_rate: update.tx_rate,
              rx_rate: update.rx_rate,
            };
          }
          return device;
        });
      });

      // Update stats from bulk data
      const data = message.data;
      setStats((prev) => ({
        ...prev,
        total_devices: data.length,
        online: data.filter((d) => d.status === 'online').length,
        offline: data.filter((d) => d.status === 'offline').length,
        warning: data.filter((d) => d.status === 'warning').length,
        unreachable: data.filter((d) => d.status === 'unreachable').length,
        avg_latency: Math.round(
          data.filter((d) => d.latency_ms).reduce((sum, d) => sum + d.latency_ms, 0) /
            (data.filter((d) => d.latency_ms).length || 1)
        ),
      }));
    }

    if (message.type === 'new_alert') {
      setAlerts((prev) => [message.data, ...prev]);
      setStats((prev) => ({
        ...prev,
        active_alerts: (prev.active_alerts || 0) + 1,
      }));
    }
  }, []);

  const { isConnected } = useWebSocket(handleWsMessage);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const [devicesData, statsData, alertsData] = await Promise.all([
          fetchDevices(),
          fetchStats(),
          fetchAlerts(),
        ]);
        setDevices(devicesData);
        setStats(statsData);
        setAlerts(alertsData);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadData();
  }, []);

  // Event handlers
  const handleAcknowledge = async (alertId) => {
    try {
      await ackAlertApi(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
      setStats((prev) => ({
        ...prev,
        active_alerts: Math.max(0, (prev.active_alerts || 0) - 1),
      }));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleAddDevice = async (data) => {
    try {
      await createDevice(data);
      const devicesData = await fetchDevices();
      setDevices(devicesData);
    } catch (err) {
      console.error('Failed to add device:', err);
    }
  };

  const handleUpdateDevice = async (id, data) => {
    try {
      await updateDevice(id, data);
      const devicesData = await fetchDevices();
      setDevices(devicesData);
    } catch (err) {
      console.error('Failed to update device:', err);
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      await deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete device:', err);
    }
  };

  const activeAlertCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar alertCount={activeAlertCount} />
        <PageWrapper isConnected={isConnected}>
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  stats={stats}
                  alerts={alerts}
                  devices={devices}
                  onAcknowledge={handleAcknowledge}
                />
              }
            />
            <Route
              path="/topology"
              element={
                <TopologyPage
                  devices={devices}
                  onAddDevice={handleAddDevice}
                />
              }
            />
            <Route
              path="/devices"
              element={
                <DevicesPage
                  devices={devices}
                  onAddDevice={handleAddDevice}
                  onUpdateDevice={handleUpdateDevice}
                  onDeleteDevice={handleDeleteDevice}
                />
              }
            />
            <Route
              path="/alerts"
              element={
                <AlertsPage
                  alerts={alerts}
                  onAcknowledge={handleAcknowledge}
                />
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </PageWrapper>
      </div>
    </BrowserRouter>
  );
}
