'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Trash2,
  CheckCircle2,
  TriangleAlert,
  Focus,
} from 'lucide-react';
import type { Node as ReactFlowNode, Edge } from 'reactflow';
import type { FlowQuickReply } from '../../lib/flowTypes';
import type { FlowLintWarning } from '../../lib/flowLint';
import FlowSimulator from './FlowSimulator';
import type { FlowTrigger } from '../../lib/flowTypes';
import useAccountVertical from '../../lib/useAccountVertical';
import { getBookingLabels, getWizardCopy } from '../../lib/verticals';

type InspectorTab = 'content' | 'logic' | 'variables' | 'preview';
type EdgeTone = 'neutral' | 'positive' | 'negative';
type InputMode = 'buttons' | 'free_text';

type InspectorSlideOverProps = {
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

  // Output config (flow-level, shown in Variables tab)
  outputType: 'reservation' | 'custom';
  requiredFields: string[];
  onToggleFlowType: (type: 'reservation' | 'custom') => void;
  onToggleRequiredField: (field: string) => void;

  // Save state
  saveState: 'idle' | 'saving' | 'saved' | 'error';
};

const VARIABLE_LABELS: Record<string, string> = {
  name: "Name",
  date: "Datum",
  time: "Uhrzeit",
  guestCount: "Personenanzahl",
  phone: "Telefon",
  email: "E-Mail",
  specialRequests: "Sonderwünsche",
  reviewRating: "Bewertung",
  reviewFeedback: "Feedback",
  googleReviewUrl: "Google-Link",
};

