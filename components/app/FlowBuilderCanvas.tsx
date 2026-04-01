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

// App-light edge styles for the new builder surface.
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
        stroke: '#EF4444',
        strokeWidth: 2.5,
      };
    default:
      return {
        stroke: '#94A3B8',
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

  const styledEdges = useMemo(() =>
    edges.map(edge => ({
      ...edge,
      style: getEdgeStyle(edge),
      animated: edge.selected,
    })),
    [edges]
  );

  return (
    <div className="relative h-[calc(100vh-220px)] min-h-[560px] overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
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
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
          style: { stroke: '#94A3B8', strokeWidth: 2 },
        }}
        className="bg-transparent"
      >
        <Background
          gap={20}
          size={1}
          color="#D1D9E6"
          variant={BackgroundVariant.Dots}
        />

        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 14px 28px rgba(15, 23, 42, 0.12)',
          }}
          nodeColor={(node) => {
            if (node.data?.isStart) return '#10B981';
            if (node.data?.inputMode === 'free_text') return '#F59E0B';
            if (node.data?.variant === 'choice') return '#7C3AED';
            return '#2563EB';
          }}
          maskColor="rgba(148, 163, 184, 0.18)"
        />

        <Controls
          position="bottom-left"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
          }}
          showInteractive={false}
        />
      </ReactFlow>

      <div className="pointer-events-none absolute right-4 top-4 flex gap-2">
        <button
          type="button"
          className="pointer-events-auto rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC]"
          onClick={onFitView}
        >
          Ansicht zentrieren
        </button>
      </div>
    </div>
  );
}

export default memo(Canvas);
