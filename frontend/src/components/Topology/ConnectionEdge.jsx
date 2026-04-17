import { memo } from 'react';
import { BaseEdge, getStraightPath } from '@xyflow/react';
import { STATUS_COLORS } from '../../utils/constants';

const ConnectionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  ...rest
}) => {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const status = data?.status || 'offline';
  const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
  const isActive = status === 'online' || status === 'warning';

  return (
    <>
      {/* Background edge (wider, for glow effect) */}
      <BaseEdge
        id={`${id}-bg`}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isActive ? 4 : 2,
          opacity: 0.15,
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isActive ? 2 : 1.5,
          strokeDasharray: isActive ? 'none' : '8 4',
          opacity: status === 'unreachable' ? 0.3 : 0.8,
        }}
      />
      {/* Animated dot for active connections */}
      {isActive && (
        <circle r="3" fill={color}>
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
});

ConnectionEdge.displayName = 'ConnectionEdge';

export default ConnectionEdge;
