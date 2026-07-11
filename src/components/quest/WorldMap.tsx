import { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type WorldMapProps = {
  currentNodeId: string;
  visited: string[];
  available: string[];
  onNodeClick?: (nodeId: string) => void;
};

const ROOT_X = 0;
const ROOT_Y = 0;
const RING_1_RADIUS = 165;
const RING_2_RADIUS = 305;

const nodePalette = {
  current: { bg: '#00E5FF', border: '#7EF5FF', text: '#001018' },
  available: { bg: '#3D8BFF', border: '#8AB6FF', text: '#EAF2FF' },
  visited: { bg: '#2B3242', border: '#4D5B79', text: '#C7D0E0' },
  locked: { bg: '#151922', border: '#313948', text: '#8A94A8' },
};

function polarLayout(radius: number, angleIndex: number, total: number): { x: number; y: number } {
  if (total <= 0) {
    return { x: ROOT_X, y: ROOT_Y };
  }
  const angle = (-Math.PI / 2) + (2 * Math.PI * angleIndex) / total;
  return {
    x: ROOT_X + Math.cos(angle) * radius,
    y: ROOT_Y + Math.sin(angle) * radius,
  };
}

export function WorldMap({ currentNodeId, visited, available, onNodeClick }: WorldMapProps) {
  const [focusedNodeId, setFocusedNodeId] = useState<string>(currentNodeId);

  const availableSet = useMemo(() => new Set(available), [available]);
  const visitedSet = useMemo(() => new Set(visited), [visited]);

  const { nodes, edges } = useMemo(() => {
    const currentId = currentNodeId || 'current';
    const availableIds = [...new Set(available)].sort((a, b) => a.localeCompare(b));
    const visitedIds = [...new Set(visited)]
      .filter((id) => id !== currentId && !availableSet.has(id))
      .sort((a, b) => a.localeCompare(b));

    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    graphNodes.push({
      id: currentId,
      position: { x: ROOT_X, y: ROOT_Y },
      data: { label: currentId },
      style: {
        backgroundColor: nodePalette.current.bg,
        border: `1px solid ${nodePalette.current.border}`,
        color: nodePalette.current.text,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        padding: 4,
      },
    });

    availableIds.forEach((id, index) => {
      const position = polarLayout(RING_1_RADIUS, index, availableIds.length);
      graphNodes.push({
        id,
        position,
        data: { label: id },
        style: {
          backgroundColor: nodePalette.available.bg,
          border: `1px solid ${nodePalette.available.border}`,
          color: nodePalette.available.text,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          padding: 4,
        },
      });
      graphEdges.push({
        id: `edge-${currentId}-${id}`,
        source: currentId,
        target: id,
        animated: true,
        style: { stroke: '#5B8DE1', strokeWidth: 1.5 },
      });
    });

    visitedIds.forEach((id, index) => {
      const position = polarLayout(RING_2_RADIUS, index, visitedIds.length);
      graphNodes.push({
        id,
        position,
        data: { label: id },
        style: {
          backgroundColor: nodePalette.visited.bg,
          border: `1px solid ${nodePalette.visited.border}`,
          color: nodePalette.visited.text,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          padding: 4,
        },
      });
      graphEdges.push({
        id: `edge-visited-${currentId}-${id}`,
        source: currentId,
        target: id,
        style: { stroke: '#3A455E', strokeWidth: 1 },
      });
    });

    return { nodes: graphNodes, edges: graphEdges };
  }, [available, availableSet, currentNodeId, visited]);

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => {
        const isFocused = node.id === focusedNodeId;
        const isCurrent = node.id === currentNodeId;
        const isAvailable = availableSet.has(node.id);
        const isVisited = visitedSet.has(node.id);
        const palette = isCurrent
          ? nodePalette.current
          : isAvailable
            ? nodePalette.available
            : isVisited
              ? nodePalette.visited
              : nodePalette.locked;
        return {
          ...node,
          style: {
            ...(node.style ?? {}),
            backgroundColor: palette.bg,
            border: isFocused ? `2px solid ${palette.border}` : `1px solid ${palette.border}`,
            color: palette.text,
            boxShadow: isFocused ? `0 0 0 2px ${palette.border}55` : 'none',
          },
        };
      }),
    [availableSet, currentNodeId, focusedNodeId, nodes, visitedSet],
  );

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    setFocusedNodeId(node.id);
    onNodeClick?.(node.id);
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 320, background: '#0F131A', borderRadius: 8 }}>
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        fitView
        minZoom={0.4}
        maxZoom={1.7}
        onNodeClick={handleNodeClick}
        defaultEdgeOptions={{ selectable: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1E2533" gap={24} />
        <MiniMap
          pannable
          zoomable
          maskColor="#05070BCC"
          style={{ backgroundColor: '#0D1117', border: '1px solid #2A3344' }}
          nodeColor={(n) => {
            if (n.id === currentNodeId) return nodePalette.current.bg;
            if (availableSet.has(n.id)) return nodePalette.available.bg;
            if (visitedSet.has(n.id)) return nodePalette.visited.bg;
            return nodePalette.locked.bg;
          }}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
