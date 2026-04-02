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
  ExternalLink,
  Info,
} from "lucide-react";

type FlowNodeData = Node["data"] & {
  label?: string;
  text?: string;
  imageUrl?: string | null;
  quickReplies?: { id: string; label: string }[];
  isStart?: boolean;
  variant?: "message" | "choice" | "input" | "confirmation" | "link" | "info";
  inputMode?: "buttons" | "free_text";
  collects?: string;
};

// Node styles — left border color is the primary type indicator per the design plan.
const nodeStyles = {
  start: {
    borderColor: '#1E4FD8',
    headerBg: 'rgba(30, 79, 216, 0.045)',
    chipBg: 'bg-[#DBEAFE]',
    chipText: 'text-[#1D4ED8]',
    icon: Flag,
    iconWrap: 'bg-[#EFF6FF] text-[#1E4FD8]',
    label: 'Start',
  },
  message: {
    borderColor: '#0EA5E9',
    headerBg: 'rgba(14, 165, 233, 0.045)',
    chipBg: 'bg-[#E0F2FE]',
    chipText: 'text-[#0369A1]',
    icon: MessageSquare,
    iconWrap: 'bg-[#F0F9FF] text-[#0EA5E9]',
    label: 'Nachricht',
  },
  input: {
    borderColor: '#8B5CF6',
    headerBg: 'rgba(139, 92, 246, 0.045)',
    chipBg: 'bg-[#EDE9FE]',
    chipText: 'text-[#6D28D9]',
    icon: Keyboard,
    iconWrap: 'bg-[#F5F3FF] text-[#8B5CF6]',
    label: 'Eingabe',
  },
  choice: {
    borderColor: '#F59E0B',
    headerBg: 'rgba(245, 158, 11, 0.045)',
    chipBg: 'bg-[#FEF3C7]',
    chipText: 'text-[#B45309]',
    icon: GitBranch,
    iconWrap: 'bg-[#FFFBEB] text-[#F59E0B]',
    label: 'Auswahl',
  },
  confirmation: {
    borderColor: '#10B981',
    headerBg: 'rgba(16, 185, 129, 0.045)',
    chipBg: 'bg-[#D1FAE5]',
    chipText: 'text-[#047857]',
    icon: CheckCircle,
    iconWrap: 'bg-[#ECFDF5] text-[#10B981]',
    label: 'Bestätigung',
  },
  link: {
    borderColor: '#0EA5E9',
    headerBg: 'rgba(14, 165, 233, 0.045)',
    chipBg: 'bg-[#E0F2FE]',
    chipText: 'text-[#0369A1]',
    icon: ExternalLink,
    iconWrap: 'bg-[#F0F9FF] text-[#0EA5E9]',
    label: 'Link',
  },
  info: {
    borderColor: '#94A3B8',
    headerBg: 'rgba(148, 163, 184, 0.045)',
    chipBg: 'bg-[#E2E8F0]',
    chipText: 'text-[#475569]',
    icon: Info,
    iconWrap: 'bg-[#F8FAFC] text-[#64748B]',
    label: 'Info',
  },
};

// Determine node type for styling
function getNodeType(data: FlowNodeData): keyof typeof nodeStyles {
  if (data.isStart) return 'start';
  if (data.inputMode === 'free_text') return 'input';
  if (data.variant === 'choice') return 'choice';
  if (data.variant === 'confirmation') return 'confirmation';
  if (data.variant === 'link') return 'link';
  if (data.variant === 'info') return 'info';
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
      className={[
        'flow-node w-[220px] overflow-hidden rounded-md border border-[#E2E8F0] bg-white',
        'transition-all duration-200 ease-out',
        selected
          ? 'ring-2 ring-[#1E4FD8] ring-offset-1 -translate-y-px'
          : 'shadow-sm hover:-translate-y-px hover:shadow-md hover:border-[#C7D7F0]',
      ].join(' ')}
      style={{
        borderLeftColor: style.borderColor,
        borderLeftWidth: 3,
        ...(selected && {
          boxShadow: `0 0 0 2px ${style.borderColor}30, 0 6px 20px ${style.borderColor}18`,
        }),
      }}
    >
      <div
        className="border-b border-[#E2E8F0] px-4 py-3"
        style={{ backgroundColor: style.headerBg }}
      >
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.iconWrap}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
              {nodeLabel}{collectsLabel}
            </p>
            <p className="text-sm font-semibold text-[#0F172A] truncate">
              {data.label || "Ohne Name"}
            </p>
          </div>
          {data.inputMode === "free_text" && (
            <span className="rounded-full bg-[#E2E8F0] px-2 py-0.5 text-[10px] font-bold text-[#475569]">
              Freitext
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {data.imageUrl && (
          <div className="mb-3 overflow-hidden rounded-xl border border-[#E2E8F0]">
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

        <p className="text-sm leading-relaxed text-[#334155] line-clamp-3">
          {data.text || "Keine Nachricht"}
        </p>

        {quickReplies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {quickReplies.slice(0, 4).map((reply) => (
              <span
                key={reply.id}
                className="quick-reply-pill inline-flex items-center rounded-full border border-[#DBEAFE] bg-[#F8FBFF] px-2.5 py-1 text-xs font-medium text-[#1D4ED8]"
              >
                {reply.label || "Button"}
              </span>
            ))}
            {quickReplies.length > 4 && (
              <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2 py-1 text-xs font-medium text-[#64748B]">
                +{quickReplies.length - 4}
              </span>
            )}
          </div>
        )}

        {data.inputMode === "free_text" && !quickReplies.length && (
          <div className="mt-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2">
            <p className="text-xs font-medium text-[#64748B]">
              {data.placeholder || "Antwort wird erwartet…"}
            </p>
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#CBD5E1] hover:!bg-[#1E4FD8] transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#CBD5E1] hover:!bg-[#1E4FD8] transition-colors"
      />

      {data.imageUrl && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full border border-[#E2E8F0] bg-white/95 p-1.5 text-[#64748B] shadow-sm">
          <ImageIcon className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export default memo(FlowNode);
