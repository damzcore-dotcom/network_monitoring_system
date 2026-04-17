import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from './DeviceNode';
import ConnectionEdge from './ConnectionEdge';
import { STATUS_COLORS, DEVICE_ICONS } from '../../utils/constants';
import { updatePositions } from '../../services/api';

const nodeTypes = { deviceNode: DeviceNode };
const edgeTypes = { connectionEdge: ConnectionEdge };

export default function NetworkMap({ devices, onNodeClick }) {
  // Convert devices to React Flow nodes
  const initialNodes = useMemo(() => {
    return (devices || []).map((device) => ({
      id: String(device.id),
      type: 'deviceNode',
      position: { x: device.pos_x || 0, y: device.pos_y || 0 },
      data: {
        ...device,
        icon: DEVICE_ICONS[device.type] || '❓',
        onClick: () => onNodeClick?.(device),
      },
    }));
  }, [devices, onNodeClick]);

  // Convert parent-child relationships to edges
  const initialEdges = useMemo(() => {
    return (devices || [])
      .filter((d) => d.parent_id)
      .map((device) => {
        const parentDevice = devices.find((d) => d.id === device.parent_id);
        const isDown = device.status === 'offline' || device.status === 'unreachable';
        const parentDown = parentDevice?.status === 'offline' || parentDevice?.status === 'unreachable';

        return {
          id: `e${device.parent_id}-${device.id}`,
          source: String(device.parent_id),
          target: String(device.id),
          type: 'connectionEdge',
          data: {
            status: isDown || parentDown ? 'offline' : device.status,
            txRate: device.tx_rate,
            rxRate: device.rx_rate,
          },
          animated: device.status === 'online',
        };
      });
  }, [devices]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when devices change (real-time updates)
  useMemo(() => {
    setNodes((prevNodes) => {
      if (prevNodes.length === 0) return initialNodes;
      return prevNodes.map((node) => {
        const device = devices?.find((d) => String(d.id) === node.id);
        if (device) {
          return {
            ...node,
            data: {
              ...device,
              icon: DEVICE_ICONS[device.type] || '❓',
              onClick: () => onNodeClick?.(device),
            },
          };
        }
        return node;
      });
    });
    setEdges(initialEdges);
  }, [devices]);

  // Save position when node is dragged
  const onNodeDragStop = useCallback(async (event, node) => {
    try {
      await updatePositions([
        {
          id: parseInt(node.id),
          pos_x: node.position.x,
          pos_y: node.position.y,
        },
      ]);
    } catch (err) {
      console.error('Failed to save position:', err);
    }
  }, []);

  return (
    <div className="react-flow-wrapper" id="network-map">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'connectionEdge',
        }}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls position="bottom-left" />
        <MiniMap
          nodeStrokeColor={(n) => {
            const device = devices?.find((d) => String(d.id) === n.id);
            return STATUS_COLORS[device?.status] || '#6b7280';
          }}
          nodeColor={(n) => {
            const device = devices?.find((d) => String(d.id) === n.id);
            return STATUS_COLORS[device?.status] || '#6b7280';
          }}
          maskColor="rgba(6, 8, 15, 0.8)"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}
