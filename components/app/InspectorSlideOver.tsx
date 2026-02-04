'use client';

import { useEffect, useRef } from 'react';
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

type InspectorTab = 'content' | 'logic' | 'variables' | 'preview';
type EdgeTone = 'neutral' | 'positive' | 'negative';
type InputMode = 'buttons' | 'free_text';

type InspectorSlideOverProps = {
  isOpen: boolean;
  onClose: () => void;
  inspectorTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;

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

  // Save state
  saveState: 'idle' | 'saving' | 'saved' | 'error';
};

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
  saveState,
}: InspectorSlideOverProps) {
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
      {/* Backdrop - subtle overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div
        ref={panelRef}
        className={`
          fixed right-0 top-0 z-40 h-full w-[400px] max-w-[90vw]
          bg-zinc-900 shadow-2xl border-l border-white/10
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-white">
            Inspector
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            {(['content', 'logic', 'variables', 'preview'] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`
                  flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all
                  ${inspectorTab === tab
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }
                `}
              >
                {tab === 'content' ? 'Inhalt' : tab === 'logic' ? 'Logik' : tab === 'variables' ? 'Variablen' : 'Vorschau'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="h-[calc(100%-140px)] overflow-y-auto px-6 py-4">
          {/* Content Tab */}
          {inspectorTab === 'content' && (
            <div className="space-y-5">
              {selectedNode ? (
                <>
                  {/* Text Message */}
                  <div>
                    <label className="text-sm font-semibold text-zinc-400">Textnachricht</label>
                    <textarea
                      value={selectedNode.data?.text ?? ''}
                      onChange={(e) => onNodeFieldChange('text', e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                      rows={4}
                      placeholder="Gib hier deine Nachricht ein..."
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="text-sm font-semibold text-zinc-400">Bild (URL)</label>
                    <input
                      value={selectedNode.data?.imageUrl ?? ''}
                      onChange={(e) => onNodeFieldChange('imageUrl', e.target.value)}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Input Mode */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-zinc-300 mb-3">Antwortart</p>
                    <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                      <button
                        onClick={() => onInputModeChange('buttons')}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                          selectedInputMode === 'buttons'
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Buttons
                      </button>
                      <button
                        onClick={() => onInputModeChange('free_text')}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                          selectedInputMode === 'free_text'
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Freitext
                      </button>
                    </div>
                    {selectedInputMode === 'free_text' && (
                      <p className="mt-2 text-xs text-zinc-500">
                        Der Kunde schreibt hier frei. Du bestimmst, wohin es danach weitergeht.
                      </p>
                    )}
                  </div>

                  {/* Free Text Options */}
                  {selectedInputMode === 'free_text' ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500">Platzhalter im Chat</label>
                        <input
                          value={selectedNode.data?.placeholder ?? ''}
                          onChange={(e) => onFreeTextMetaChange('placeholder', e.target.value)}
                          placeholder="z. B. Datum eingeben..."
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500">Dieses Feld sammelt</label>
                        <select
                          value={selectedNode.data?.collects ?? ''}
                          onChange={(e) => onFreeTextMetaChange('collects', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="">Keine Zuordnung</option>
                          <option value="name">Name</option>
                          <option value="date">Datum</option>
                          <option value="time">Uhrzeit</option>
                          <option value="guestCount">Personen</option>
                          <option value="phone">Telefon</option>
                          <option value="email">E-Mail</option>
                          <option value="specialRequests">Wünsche</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500">Weiterleiten zu</label>
                        <select
                          value={selectedFreeTextTarget ?? ''}
                          onChange={(e) => onFreeTextTargetChange(selectedNode.id, e.target.value || null)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                    /* Quick Replies / Buttons */
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-zinc-300">Antwort-Buttons</p>
                        <button
                          onClick={onAddQuickReply}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          + Button
                        </button>
                      </div>
                      {selectedNodeReplies.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          Noch keine Buttons. Füge Buttons hinzu, um Antworten zu verlinken.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedNodeReplies.map((reply) => (
                            <div
                              key={reply.id}
                              className="rounded-xl border border-white/10 bg-zinc-800/50 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>Button</span>
                                <button
                                  onClick={() => onRemoveQuickReply(reply.id)}
                                  className="text-rose-400 hover:text-rose-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <input
                                value={reply.label}
                                onChange={(e) => onUpdateQuickReply(reply.id, { label: e.target.value })}
                                placeholder="Button-Text"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                              />
                              <input
                                value={reply.payload}
                                onChange={(e) => onUpdateQuickReply(reply.id, { payload: e.target.value })}
                                placeholder="Payload / interne Aktion"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                              />
                              <div>
                                <label className="text-xs font-semibold text-zinc-500">Weiterleiten zu</label>
                                <select
                                  value={reply.targetNodeId ?? ''}
                                  onChange={(e) => onQuickReplyTargetChange(reply.id, e.target.value, reply.label)}
                                  className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
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

                  {/* Delete Node Button */}
                  <button
                    onClick={onDeleteSelection}
                    className="w-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    Node entfernen
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
                  <p className="text-sm text-zinc-500">
                    Wähle einen Node im Canvas aus, um die Inhalte zu bearbeiten.
                  </p>
                </div>
              )}

              {/* Snippets */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-zinc-300 mb-3">Snippets</p>
                <div className="flex flex-wrap gap-2">
                  {snippets.map((snippet) => (
                    <button
                      key={snippet.label}
                      onClick={() => onSnippetInsert(snippet.text)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Prompt */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-3">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Smart Prompt
                </p>
                <textarea
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="z. B. 'Erzeuge eine freundliche Begrüßung für ein italienisches Restaurant...'"
                  value={smartPrompt}
                  onChange={(e) => onSmartPromptChange(e.target.value)}
                />
                <button
                  onClick={onSmartPromptSubmit}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
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
                    <label className="text-sm font-semibold text-zinc-400">Edge Label</label>
                    <input
                      value={(selectedEdge.data as any)?.condition ?? ''}
                      onChange={(e) => onEdgeFieldChange('condition', e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-400">Bedeutung / Ton</label>
                    <select
                      value={((selectedEdge.data as any)?.tone as EdgeTone) ?? 'neutral'}
                      onChange={(e) => onEdgeFieldChange('tone', e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
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
                <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
                  <p className="text-sm text-zinc-500">
                    Wähle eine Verbindung, um Bedingungen und Labels zu pflegen.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Variables Tab */}
          {inspectorTab === 'variables' && (
            <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
              <p className="text-sm text-zinc-500">
                Variablen-Support folgt. Plane hier Platzhalter wie {"{{customer_name}}"} ein.
              </p>
            </div>
          )}

          {/* Preview Tab */}
          {inspectorTab === 'preview' && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <FlowSimulator
                nodes={nodes}
                edges={edges}
                triggers={triggers}
                onNodeSelect={onNodeSelect}
              />
            </div>
          )}

          {/* Quality Check Section */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-zinc-300 mb-3">Qualitäts-Check</p>
            {lintWarnings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Keine Warnungen
              </div>
            ) : (
              <ul className="space-y-2">
                {lintWarnings.map((warning) => (
                  <li
                    key={warning.id}
                    className={`rounded-lg border p-3 text-sm ${
                      warning.severity === 'info'
                        ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
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

          {/* Save State Feedback */}
          {saveState === 'saved' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Änderungen gespeichert
            </div>
          )}
          {saveState === 'error' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-400">
              <TriangleAlert className="h-4 w-4" /> Speichern fehlgeschlagen
            </div>
          )}
        </div>
      </div>
    </>
  );
}
