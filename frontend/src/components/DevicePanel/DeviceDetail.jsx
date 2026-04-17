import { X } from 'lucide-react';
import { DEVICE_ICONS, DEVICE_TYPE_LABELS, STATUS_COLORS } from '../../utils/constants';
import { formatRate, getLatencyClass } from '../../utils/helpers';
import TrafficChart from '../Dashboard/TrafficChart';

export default function DeviceDetail({ device, onClose }) {
  if (!device) return null;

  const status = device.status || 'offline';
  const statusColor = STATUS_COLORS[status];

  return (
    <div className="detail-overlay" id="device-detail-panel">
      <div className="detail-header">
        <h3>
          {DEVICE_ICONS[device.type]} {device.name}
        </h3>
        <button className="detail-close" onClick={onClose} id="close-detail">
          <X size={16} />
        </button>
      </div>

      <div className="detail-body">
        {/* Status Card */}
        <div
          className="detail-status-card"
          style={{
            background: `${statusColor}10`,
            borderColor: `${statusColor}40`,
          }}
        >
          <div className="detail-status-icon">
            <span style={{ fontSize: '28px' }}>{DEVICE_ICONS[device.type]}</span>
          </div>
          <div
            className="detail-status-label"
            style={{ color: statusColor }}
          >
            {status.toUpperCase()}
          </div>
          {device.latency_ms != null && status !== 'offline' && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                marginTop: '4px',
                color: 'var(--text-secondary)',
              }}
            >
              {device.latency_ms}ms latency
            </div>
          )}
        </div>

        {/* Device Info */}
        <div>
          <div className="detail-section-title">Device Information</div>
          <div className="detail-info-grid" style={{ marginTop: '8px' }}>
            <div className="detail-info-row">
              <span className="detail-info-label">Type</span>
              <span className="detail-info-value">
                {DEVICE_TYPE_LABELS[device.type] || device.type}
              </span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">IP Address</span>
              <span
                className="detail-info-value"
                style={{ color: 'var(--accent-primary-hover)' }}
              >
                {device.ip_address}
              </span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">Location</span>
              <span className="detail-info-value">
                {device.location || '—'}
              </span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">Floor</span>
              <span className="detail-info-value">{device.floor || '—'}</span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">SNMP Community</span>
              <span className="detail-info-value">
                {device.snmp_community || 'public'}
              </span>
            </div>
          </div>
        </div>

        {/* Traffic */}
        {status === 'online' && (
          <div>
            <div className="detail-section-title">Current Traffic</div>
            <div className="detail-info-grid" style={{ marginTop: '8px' }}>
              <div className="detail-info-row">
                <span className="detail-info-label">↑ TX Rate</span>
                <span
                  className="detail-info-value"
                  style={{ color: 'var(--status-online)' }}
                >
                  {formatRate(device.tx_rate)}
                </span>
              </div>
              <div className="detail-info-row">
                <span className="detail-info-label">↓ RX Rate</span>
                <span
                  className="detail-info-value"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {formatRate(device.rx_rate)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Traffic Chart */}
        <TrafficChart deviceId={device.id} deviceName={device.name} />
      </div>
    </div>
  );
}
