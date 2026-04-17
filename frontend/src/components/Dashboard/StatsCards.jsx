import {
  MonitorSmartphone,
  Wifi,
  WifiOff,
  AlertTriangle,
  Gauge,
  Bell,
} from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Devices',
      value: stats.total_devices || 0,
      icon: MonitorSmartphone,
      accent: 'var(--accent-primary)',
      bg: 'var(--accent-primary-glow)',
      sub: 'Monitored devices',
    },
    {
      label: 'Online',
      value: stats.online || 0,
      icon: Wifi,
      accent: 'var(--status-online)',
      bg: 'var(--status-online-bg)',
      sub: `${stats.total_devices ? Math.round(((stats.online || 0) / stats.total_devices) * 100) : 0}% uptime`,
    },
    {
      label: 'Offline',
      value: stats.offline || 0,
      icon: WifiOff,
      accent: 'var(--status-offline)',
      bg: 'var(--status-offline-bg)',
      sub: 'Requires attention',
    },
    {
      label: 'Warning',
      value: stats.warning || 0,
      icon: AlertTriangle,
      accent: 'var(--status-warning)',
      bg: 'var(--status-warning-bg)',
      sub: 'High latency',
    },
    {
      label: 'Avg Latency',
      value: `${stats.avg_latency || 0}`,
      icon: Gauge,
      accent: 'var(--accent-secondary)',
      bg: 'rgba(139, 92, 246, 0.15)',
      sub: 'milliseconds',
    },
    {
      label: 'Active Alerts',
      value: stats.active_alerts || 0,
      icon: Bell,
      accent: stats.active_alerts > 0 ? 'var(--status-offline)' : 'var(--text-tertiary)',
      bg: stats.active_alerts > 0 ? 'var(--status-offline-bg)' : 'rgba(107, 114, 128, 0.1)',
      sub: 'Unacknowledged',
    },
  ];

  return (
    <div className="stats-grid" id="stats-grid">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="stat-card fade-in-up"
            style={{
              '--stat-accent': card.accent,
              '--stat-bg': card.bg,
              animationDelay: `${i * 50}ms`,
            }}
            id={`stat-${card.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <div className="stat-card-header">
              <span className="stat-card-label">{card.label}</span>
              <div className="stat-card-icon">
                <Icon size={18} />
              </div>
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-sub">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
