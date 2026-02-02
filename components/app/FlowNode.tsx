'use client';

import Image from "next/image";
import { memo } from "react";
import type { Node, NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import {
  Flag,
  MessageSquare,
  Keyboard,
  CheckCircle,
  GitBranch,
  Image as ImageIcon,
} from "lucide-react";

type FlowNodeData = Node["data"] & {
  text?: string;
  imageUrl?: string | null;
  quickReplies?: { id: string; label: string }[];
  isStart?: boolean;
  variant?: "message" | "choice" | "input" | "confirmation";
  inputMode?: "buttons" | "free_text";
  collects?: string;
};

// Node style configurations with gradients and colors
const nodeStyles = {
  start: {
    headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    headerText: 'text-white',
    icon: Flag,
    ring: 'ring-emerald-500/30',
    label: 'Start',
  },
  message: {
    headerBg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    headerText: 'text-white',
    icon: MessageSquare,
    ring: 'ring-indigo-500/30',
    label: 'Nachricht',
  },
  input: {
    headerBg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    headerText: 'text-white',
    icon: Keyboard,
    ring: 'ring-amber-500/30',
    label: 'Eingabe',
  },
  choice: {
    headerBg: 'bg-gradient-to-r from-violet-500 to-purple-600',
    headerText: 'text-white',
    icon: GitBranch,
    ring: 'ring-violet-500/30',
    label: 'Auswahl',
  },
  confirmation: {
    headerBg: 'bg-gradient-to-r from-pink-500 to-rose-500',
    headerText: 'text-white',
    icon: CheckCircle,
    ring: 'ring-pink-500/30',
    label: 'Bestätigung',
  },
};

// Determine node type for styling
function getNodeType(data: FlowNodeData): keyof typeof nodeStyles {
  if (data.isStart) return 'start';
  if (data.inputMode === 'free_text') return 'input';
  if (data.variant === 'choice') return 'choice';
  if (data.variant === 'confirmation') return 'confirmation';
  return 'message';
}

function FlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const quickReplies: { id: string; label: string }[] = data.quickReplies ?? [];
  const nodeType = getNodeType(data);
  const style = nodeStyles[nodeType];
  const Icon = style.icon;

  // Determine what to show as the node label
  const nodeLabel = data.isStart ? 'Start' : style.label;
  const collectsLabel = data.collects ? ` · ${data.collects}` : '';

  return (
    <div
      className={`
        flow-node w-64 overflow-hidden rounded-2xl bg-white
        transition-all duration-200 ease-out
        ${selected
          ? `ring-2 ${style.ring} shadow-node-selected -translate-y-1`
          : 'shadow-node hover:shadow-node-hover hover:-translate-y-0.5'
        }
      `}
    >
      {/* Colored Header */}
      <div className={`${style.headerBg} px-4 py-3`}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <Icon className={`h-4 w-4 ${style.headerText}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wider ${style.headerText} opacity-80`}>
              {nodeLabel}{collectsLabel}
            </p>
            <p className={`text-sm font-semibold ${style.headerText} truncate`}>
              {data.text?.slice(0, 30) || "Neue Nachricht"}
              {(data.text?.length ?? 0) > 30 ? "…" : ""}
            </p>
          </div>
          {data.inputMode === "free_text" && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
              Freitext
            </span>
          )}
        </div>
      </div>

      {/* White Body */}
      <div className="p-4">
        {/* Image Preview */}
        {data.imageUrl && (
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-100">
            <div className="relative h-24 w-full">
              <Image
                src={data.imageUrl}
                alt="Node visual"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Message Text */}
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {data.text || "Keine Nachricht"}
        </p>

        {/* Quick Reply Pills */}
        {quickReplies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {quickReplies.slice(0, 4).map((reply) => (
              <span
                key={reply.id}
                className="quick-reply-pill inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/50"
              >
                {reply.label || "Button"}
              </span>
            ))}
            {quickReplies.length > 4 && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-400">
                +{quickReplies.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Free Text Indicator */}
        {data.inputMode === "free_text" && !quickReplies.length && (
          <div className="mt-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2">
            <p className="text-xs text-amber-700 font-medium">
              {data.placeholder || "Antwort wird erwartet…"}
            </p>
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white hover:!bg-indigo-500 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white hover:!bg-indigo-500 transition-colors"
      />

      {/* Image Indicator Badge */}
      {data.imageUrl && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm">
          <ImageIcon className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export default memo(FlowNode);
