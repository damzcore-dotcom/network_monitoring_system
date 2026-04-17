import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { fetchDeviceHistory } from '../../services/api';
import { formatRate } from '../../utils/helpers';

export default function TrafficChart({ deviceId, deviceName }) {
  const [data, setData] = useState([]);
  const [hours, setHours] = useState(1);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const history = await fetchDeviceHistory(deviceId, hours);
        if (!cancelled) {
          setData(
            history.map((h) => ({
              time: new Date(h.checked_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              tx: h.tx_rate || 0,
              rx: h.rx_rate || 0,
              latency: h.latency_ms || 0,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };

    loadData();
    const timer = setInterval(loadData, 10000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [deviceId, hours]);

  if (!deviceId) {
    return (
      <div className="chart-container" id="traffic-chart">
        <div className="chart-header">
          <h3>📊 Traffic Monitor</h3>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Select a device to view traffic
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          fontSize: '12px',
        }}
      >
        <div style={{ color: '#10b981', marginBottom: '4px' }}>
          ↑ TX: {formatRate(payload[0]?.value || 0)}
        </div>
        <div style={{ color: '#3b82f6' }}>
          ↓ RX: {formatRate(payload[1]?.value || 0)}
        </div>
      </div>
    );
  };

  return (
    <div className="chart-container" id="traffic-chart">
      <div className="chart-header">
        <h3>📊 {deviceName || 'Traffic'}</h3>
        <div className="chart-time-selector">
          {[1, 6, 24].map((h) => (
            <button
              key={h}
              className={`chart-time-btn ${hours === h ? 'active' : ''}`}
              onClick={() => setHours(h)}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,0.5)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#6e7681', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(48,54,61,0.5)' }}
          />
          <YAxis
            tick={{ fill: '#6e7681', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(48,54,61,0.5)' }}
            tickFormatter={(v) => formatRate(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="tx"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#txGradient)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="rx"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#rxGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
