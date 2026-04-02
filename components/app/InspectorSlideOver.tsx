'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Trash2,
  CheckCircle2,
  TriangleAlert,
  ChevronDown,
  Plus,
  ArrowRight,
  MessageSquare,
  Keyboard,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { Node as ReactFlowNode, Edge } from 'reactflow';
import type { FlowQuickReply } from '../../lib/flowTypes';
import type { FlowLintWarning } from '../../lib/flowLint';
import FlowSimulator from './FlowSimulator';
import type { FlowTrigger } from '../../lib/flowTypes';
import useAccountVertical from '../../lib/useAccountVertical';
import { getBookingLabels } from '../../lib/verticals';

export type InspectorTab = 'content' | 'flow';
type InputMode = 'buttons' | 'free_text';

export type InspectorSlideOverProps = {
  isOpen: boolean;
  onClose: () => void;
  inspectorTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  disableBackdropBlur?: boolean;

  // Node editing
  selectedNode: ReactFlowNode | null;
  selectedNodeReplies: FlowQuickReply[];
  selectedInputMode: InputMode;
  onNodeFieldChange: (field: string, value: string) => void;
  onInputModeChange: (mode: InputMode) => void;
  onFreeTextMetaChange: (field: 'placeholder' | 'collects', value: string) => void;
  selectedFreeTextTarget: string | null;
  onFreeTextTargetChange: (nodeId: string, targetId: string | null) => void;

  // Quick replies
  onAddQuickReply: () => void;
  onUpdateQuickReply: (replyId: string, patch: Partial<FlowQuickReply>) => void;
  onRemoveQuickReply: (replyId: string) => void;
  onQuickReplyTargetChange: (replyId: string, targetValue: string, label: string) => void;
  hidePayloadField?: boolean;

  // Edge editing
  selectedEdge: Edge | null;
  onEdgeFieldChange: (field: 'condition' | 'tone', value: string) => void;

  // Actions
  onDeleteSelection: () => void;

  // Snippets and smart prompt
  snippets: { label: string; text: string }[];
  smartPrompt: string;
  onSmartPromptChange: (value: string) => void;
  onSmartPromptSubmit: () => void;
  onSnippetInsert: (text: string) => void;

  // Preview
  nodes: ReactFlowNode[];
  edges: Edge[];
  triggers: FlowTrigger[];
  onNodeSelect: (nodeId: string | null) => void;

  // Lint warnings
  lintWarnings: FlowLintWarning[];
  onFocusWarning: (warning: FlowLintWarning) => void;

  // Output config (flow-level)
  outputType: 'reservation' | 'custom';
  requiredFields: string[];
  onToggleFlowType: (type: 'reservation' | 'custom') => void;
  onToggleRequiredField: (field: string) => void;

  // Save state
  saveState: 'idle' | 'saving' | 'saved' | 'error';
};

const VARIABLE_LABELS: Record<string, string> = {
  name: 'Name',
  date: 'Datum',
  time: 'Uhrzeit',
  guestCount: 'Personenanzahl',
  phone: 'Telefon',
  email: 'E-Mail',
  specialRequests: 'Sonderwünsche',
  reviewRating: 'Bewertung',
  reviewFeedback: 'Feedback',
  googleReviewUrl: 'Google-Link',
};

