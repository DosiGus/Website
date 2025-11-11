'use client';

import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  EdgeChange,
  MarkerType,
  Node,
  NodeChange,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

type FlowBuilderCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: NodeMouseHandler | null;
};

export default function FlowBuilderCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}: FlowBuilderCanvasProps) {
  return (
    <div className="h-[640px] rounded-3xl border border-slate-200 bg-white shadow-inner shadow-slate-200/70">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick ?? undefined}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
      >
        <MiniMap pannable zoomable />
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
