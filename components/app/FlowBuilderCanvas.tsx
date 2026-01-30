'use client';

import { memo, useMemo } from "react";
import ReactFlow, {
  Background,
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

  return (
    <div className="relative h-[640px] rounded-3xl border border-slate-200 bg-white shadow-inner shadow-slate-200/70">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
        snapGrid={[24, 24]}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
      >
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
          nodeColor={(node) => node.data?.isStart ? '#3769FF' : '#94a3b8'}
          maskColor="rgba(0, 0, 0, 0.08)"
        />
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          showInteractive={false}
        />
        <Background gap={24} size={1} />
      </ReactFlow>
      <div className="pointer-events-none absolute right-4 top-4 flex gap-2">
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:border-brand"
          onClick={onFitView}
        >
          Zoom to Fit
        </button>
      </div>
    </div>
  );
}

export default memo(Canvas);
