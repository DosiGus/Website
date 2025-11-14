'use client';

import { memo } from "react";
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
        <MiniMap pannable zoomable />
        <Controls position="top-left" />
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
