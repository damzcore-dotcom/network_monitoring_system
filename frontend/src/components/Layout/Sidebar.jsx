import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  MonitorSmartphone,
  Bell,
  Settings,
  Activity,
} from 'lucide-react';

export default function Sidebar({ alertCount = 0 }) {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">N</div>
        <div className="sidebar-title">
          <h1>NetWatch</h1>
          <span>Network Monitor v1.0</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Monitoring</span>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          id="nav-dashboard"
        >
          <LayoutDashboard className="nav-icon" />
          Dashboard
        </NavLink>

        <NavLink
          to="/topology"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          id="nav-topology"
        >
          <Network className="nav-icon" />
          Network Map
        </NavLink>

        <NavLink
          to="/devices"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          id="nav-devices"
        >
          <MonitorSmartphone className="nav-icon" />
          Devices
        </NavLink>

        <span className="nav-section-label">System</span>

        <NavLink
          to="/alerts"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          id="nav-alerts"
        >
          <Bell className="nav-icon" />
          Alerts
          {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          id="nav-settings"
        >
          <Settings className="nav-icon" />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <Activity size={14} style={{ color: 'var(--status-online)' }} />
        <div className="sidebar-status-dot" />
        <span>System Active</span>
      </div>
    </aside>
  );
}