function VariablesTab({
  selectedNode,
  nodes,
  labels,
  outputType,
  requiredFields,
  onToggleFlowType,
  onToggleRequiredField,
}: {
  selectedNode: ReactFlowNode | null;
  nodes: ReactFlowNode[];
  labels: ReturnType<typeof import('../../lib/verticals').getBookingLabels>;
  outputType: 'reservation' | 'custom';
  requiredFields: string[];
  onToggleFlowType: (type: 'reservation' | 'custom') => void;
  onToggleRequiredField: (field: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const allCollectedKeys = useMemo(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const node of nodes) {
      const c = (node.data as any)?.collects;
      if (c && typeof c === "string" && c.trim() && c !== "__custom_empty__") {
        if (!seen.has(c)) { seen.add(c); keys.push(c); }
      }
    }
    return keys;
  }, [nodes]);

  const placeholdersInText = useMemo(() => {
    const text = (selectedNode?.data as any)?.text ?? "";
    const matches = [...text.matchAll(/\{\{([^}]+)\}\}/g)];
    return Array.from(new Set(matches.map((m: RegExpMatchArray) => m[1].trim())));
  }, [selectedNode]);

  const nodeCollects = (selectedNode?.data as any)?.collects;
  const hasCollects = nodeCollects && nodeCollects !== "__custom_empty__";

  const handleCopy = (placeholder: string) => {
    navigator.clipboard.writeText(`{{${placeholder}}}`).then(() => {
      setCopied(placeholder);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="space-y-4">
      {selectedNode && (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Dieser Schritt sammelt
          </p>
          {hasCollects ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-sm font-semibold text-[#2563EB]">
                {VARIABLE_LABELS[nodeCollects] ?? nodeCollects}
              </span>
              <span className="text-xs text-[#64748B]">
                → gespeichert als{" "}
                <code className="rounded bg-white px-1 text-[#2563EB]">{`{{${nodeCollects}}}`}</code>
              </span>
            </div>
          ) : (
            <p className="text-sm text-[#64748B]">
              Dieser Schritt sammelt keine Variable.{" "}
              {(selectedNode?.data as any)?.inputMode === "free_text" && (
                <span className="text-[#475569]">
                  Wähle im Feld &quot;Dieses Feld sammelt&quot; was gespeichert werden soll.
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {selectedNode && (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Platzhalter im Text dieses Schritts
          </p>
          {placeholdersInText.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {placeholdersInText.map((p) => (
                <span
                  key={p}
                  className={`rounded-full border px-2 py-0.5 text-xs font-mono font-semibold ${
                    allCollectedKeys.includes(p)
                      ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
                      : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                  }`}
                  title={allCollectedKeys.includes(p) ? "Wird gesammelt ✓" : "Wird NICHT gesammelt — fehlt ein Freitext-Schritt?"}
                >
                  {`{{${p}}}`}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748B]">
              Kein Platzhalter verwendet.{" "}
              <span className="text-[#475569]">Tipp: Schreibe {"{{"}<span className="text-[#0F172A]">name</span>{"}}"} um den Namen einzufügen.</span>
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
          Verfügbare Platzhalter in diesem Flow
        </p>
        {allCollectedKeys.length > 0 ? (
          <div className="space-y-2">
            {allCollectedKeys.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-[#2563EB]">{`{{${key}}}`}</code>
                  <span className="text-xs text-[#64748B]">{VARIABLE_LABELS[key] ?? key}</span>
                </div>
                <button
                  onClick={() => handleCopy(key)}
                  className="text-xs font-semibold text-[#64748B] transition-colors hover:text-[#2563EB]"
                >
                  {copied === key ? "Kopiert ✓" : "Kopieren"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#64748B]">
            Noch keine Felder konfiguriert. Füge Freitext-Schritte hinzu und wähle jeweils &quot;Dieses Feld sammelt&quot;.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Buchungskonfiguration</p>

        {/* Flow type toggle */}
        <div className="space-y-2">
          <p className="text-xs text-[#64748B]">Flow-Typ</p>
          <div className="flex gap-2">
            <button
              onClick={() => onToggleFlowType('reservation')}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                outputType === 'reservation'
                  ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]'
                  : 'border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Buchungs-Flow
            </button>
            <button
              onClick={() => onToggleFlowType('custom')}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                outputType === 'custom'
                  ? 'border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED]'
                  : 'border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Freier Flow
            </button>
          </div>
          <p className="text-xs text-[#64748B]">
            {outputType === 'reservation'
              ? 'Erstellt automatisch Buchungen wenn alle Pflichtfelder vorliegen.'
              : 'Keine automatische Buchung — freie Konversation.'}
          </p>
        </div>

        {/* Required fields — only for reservation type */}
        {outputType === 'reservation' && (
          <div className="space-y-2">
            <p className="text-xs text-[#64748B]">Pflichtfelder für Buchungserstellung</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'name', label: 'Name' },
                { key: 'date', label: 'Datum' },
                { key: 'time', label: 'Uhrzeit' },
                { key: 'guestCount', label: labels.participantsCountLabel },
                { key: 'phone', label: 'Telefon' },
                { key: 'email', label: 'E-Mail' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onToggleRequiredField(key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                    requiredFields.includes(key)
                      ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]'
                      : 'border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${requiredFields.includes(key) ? 'bg-[#2563EB]' : 'bg-[#94A3B8]'}`} />
                  {label}
                  {key === 'guestCount' && !requiredFields.includes(key) && (
                    <span className="text-[#94A3B8]">· Standard: 1</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#64748B]">
              Blau = Pflichtfeld. Buchung wird erst erstellt wenn alle Pflichtfelder vorliegen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const EDGE_TONE_META: Record<EdgeTone, { label: string; bg: string; text: string }> = {
  neutral: { label: 'Neutral', bg: '#3f3f46', text: '#a1a1aa' },
  positive: { label: 'Bestätigt', bg: '#065f46', text: '#34d399' },
  negative: { label: 'Ablehnung', bg: '#7f1d1d', text: '#fca5a5' },
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
  onSnippetInsert,
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
  const wizardCopy = getWizardCopy(vertical);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as globalThis.Node)) {
        // Don't close if clicking on canvas nodes
        const target = event.target as HTMLElement;
        if (target.closest('.react-flow__node') || target.closest('.react-flow__edge')) {
          return;
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-250 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${disableBackdropBlur ? 'bg-slate-900/10' : 'bg-slate-900/20 backdrop-blur-[2px]'}`}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={`
          fixed right-0 top-0 z-40 h-full w-[400px] max-w-[90vw]
          bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] border-l border-[#E2E8F0]
          transform transition-transform duration-[250ms] ease-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <h2 className="text-xl font-semibold text-[#0F172A]">
            Inspector
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-[#E2E8F0] px-4 py-3">
          <div className="flex gap-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
            {(['content', 'preview', 'logic', 'variables'] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`
                  flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all
                  ${inspectorTab === tab
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                  }
                `}
              >
                {tab === 'content' ? 'Inhalt' : tab === 'logic' ? 'Logik' : tab === 'variables' ? 'Variablen' : 'Vorschau'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {inspectorTab === 'content' && (
            <div className="space-y-5">
              {selectedNode ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-[#334155]">Textnachricht</label>
                    <textarea
                      value={selectedNode.data?.text ?? ''}
                      onChange={(e) => onNodeFieldChange('text', e.target.value)}
                      className="app-input mt-2 min-h-[112px] resize-none px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                      rows={4}
                      placeholder="Gib hier deine Nachricht ein..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#334155]">Bild (URL)</label>
                    <input
                      value={selectedNode.data?.imageUrl ?? ''}
                      onChange={(e) => onNodeFieldChange('imageUrl', e.target.value)}
                      placeholder="https://..."
                      className="app-input mt-2 px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                    />
                  </div>

                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <p className="mb-3 text-sm font-semibold text-[#0F172A]">Antwortart</p>
                    <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-1">
                      <button
                        onClick={() => onInputModeChange('buttons')}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                          selectedInputMode === 'buttons'
                            ? 'bg-[#2563EB] text-white'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        Buttons
                      </button>
                      <button
                        onClick={() => onInputModeChange('free_text')}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                          selectedInputMode === 'free_text'
                            ? 'bg-[#2563EB] text-white'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        Freitext
                      </button>
                    </div>
                    {selectedInputMode === 'free_text' && (
                      <p className="mt-2 text-xs text-[#64748B]">
                        Der {labels.contactLabel} schreibt hier frei. Du bestimmst, wohin es danach weitergeht.
                      </p>
                    )}
                  </div>

                  {selectedInputMode === 'free_text' ? (
                    <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-4 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-[#B45309]">Platzhalter im Chat</label>
                        <input
                          value={selectedNode.data?.placeholder ?? ''}
                          onChange={(e) => onFreeTextMetaChange('placeholder', e.target.value)}
                          placeholder="z. B. Datum eingeben..."
                          className="app-input mt-1 bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#B45309]">Dieses Feld sammelt</label>
                        <select
                          value={selectedNode.data?.collects ?? ''}
                          onChange={(e) => onFreeTextMetaChange('collects', e.target.value)}
                          className="app-select mt-1 w-full"
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
                      <div>
                        <label className="text-xs font-semibold text-[#B45309]">Führt zu</label>
                        <select
                          value={selectedFreeTextTarget ?? ''}
                          onChange={(e) => onFreeTextTargetChange(selectedNode.id, e.target.value || null)}
                          className="app-select mt-1 w-full"
                        >
                          <option value="">Node wählen...</option>
                          {nodes
                            .filter((node) => node.id !== selectedNode.id)
                            .map((node) => (
                              <option key={node.id} value={node.id}>
                                {node.data?.label ?? node.id}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-[#0F172A]">Antwort-Buttons</p>
                        <button
                          onClick={onAddQuickReply}
                          className="text-xs font-semibold text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
                        >
                          + Button
                        </button>
                      </div>
                      {selectedNodeReplies.length === 0 ? (
                        <p className="text-xs text-[#64748B]">
                          Noch keine Buttons. Füge Buttons hinzu, um Antworten zu verlinken.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedNodeReplies.map((reply) => (
                            <div
                              key={reply.id}
                              className="space-y-2 rounded-xl border border-[#E2E8F0] bg-white p-3"
                            >
                              <div className="flex items-center justify-between text-xs text-[#64748B]">
                                <span>Button</span>
                                <button
                                  onClick={() => onRemoveQuickReply(reply.id)}
                                  className="text-[#DC2626] hover:text-[#B91C1C]"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <input
                                value={reply.label}
                                onChange={(e) => onUpdateQuickReply(reply.id, { label: e.target.value })}
                                placeholder="Button-Text"
                                className="app-input px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                              />
                              {!hidePayloadField && (
                                <input
                                  value={reply.payload}
                                  onChange={(e) => onUpdateQuickReply(reply.id, { payload: e.target.value })}
                                  placeholder="Payload / interne Aktion"
                                  className="app-input px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                                />
                              )}
                              <div>
                                <label className="text-xs font-semibold text-[#64748B]">Führt zu</label>
                                <select
                                  value={reply.targetNodeId ?? ''}
                                  onChange={(e) => onQuickReplyTargetChange(reply.id, e.target.value, reply.label)}
                                  className="app-select mt-1 w-full"
                                >
                                  <option value="">Node wählen...</option>
                                  <option value="__NEW_FREETEXT__">+ Freitext (neu)</option>
                                  {nodes.map((node) => (
                                    <option key={node.id} value={node.id}>
                                      {node.data?.label ?? node.id}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={onDeleteSelection}
                    className="w-full rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-sm font-medium text-[#DC2626] transition-colors hover:bg-[#FEE2E2]"
                  >
                    Node entfernen
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
                  <p className="text-sm text-[#64748B]">
                    Wähle einen Node im Canvas aus, um die Inhalte zu bearbeiten.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="mb-3 text-sm font-semibold text-[#0F172A]">Snippets</p>
                <div className="flex flex-wrap gap-2">
                  {snippets.map((snippet) => (
                    <button
                      key={snippet.label}
                      onClick={() => onSnippetInsert(snippet.text)}
                      className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition-colors hover:border-[#BFDBFE] hover:text-[#2563EB]"
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                  <Sparkles className="h-4 w-4 text-[#2563EB]" />
                  Smart Prompt
                </p>
                <textarea
                  className="app-input min-h-[92px] resize-none px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                  rows={3}
                  placeholder={`z. B. 'Erzeuge eine freundliche Begrüßung für ein ${wizardCopy.businessTypeLabel.toLowerCase()}...'`}
                  value={smartPrompt}
                  onChange={(e) => onSmartPromptChange(e.target.value)}
                />
                <button
                  onClick={onSmartPromptSubmit}
                  className="mt-2 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#475569] transition-colors hover:border-[#BFDBFE] hover:text-[#2563EB]"
                >
                  Vorschlag einsetzen
                </button>
              </div>
            </div>
          )}

          {/* Logic Tab */}
          {inspectorTab === 'logic' && (
            <div className="space-y-5">
              {selectedEdge ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-[#334155]">Edge Label</label>
                    <input
                      value={(selectedEdge.data as any)?.condition ?? ''}
                      onChange={(e) => onEdgeFieldChange('condition', e.target.value)}
                      className="app-input mt-2 px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#334155]">Bedeutung / Ton</label>
                    <select
                      value={((selectedEdge.data as any)?.tone as EdgeTone) ?? 'neutral'}
                      onChange={(e) => onEdgeFieldChange('tone', e.target.value)}
                      className="app-select mt-2 w-full"
                    >
                      {Object.entries(EDGE_TONE_META).map(([value, meta]) => (
                        <option key={value} value={value}>
                          {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
                  <p className="text-sm text-[#64748B]">
                    Wähle eine Verbindung, um Bedingungen und Labels zu pflegen.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Variables Tab */}
          {inspectorTab === 'variables' && (
            <VariablesTab
              selectedNode={selectedNode}
              nodes={nodes}
              labels={labels}
              outputType={outputType}
              requiredFields={requiredFields}
              onToggleFlowType={onToggleFlowType}
              onToggleRequiredField={onToggleRequiredField}
            />
          )}

          {/* Preview Tab */}
          {inspectorTab === 'preview' && (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <FlowSimulator
                nodes={nodes}
                edges={edges}
                triggers={triggers}
                onNodeSelect={onNodeSelect}
              />
            </div>
          )}

          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="mb-3 text-sm font-semibold text-[#0F172A]">Qualitäts-Check</p>
            {lintWarnings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-sm font-semibold text-[#047857]">
                <CheckCircle2 className="h-4 w-4" /> Keine Warnungen
              </div>
            ) : (
              <ul className="space-y-2">
                {lintWarnings.map((warning) => (
                  <li
                    key={warning.id}
                    className={`rounded-lg border p-3 text-sm ${
                      warning.severity === 'info'
                        ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]'
                        : 'border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]'
                    }`}
                  >
                    <p className="font-semibold">{warning.message}</p>
                    {warning.suggestion && (
                      <p className="mt-1 text-xs opacity-80">{warning.suggestion}</p>
                    )}
                    {(warning.nodeId || (warning as any).edgeId) && (
                      <button
                        onClick={() => onFocusWarning(warning)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                      >
                        <Focus className="h-3 w-3" />
                        {(warning as any).edgeId ? 'Zur Verbindung springen' : 'Zum Node springen'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {saveState === 'saved' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-sm font-semibold text-[#047857]">
              <CheckCircle2 className="h-4 w-4" /> Änderungen gespeichert
            </div>
          )}
          {saveState === 'error' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-[#DC2626]">
              <TriangleAlert className="h-4 w-4" /> Speichern fehlgeschlagen
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#64748B]">
              {saveState === 'error'
                ? 'Speichern fehlgeschlagen'
                : hasUnsavedChanges
                ? 'Änderungen nicht gespeichert'
                : 'Alle Änderungen gespeichert'}
            </span>
            <button
              onClick={onSave}
              disabled={!hasUnsavedChanges || saveState === 'saving'}
              className="rounded-full bg-[#2450b2] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(0,0,0,0.18)] transition-all hover:bg-[#1a46c4] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saveState === 'saving' ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