export default function InspectorSlideOver({
  isOpen,
  onClose,
  inspectorTab,
  onTabChange,
  hasUnsavedChanges,
  onSave,
  disableBackdropBlur = true,
  selectedNode,
  selectedNodeReplies,
  selectedInputMode,
  onNodeFieldChange,
  onInputModeChange,
  onFreeTextMetaChange,
  selectedFreeTextTarget,
  onFreeTextTargetChange,
  onAddQuickReply,
  onUpdateQuickReply,
  onRemoveQuickReply,
  onQuickReplyTargetChange,
  selectedEdge,
  onEdgeFieldChange,
  onDeleteSelection,
  snippets,
  smartPrompt,
  onSmartPromptChange,
  onSmartPromptSubmit,
  nodes,
  edges,
  triggers,
  onNodeSelect,
  lintWarnings,
  onFocusWarning,
  outputType,
  requiredFields,
  onToggleFlowType,
  onToggleRequiredField,
  saveState,
  hidePayloadField = false,
}: InspectorSlideOverProps) {
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);
  const panelRef = useRef<HTMLDivElement>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [smartPromptOpen, setSmartPromptOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as globalThis.Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('.react-flow__node') || target.closest('.react-flow__edge')) return;
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // All variables collected across the flow
  const allCollectedKeys = useMemo(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const node of nodes) {
      const c = (node.data as any)?.collects;
      if (c && typeof c === 'string' && c.trim() && c !== '__custom_empty__') {
        if (!seen.has(c)) { seen.add(c); keys.push(c); }
      }
    }
    return keys;
  }, [nodes]);

  // Placeholders used in current node's text
  const placeholdersInText = useMemo(() => {
    const text = (selectedNode?.data as any)?.text ?? '';
    const matches = [...text.matchAll(/\{\{([^}]+)\}\}/g)];
    return Array.from(new Set(matches.map((m: RegExpMatchArray) => m[1].trim())));
  }, [selectedNode]);

  const nodeCollects = (selectedNode?.data as any)?.collects;
  const hasCollects = nodeCollects && nodeCollects !== '__custom_empty__';

  // Lint warnings relevant to the selected node
  const nodeWarnings = lintWarnings.filter(
    w => !selectedNode || w.nodeId === selectedNode.id || (!w.nodeId && !(w as any).edgeId),
  );

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${disableBackdropBlur ? 'bg-slate-900/10' : 'bg-slate-900/20 backdrop-blur-[2px]'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed right-0 top-0 z-40 flex h-full w-[420px] max-w-[92vw] flex-col
          bg-white border-l border-[#E2E8F0] shadow-[0_0_48px_rgba(15,23,42,0.12)]
          transition-transform duration-[240ms] ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#E2E8F0] px-5 py-4">
          {/* Node type icon */}
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            selectedNode
              ? selectedInputMode === 'free_text'
                ? 'bg-[#EFF6FF] text-[#2563EB]'
                : 'bg-[#EFF6FF] text-[#2563EB]'
              : 'bg-[#F1F5F9] text-[#94A3B8]'
          }`}>
            {selectedNode
              ? selectedInputMode === 'free_text'
                ? <Keyboard className="h-4 w-4" />
                : <MessageSquare className="h-4 w-4" />
              : <MessageSquare className="h-4 w-4" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#0F172A]">
              {selectedNode?.data?.label || selectedEdge ? (
                selectedNode?.data?.label || 'Verbindung'
              ) : (
                <span className="text-[#94A3B8]">Kein Schritt gewählt</span>
              )}
            </p>
            <p className="text-[12px] text-[#94A3B8]">
              {selectedNode
                ? selectedInputMode === 'free_text' ? 'Freitext-Schritt' : 'Nachricht'
                : selectedEdge ? 'Verbindung' : 'Inspector'
              }
            </p>
          </div>

          {/* Lint warning count badge */}
          {lintWarnings.length > 0 && (
            <div className="flex h-6 items-center gap-1 rounded-full border border-[#FCD34D] bg-[#FFFBEB] px-2">
              <TriangleAlert className="h-3 w-3 text-[#B45309]" />
              <span className="text-[11px] font-semibold text-[#B45309]">{lintWarnings.length}</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 border-b border-[#E2E8F0] px-5 pt-3 pb-0">
          <div className="flex gap-0">
            {(['content', 'flow'] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`relative px-4 pb-3 text-sm font-semibold transition-colors ${
                  inspectorTab === tab
                    ? 'text-[#0F172A]'
                    : 'text-[#94A3B8] hover:text-[#475569]'
                }`}
              >
                {tab === 'content' ? 'Inhalt' : 'Flow-Daten'}
                {inspectorTab === tab && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-full bg-[#2563EB]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── INHALT TAB ── */}
          {inspectorTab === 'content' && (
            <div className="space-y-0 divide-y divide-[#F1F5F9]">

              {selectedNode ? (
                <>
                  {/* Node name */}
                  <div className="px-5 py-4">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                      Name
                    </label>
                    <input
                      value={selectedNode.data?.label ?? ''}
                      onChange={(e) => onNodeFieldChange('label', e.target.value)}
                      placeholder="z. B. Begrüßung, Terminabfrage…"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#C1C9D4] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                    />
                  </div>

                  {/* Message text */}
                  <div className="px-5 py-4">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                      Nachricht
                    </label>
                    <textarea
                      value={selectedNode.data?.text ?? ''}
                      onChange={(e) => onNodeFieldChange('text', e.target.value)}
                      rows={5}
                      placeholder="Schreibe die Nachricht die der Bot sendet…"
                      className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#0F172A] placeholder:text-[#C1C9D4] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                    />

                    {/* Placeholder hints (if any used) */}
                    {placeholdersInText.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {placeholdersInText.map((p) => (
                          <span
                            key={p}
                            title={allCollectedKeys.includes(p) ? 'Wird gesammelt ✓' : 'Wird NICHT gesammelt — fehlt ein Freitext-Schritt?'}
                            className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                              allCollectedKeys.includes(p)
                                ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
                                : 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]'
                            }`}
                          >
                            {`{{${p}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input mode + config */}
                  <div className="px-5 py-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                        Wie antwortet der {labels.contactLabel}?
                      </label>
                      <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
                        <button
                          onClick={() => onInputModeChange('buttons')}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                            selectedInputMode === 'buttons'
                              ? 'bg-white text-[#0F172A] shadow-sm'
                              : 'text-[#94A3B8] hover:text-[#475569]'
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Mit Buttons
                        </button>
                        <button
                          onClick={() => onInputModeChange('free_text')}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                            selectedInputMode === 'free_text'
                              ? 'bg-white text-[#0F172A] shadow-sm'
                              : 'text-[#94A3B8] hover:text-[#475569]'
                          }`}
                        >
                          <Keyboard className="h-3.5 w-3.5" />
                          Freitext
                        </button>
                      </div>
                    </div>

                    {/* Free text config */}
                    {selectedInputMode === 'free_text' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                              Sammelt
                            </label>
                            <select
                              value={selectedNode.data?.collects ?? ''}
                              onChange={(e) => onFreeTextMetaChange('collects', e.target.value)}
                              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                            >
                              <option value="">Nichts</option>
                              <option value="name">Name</option>
                              <option value="date">Datum</option>
                              <option value="time">Uhrzeit</option>
                              <option value="guestCount">{labels.participantsLabel}</option>
                              <option value="phone">Telefon</option>
                              <option value="email">E-Mail</option>
                              <option value="specialRequests">Wünsche</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                              Weiter zu
                            </label>
                            <select
                              value={selectedFreeTextTarget ?? ''}
                              onChange={(e) =>
                                onFreeTextTargetChange(selectedNode.id, e.target.value || null)
                              }
                              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                            >
                              <option value="">Flow endet hier</option>
                              {nodes
                                .filter((n) => n.id !== selectedNode.id)
                                .map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.data?.label ?? n.id}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                            Platzhalter-Text im Chat
                          </label>
                          <input
                            value={selectedNode.data?.placeholder ?? ''}
                            onChange={(e) => onFreeTextMetaChange('placeholder', e.target.value)}
                            placeholder="z. B. Datum eingeben…"
                            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#C1C9D4] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Buttons config */}
                    {selectedInputMode === 'buttons' && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                            Antwort-Buttons
                          </label>
                          <button
                            onClick={onAddQuickReply}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
                          >
                            <Plus className="h-3 w-3" />
                            Hinzufügen
                          </button>
                        </div>

                        {selectedNodeReplies.length === 0 ? (
                          <button
                            onClick={onAddQuickReply}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E2E8F0] py-5 text-sm text-[#94A3B8] transition-colors hover:border-[#BFDBFE] hover:text-[#2563EB]"
                          >
                            <Plus className="h-4 w-4" />
                            Ersten Button hinzufügen
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {selectedNodeReplies.map((reply, idx) => (
                              <div
                                key={reply.id}
                                className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5"
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#94A3B8] border border-[#E2E8F0]">
                                  {idx + 1}
                                </span>
                                <input
                                  value={reply.label}
                                  onChange={(e) =>
                                    onUpdateQuickReply(reply.id, { label: e.target.value })
                                  }
                                  placeholder="Button-Text"
                                  className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#0F172A] placeholder:text-[#C1C9D4] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE]"
                                />
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#CBD5E1]" />
                                <select
                                  value={reply.targetNodeId ?? ''}
                                  onChange={(e) =>
                                    onQuickReplyTargetChange(reply.id, e.target.value, reply.label)
                                  }
                                  className="w-32 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 text-[12px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE]"
                                >
                                  <option value="">Endet hier</option>
                                  <option value="__NEW_FREETEXT__">+ Neuer Schritt</option>
                                  {nodes
                                    .filter((n) => n.id !== selectedNode.id)
                                    .map((n) => (
                                      <option key={n.id} value={n.id}>
                                        {n.data?.label ?? n.id}
                                      </option>
                                    ))}
                                </select>
                                <button
                                  onClick={() => onRemoveQuickReply(reply.id)}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#CBD5E1] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* collects for buttons node */}
                        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                            Dieser Schritt sammelt
                          </label>
                          <select
                            value={selectedNode.data?.collects ?? ''}
                            onChange={(e) => onNodeFieldChange('collects', e.target.value)}
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                          >
                            <option value="">Keine Zuordnung</option>
                            <option value="name">Name</option>
                            <option value="date">Datum</option>
                            <option value="time">Uhrzeit</option>
                            <option value="guestCount">{labels.participantsLabel}</option>
                            <option value="phone">Telefon</option>
                            <option value="email">E-Mail</option>
                            <option value="specialRequests">Wünsche</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Erweitert collapsible (image URL + smart prompt) ── */}
                  <div className="px-5 py-3">
                    <button
                      onClick={() => setAdvancedOpen(p => !p)}
                      className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8] transition-colors hover:text-[#475569]"
                    >
                      <span>Erweitert</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {advancedOpen && (
                      <div className="mt-3 space-y-4">
                        {/* Image URL */}
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                            Bild-URL (optional)
                          </label>
                          <input
                            value={selectedNode.data?.imageUrl ?? ''}
                            onChange={(e) => onNodeFieldChange('imageUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#C1C9D4] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                          />
                        </div>

                        {/* Smart Prompt */}
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                              Smart Prompt
                            </label>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="z. B. 'Freundliche Begrüßung für ein Restaurant…'"
                            value={smartPrompt}
                            onChange={(e) => onSmartPromptChange(e.target.value)}
                            className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#C1C9D4] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                          />
                          <button
                            onClick={onSmartPromptSubmit}
                            className="mt-2 w-full rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] py-2 text-sm font-semibold text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
                          >
                            Text vorschlagen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Lint warnings for this node ── */}
                  {nodeWarnings.length > 0 && (
                    <div className="px-5 py-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                        Hinweise
                      </p>
                      {nodeWarnings.map((w) => (
                        <div
                          key={w.id}
                          className={`rounded-xl border p-3 ${
                            w.severity === 'info'
                              ? 'border-[#BFDBFE] bg-[#EFF6FF]'
                              : 'border-[#FCD34D] bg-[#FFFBEB]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                              w.severity === 'info' ? 'text-[#2563EB]' : 'text-[#B45309]'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${
                                w.severity === 'info' ? 'text-[#2563EB]' : 'text-[#B45309]'
                              }`}>
                                {w.message}
                              </p>
                              {w.suggestion && (
                                <p className="mt-0.5 text-[11px] text-[#64748B]">{w.suggestion}</p>
                              )}
                            </div>
                            {(w.nodeId || (w as any).edgeId) && (
                              <button
                                onClick={() => onFocusWarning(w)}
                                className="shrink-0 text-[11px] font-semibold text-[#64748B] hover:underline"
                              >
                                Zeigen
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : selectedEdge ? (
                /* Edge selected (canvas mode) */
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                      Verbindungs-Label
                    </label>
                    <input
                      value={(selectedEdge.data as any)?.condition ?? ''}
                      onChange={(e) => onEdgeFieldChange('condition', e.target.value)}
                      placeholder="z. B. Ja / Nein / Buchen…"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#C1C9D4] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#DBEAFE]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                      Bedeutung
                    </label>
                    <select
                      value={((selectedEdge.data as any)?.tone) ?? 'neutral'}
                      onChange={(e) => onEdgeFieldChange('tone', e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="positive">Bestätigt</option>
                      <option value="negative">Ablehnung</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Nothing selected */
                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F5F9]">
                    <MessageSquare className="h-5 w-5 text-[#CBD5E1]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#94A3B8]">
                    Klicke auf einen Schritt
                  </p>
                  <p className="mt-1 text-xs text-[#CBD5E1]">
                    um ihn hier zu bearbeiten
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── FLOW-DATEN TAB ── */}
          {inspectorTab === 'flow' && (
            <div className="space-y-0 divide-y divide-[#F1F5F9]">

              {/* This node collects */}
              {selectedNode && (
                <div className="px-5 py-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                    Dieser Schritt sammelt
                  </p>
                  {hasCollects ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-sm font-semibold text-[#2563EB]">
                        {VARIABLE_LABELS[nodeCollects] ?? nodeCollects}
                      </span>
                      <span className="text-xs text-[#94A3B8]">
                        → gespeichert als{' '}
                        <code className="rounded-md bg-[#F1F5F9] px-1.5 py-0.5 font-mono text-[11px] text-[#2563EB]">
                          {`{{${nodeCollects}}}`}
                        </code>
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-[#94A3B8]">
                      Keine Variable — wähle &quot;Sammelt&quot; im Inhalt-Tab.
                    </p>
                  )}
                </div>
              )}

              {/* All variables in flow */}
              <div className="px-5 py-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  Variablen im Flow
                </p>
                {allCollectedKeys.length > 0 ? (
                  <div className="space-y-1.5">
                    {allCollectedKeys.map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <code className="font-mono text-[12px] font-semibold text-[#2563EB]">
                            {`{{${key}}}`}
                          </code>
                          <span className="text-xs text-[#94A3B8]">
                            {VARIABLE_LABELS[key] ?? key}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(key)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#94A3B8] transition-colors hover:bg-white hover:text-[#2563EB]"
                        >
                          {copiedKey === key ? (
                            <><Check className="h-3 w-3" /> Kopiert</>
                          ) : (
                            <><Copy className="h-3 w-3" /> Kopieren</>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#94A3B8]">
                    Noch keine Variablen. Füge Freitext-Schritte hinzu und wähle &quot;Sammelt&quot;.
                  </p>
                )}
              </div>

              {/* Booking config */}
              <div className="px-5 py-4 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  Buchungseinstellungen
                </p>

                {/* Flow type */}
                <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
                  <button
                    onClick={() => onToggleFlowType('reservation')}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      outputType === 'reservation'
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#475569]'
                    }`}
                  >
                    Buchungs-Flow
                  </button>
                  <button
                    onClick={() => onToggleFlowType('custom')}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      outputType === 'custom'
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#475569]'
                    }`}
                  >
                    Freier Flow
                  </button>
                </div>

                <p className="text-xs text-[#94A3B8]">
                  {outputType === 'reservation'
                    ? 'Erstellt automatisch eine Buchung wenn alle Pflichtfelder vorliegen.'
                    : 'Keine automatische Buchung — freie Konversation.'}
                </p>

                {/* Required fields */}
                {outputType === 'reservation' && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                      Pflichtfelder
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'name', label: 'Name' },
                        { key: 'date', label: 'Datum' },
                        { key: 'time', label: 'Uhrzeit' },
                        { key: 'guestCount', label: labels.participantsLabel },
                        { key: 'phone', label: 'Telefon' },
                        { key: 'email', label: 'E-Mail' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => onToggleRequiredField(key)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                            requiredFields.includes(key)
                              ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]'
                              : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] hover:text-[#475569]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            requiredFields.includes(key) ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                          }`} />
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-[#CBD5E1]">
                      Blau = Pflichtfeld. Buchung wird erst erstellt wenn alle vorliegen.
                    </p>
                  </div>
                )}
              </div>

              {/* Global lint warnings */}
              {lintWarnings.length > 0 && (
                <div className="px-5 py-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                    Qualitäts-Check
                  </p>
                  {lintWarnings.map((w) => (
                    <div
                      key={w.id}
                      className={`rounded-xl border p-3 ${
                        w.severity === 'info'
                          ? 'border-[#BFDBFE] bg-[#EFF6FF]'
                          : 'border-[#FCD34D] bg-[#FFFBEB]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          w.severity === 'info' ? 'text-[#2563EB]' : 'text-[#B45309]'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${
                            w.severity === 'info' ? 'text-[#2563EB]' : 'text-[#B45309]'
                          }`}>
                            {w.message}
                          </p>
                          {w.suggestion && (
                            <p className="mt-0.5 text-[11px] text-[#64748B]">{w.suggestion}</p>
                          )}
                          {(w.nodeId || (w as any).edgeId) && (
                            <button
                              onClick={() => onFocusWarning(w)}
                              className="mt-1 text-[11px] font-semibold text-[#64748B] hover:underline"
                            >
                              Zum Schritt springen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {(selectedNode || selectedEdge) && (
          <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onDeleteSelection}
                className="flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-[#DC2626] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Löschen
              </button>

              <div className="flex items-center gap-2">
                {saveState === 'saved' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#047857]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Gespeichert
                  </span>
                )}
                {saveState === 'error' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#DC2626]">
                    <TriangleAlert className="h-3.5 w-3.5" /> Fehler
                  </span>
                )}
                {saveState !== 'saved' && saveState !== 'error' && hasUnsavedChanges && (
                  <span className="text-xs text-[#94A3B8]">Ungespeichert</span>
                )}
                <button
                  onClick={onSave}
                  disabled={!hasUnsavedChanges || saveState === 'saving'}
                  className="rounded-xl bg-[#2450b2] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1a46c4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveState === 'saving' ? 'Speichert…' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer without selection (just save state) */}
        {!selectedNode && !selectedEdge && (
          <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-5 py-3.5">
            <div className="flex items-center justify-end gap-2">
              {saveState === 'saved' && (
                <span className="flex items-center gap-1 text-xs font-semibold text-[#047857]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Gespeichert
                </span>
              )}
              <button
                onClick={onSave}
                disabled={!hasUnsavedChanges || saveState === 'saving'}
                className="rounded-xl bg-[#2450b2] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1a46c4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveState === 'saving' ? 'Speichert…' : 'Speichern'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
