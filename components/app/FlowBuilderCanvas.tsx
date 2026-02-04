'use client';

import { memo, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  EdgeMouseHandler,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  OnSelectionChangeFunc,
  NodeMouseHandler,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import FlowNode from "./FlowNode";

type FlowBuilderCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: NodeMouseHandler | null;
  onNodeDoubleClick?: NodeMouseHandler | null;
  onEdgeClick?: EdgeMouseHandler | null;
  onSelectionChange?: OnSelectionChangeFunc | null;
  onInit?: (instance: ReactFlowInstance) => void;
  onFitView?: () => void;
};

// Custom edge styles based on tone - updated for dark theme
const getEdgeStyle = (edge: Edge) => {
  const tone = (edge.data as any)?.tone ?? 'neutral';

  switch (tone) {
    case 'positive':
      return {
        stroke: '#34D399',
        strokeWidth: 2.5,
      };
    case 'negative':
      return {
        stroke: '#F87171',
        strokeWidth: 2.5,
      };
    default:
      return {
        stroke: '#52525b',
        strokeWidth: 2,
      };
  }
};

function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  onSelectionChange,
  onInit,
  onFitView,
}: FlowBuilderCanvasProps) {
  const nodeTypes = useMemo(() => ({ wesponde: FlowNode }), []);

  // Apply custom edge styles
  const styledEdges = useMemo(() =>
    edges.map(edge => ({
      ...edge,
      style: getEdgeStyle(edge),
      animated: edge.selected,
    })),
    [edges]
  );

  return (
    <div className="relative h-[calc(100vh-200px)] min-h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50 backdrop-blur-sm">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick ?? undefined}
        onNodeDoubleClick={onNodeDoubleClick ?? undefined}
        onEdgeClick={onEdgeClick ?? undefined}
        onSelectionChange={onSelectionChange ?? undefined}
        onInit={onInit}
        fitView
        nodeTypes={nodeTypes}
        nodesDraggable
        nodesConnectable
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        multiSelectionKeyCode="Meta"
        selectionKeyCode="Shift"
        snapToGrid
        snapGrid={[20, 20]}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
          style: { stroke: '#52525b', strokeWidth: 2 },
        }}
        className="bg-transparent"
      >
        {/* Dot Grid Background - Dark Theme */}
        <Background
          gap={20}
          size={1}
          color="#3f3f46"
          variant={BackgroundVariant.Dots}
        />

        {/* MiniMap with dark styling */}
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          nodeColor={(node) => {
            if (node.data?.isStart) return '#10B981';
            if (node.data?.inputMode === 'free_text') return '#F59E0B';
            if (node.data?.variant === 'choice') return '#8B5CF6';
            return '#6366F1';
          }}
          maskColor="rgba(0, 0, 0, 0.3)"
        />

        {/* Controls with dark styling */}
        <Controls
          position="bottom-left"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '4px',
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          showInteractive={false}
        />
      </ReactFlow>

      {/* Zoom to Fit Button */}
      <div className="pointer-events-none absolute right-4 top-4 flex gap-2">
        <button
          type="button"
          className="pointer-events-auto rounded-xl border border-white/10 bg-zinc-900/90 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-zinc-300 shadow-lg hover:border-indigo-500/50 hover:text-white transition-colors"
          onClick={onFitView}
        >
          Zoom to Fit
        </button>
      </div>
    </div>
  );
}

export default memo(Canvas);
