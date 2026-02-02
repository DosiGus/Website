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

// Custom edge styles based on tone
const getEdgeStyle = (edge: Edge) => {
  const tone = (edge.data as any)?.tone ?? 'neutral';

  switch (tone) {
    case 'positive':
      return {
        stroke: '#10B981',
        strokeWidth: 2.5,
      };
    case 'negative':
      return {
        stroke: '#F87171',
        strokeWidth: 2.5,
      };
    default:
      return {
        stroke: '#94a3b8',
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
    <div className="relative h-[calc(100vh-200px)] min-h-[500px] overflow-hidden rounded-2xl canvas-gradient border border-slate-200/50">
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
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
        className="bg-transparent"
      >
        {/* Dot Grid Background */}
        <Background
          gap={20}
          size={1.5}
          color="#cbd5e1"
          variant={BackgroundVariant.Dots}
        />

        {/* MiniMap with updated styling */}
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          nodeColor={(node) => {
            if (node.data?.isStart) return '#10B981';
            if (node.data?.inputMode === 'free_text') return '#F59E0B';
            if (node.data?.variant === 'choice') return '#8B5CF6';
            return '#6366F1';
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
        />

        {/* Controls with updated styling */}
        <Controls
          position="bottom-left"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '4px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          showInteractive={false}
        />
      </ReactFlow>

      {/* Zoom to Fit Button */}
      <div className="pointer-events-none absolute right-4 top-4 flex gap-2">
        <button
          type="button"
          className="pointer-events-auto btn-press rounded-full border border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-primary hover:text-primary transition-colors"
          onClick={onFitView}
        >
          Zoom to Fit
        </button>
      </div>
    </div>
  );
}

export default memo(Canvas);
