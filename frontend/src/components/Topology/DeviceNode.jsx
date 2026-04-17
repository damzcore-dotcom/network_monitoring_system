import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getLatencyClass } from '../../utils/helpers';

const DeviceNode = memo(({ data }) => {
  const status = data.status || 'offline';
  const latencyClass = getLatencyClass(data.latency_ms);

  return (
    <div
      className={`device-node status-${status}`}
      onClick={() => data.onClick?.()}
      id={`device-node-${data.id}`}
    >
      <Handle type="target" position={Position.Top} />

      <div className={`device-node-status-dot ${status}`} />

      <div className="device-node-icon">
        <span>{data.icon}</span>
      </div>

      <div className="device-node-name" title={data.name}>
        {data.name}
      </div>

      <div className="device-node-ip">{data.ip_address}</div>

      {status === 'online' || status === 'warning' ? (
        <div className={`device-node-latency ${latencyClass}`}>
          {data.latency_ms != null ? `${data.latency_ms}ms` : '—'}
        </div>
      ) : (
        <div className="device-node-latency bad">
          {status === 'unreachable' ? 'UNREACHABLE' : 'DOWN'}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

DeviceNode.displayName = 'DeviceNode';

export default DeviceNode;
