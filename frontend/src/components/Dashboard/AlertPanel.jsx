import { Bell, Check } from 'lucide-react';
import { ALERT_TYPE_ICONS } from '../../utils/constants';
import { timeAgo, formatTime } from '../../utils/helpers';

export default function AlertPanel({ alerts, onAcknowledge }) {
  return (
    <div className="alert-panel" id="alert-panel">
      <div className="alert-panel-header">
        <h3>
          <Bell size={16} />
          Live Alerts
        </h3>
        <span className="text-muted" style={{ fontSize: '12px' }}>
          {alerts.filter((a) => !a.acknowledged).length} active
        </span>
      </div>

      <div className="alert-panel-body">
        {alerts.length === 0 ? (
          <div className="alert-empty">
            <Bell size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <div>No alerts yet</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Alerts will appear here when device status changes
            </div>
          </div>
        ) : (
          alerts.slice(0, 30).map((alert) => (
            <div
              key={alert.id}
              className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''}`}
              id={`alert-${alert.id}`}
            >
              <div className={`alert-icon ${alert.alert_type}`}>
                {ALERT_TYPE_ICONS[alert.alert_type] || '⚪'}
              </div>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  {formatTime(alert.created_at)} · {timeAgo(alert.created_at)}
                </div>
              </div>
              {!alert.acknowledged && (
                <button
                  className="alert-ack-btn"
                  onClick={() => onAcknowledge?.(alert.id)}
                  title="Acknowledge"
                >
                  <Check size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
