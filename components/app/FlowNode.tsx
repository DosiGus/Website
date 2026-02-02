'use client';

import Image from "next/image";
import { memo } from "react";
import type { Node, NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import { MessageCircle, Image as ImageIcon } from "lucide-react";

type FlowNodeData = Node["data"] & {
  text?: string;
  imageUrl?: string | null;
  quickReplies?: { id: string; label: string }[];
  isStart?: boolean;
};

function FlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const quickReplies: { id: string; label: string }[] = data.quickReplies ?? [];
  return (
    <div
      className={`w-64 rounded-3xl border bg-white p-4 shadow-sm transition ring-2 ${
        selected ? "border-brand ring-brand/30" : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {data.isStart ? "Start" : "Nachricht"}
          </p>
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">
            {data.text || "Neue Nachricht"}
          </p>
        </div>
        {data.inputMode === "free_text" ? (
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            Freitext
          </span>
        ) : null}
      </div>
      {data.imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
          <div className="relative h-28 w-full">
            <Image
              src={data.imageUrl}
              alt="Node visual"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      ) : null}
      <p className="mt-3 text-sm text-slate-600 line-clamp-3">{data.text}</p>
      {quickReplies.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <span
              key={reply.id}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {reply.label || "Button"}
            </span>
          ))}
        </div>
      ) : null}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      {data.imageUrl ? (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/80 p-1 text-slate-400 shadow">
          <ImageIcon className="h-3 w-3" />
        </div>
      ) : null}
    </div>
  );
}

export default memo(FlowNode);
