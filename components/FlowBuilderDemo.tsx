'use client';

import { useEffect, useState } from 'react';
import { Check, MessageSquare, Zap, Clock, Star, Plus } from 'lucide-react';

/* ════════════════════════════════════════════
   LAYOUT CONSTANTS
   ════════════════════════════════════════════ */

const NW  = 152;  // node width
const NH  = 40;   // node height
const NL  = 150;  // node left (canvas horizontal center ≈ NL + NW/2 = 226)
const CCX = NL + NW / 2; // center-x = 226

/* ════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════ */

type NodeType = 'trigger' | 'message' | 'reply' | 'action';

const CANVAS_NODES = [
  { id: 'trigger', label: 'DM Eingang',     type: 'trigger' as NodeType, top: 16  },
  { id: 'welcome', label: 'Begrüßung',      type: 'message' as NodeType, top: 112 },
  { id: 'time',    label: 'Uhrzeit wählen', type: 'reply'   as NodeType, top: 212 },
  { id: 'confirm', label: 'Bestätigung',    type: 'message' as NodeType, top: 326 },
] as const;

const CONNS = [
  { from: 'trigger', to: 'welcome', step: 2 },
  { from: 'welcome', to: 'time',    step: 3 },
  { from: 'time',    to: 'confirm', step: 4 },
];

const QR_REPLIES = ['18:00', '19:00', '20:00'];

const NODE_STYLE: Record<NodeType, { accent: string; bg: string; text: string; icon: React.ElementType }> = {
  trigger: { accent: '#10b981', bg: 'rgba(16,185,129,0.08)',  text: '#6ee7b7', icon: Zap },
  message: { accent: '#6366f1', bg: 'rgba(99,102,241,0.08)',  text: '#a5b4fc', icon: MessageSquare },
  reply:   { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', text: '#c4b5fd', icon: Clock },
  action:  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  text: '#fcd34d', icon: Star },
};

const EDITOR_NODES = [
  {
    id: 'trigger',
    typeLabel: 'Trigger',
    label: 'DM Eingang',
    text: 'Jede eingehende Instagram DM startet diesen Flow automatisch.',
    accent: '#10b981',
  },
  {
    id: 'welcome',
    typeLabel: 'Nachricht',
    label: 'Begrüßung',
    text: 'Hallo! Ich helfe dir gerne bei deiner Reservierung.',
    accent: '#6366f1',
  },
  {
    id: 'time',
    typeLabel: 'Quick Reply',
    label: 'Uhrzeit wählen',
    text: 'Zu welcher Uhrzeit möchtest du kommen?',
    accent: '#8b5cf6',
    qr: ['18:00 Uhr', '19:00 Uhr', '20:00 Uhr'],
  },
  {
    id: 'confirm',
    typeLabel: 'Nachricht',
    label: 'Bestätigung',
    text: 'Super! Dein Tisch ist reserviert für {{time}} Uhr. Wir freuen uns auf dich!',
    accent: '#6366f1',
  },
];

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */

export default function FlowBuilderDemo() {
  // step: 0=template picker, 1-4=building nodes, 5=live
  const [step,             setStep]             = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [visibleNodes,     setVisibleNodes]     = useState<Set<string>>(new Set());
  const [visibleConns,     setVisibleConns]     = useState<Set<string>>(new Set());
  const [activeNodeId,     setActiveNodeId]     = useState<string | null>(null);
  const [qrVisible,        setQrVisible]        = useState(0); // how many QR pills shown
  const [typedText,        setTypedText]        = useState('');
  const [showPlus,         setShowPlus]         = useState<string | null>(null); // node id after which + shows
  const [cycleKey,         setCycleKey]         = useState(0);

  /* ── Typing animation ── */
  useEffect(() => {
    if (!activeNodeId) { setTypedText(''); return; }
    const node = EDITOR_NODES.find((n) => n.id === activeNodeId);
    if (!node) return;

    setTypedText('');
    const full = node.text;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTypedText(full.slice(0, i));
      if (i >= full.length) clearInterval(iv);
    }, 38);
    return () => clearInterval(iv);
  }, [activeNodeId]);

  /* ── Main animation sequence ── */
  useEffect(() => {
    // reset
    setStep(0);
    setSelectedTemplate(null);
    setVisibleNodes(new Set());
    setVisibleConns(new Set());
    setActiveNodeId(null);
    setQrVisible(0);
    setShowPlus(null);
    setTypedText('');

    const t = (ms: number, fn: () => void) => setTimeout(fn, ms);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // ── Phase 0: Template selection ──
    timeouts.push(t(1200, () => setSelectedTemplate('restaurant')));

    // ── Phase 1: Trigger node ──
    timeouts.push(t(2800, () => {
      setStep(1);
      setVisibleNodes(new Set(['trigger']));
      setActiveNodeId('trigger');
    }));
    timeouts.push(t(4200, () => setShowPlus('trigger')));

    // ── Phase 2: Begrüßung ──
    timeouts.push(t(5800, () => {
      setShowPlus(null);
      setStep(2);
      setVisibleNodes(new Set(['trigger', 'welcome']));
      setVisibleConns(new Set(['trigger-welcome']));
      setActiveNodeId('welcome');
    }));
    timeouts.push(t(7400, () => setShowPlus('welcome')));

    // ── Phase 3: Uhrzeit (Quick Reply) ──
    timeouts.push(t(9200, () => {
      setShowPlus(null);
      setStep(3);
      setVisibleNodes(new Set(['trigger', 'welcome', 'time']));
      setVisibleConns(new Set(['trigger-welcome', 'welcome-time']));
      setActiveNodeId('time');
    }));
    // QR pills appear one by one
    timeouts.push(t(10600, () => setQrVisible(1)));
    timeouts.push(t(11300, () => setQrVisible(2)));
    timeouts.push(t(12000, () => setQrVisible(3)));
    timeouts.push(t(12400, () => setShowPlus('time')));

    // ── Phase 4: Bestätigung ──
    timeouts.push(t(14000, () => {
      setShowPlus(null);
      setStep(4);
      setVisibleNodes(new Set(['trigger', 'welcome', 'time', 'confirm']));
      setVisibleConns(new Set(['trigger-welcome', 'welcome-time', 'time-confirm']));
      setActiveNodeId('confirm');
    }));

    // ── Phase 5: Live! ──
    timeouts.push(t(19000, () => {
      setStep(5);
      setActiveNodeId(null);
      setShowPlus(null);
    }));

    // ── Restart ──
    timeouts.push(t(25000, () => setCycleKey((k) => k + 1)));

    return () => timeouts.forEach(clearTimeout);
  }, [cycleKey]);

  /* ── Active editor node data ── */
  const editorNode = EDITOR_NODES.find((n) => n.id === activeNodeId) ?? null;

  /* ── Connection path helper ── */
  const getPath = (fromId: string, toId: string) => {
    const from = CANVAS_NODES.find((n) => n.id === fromId);
    const to   = CANVAS_NODES.find((n) => n.id === toId);
    if (!from || !to) return '';
    const y1 = from.top + NH;
    const y2 = to.top;
    const cp = (y2 - y1) * 0.45;
    return `M ${CCX} ${y1} C ${CCX} ${y1 + cp} ${CCX} ${y2 - cp} ${CCX} ${y2}`;
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* ── Background glow ── */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/8 blur-[80px]" />

      <div className="relative">
        {/* ── Browser chrome ── */}
        <div className="overflow-hidden rounded-t-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-zinc-800/80 px-3 py-1">
              <svg className="h-3 w-3 flex-shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 010 20M2 12h20" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] text-zinc-400">app.wesponde.com/flows/builder</span>
            </div>
          </div>

          {/* ── Split view ── */}
          <div className="flex h-[420px] sm:h-[500px] lg:h-[520px]">

            {/* ════ LEFT PANEL ════ */}
            <div className="relative flex w-[42%] flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">

              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {step === 0 ? 'Template wählen' : step === 5 ? 'Flow Status' : 'Node bearbeiten'}
                </span>
                {step >= 1 && step < 5 && (
                  <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-medium text-zinc-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-indigo-400" />
                    Entwurf
                  </span>
                )}
                {step === 5 && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                    Aktiv
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-hidden p-4">

                {/* ── Template picker ── */}
                {step === 0 && (
                  <div className="space-y-2">
                    <p className="mb-3 text-[10px] text-zinc-500">Branche für Vorlage wählen:</p>
                    {[
                      { id: 'restaurant', name: 'Restaurant & Bar', desc: 'Reservierungen', color: '#6366f1' },
                      { id: 'salon',      name: 'Salon & Beauty',   desc: 'Termine',         color: '#ec4899' },
                      { id: 'praxis',     name: 'Praxis & Klinik',  desc: 'Patienten',       color: '#10b981' },
                    ].map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                          selectedTemplate === tmpl.id
                            ? 'border-indigo-500/60 bg-indigo-500/10'
                            : 'border-zinc-800 bg-zinc-900/60'
                        }`}
                      >
                        <div
                          className="h-7 w-7 flex-shrink-0 rounded-lg"
                          style={{ background: `${tmpl.color}22`, border: `1px solid ${tmpl.color}40` }}
                        >
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="h-2 w-2 rounded-full" style={{ background: tmpl.color }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-white">{tmpl.name}</p>
                          <p className="text-[10px] text-zinc-500">{tmpl.desc}</p>
                        </div>
                        {selectedTemplate === tmpl.id && <Check className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Node editor ── */}
                {step >= 1 && step <= 4 && editorNode && (
                  <div className="space-y-3">
                    {/* Type badge + label */}
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: `${editorNode.accent}22`, color: editorNode.accent }}
                      >
                        {editorNode.typeLabel}
                      </span>
                    </div>

                    {/* Node name field */}
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                      <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-zinc-600">Name</p>
                      <p className="text-[12px] font-semibold text-white">{editorNode.label}</p>
                    </div>

                    {/* Message text with typing animation */}
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                      <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">Nachricht</p>
                      <p className="min-h-[40px] text-[12px] leading-relaxed text-zinc-200">
                        {typedText}
                        <span className="ml-px inline-block h-3 w-0.5 animate-pulse bg-indigo-400 align-middle" />
                      </p>
                    </div>

                    {/* Quick replies (only for 'time' node) */}
                    {editorNode.id === 'time' && editorNode.qr && qrVisible > 0 && (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                        <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">Quick Replies</p>
                        <div className="flex flex-wrap gap-1.5">
                          {editorNode.qr.slice(0, qrVisible).map((r) => (
                            <span
                              key={r}
                              className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Live! ── */}
                {step === 5 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30">
                      <Check className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-base font-semibold text-white">Flow ist live!</p>
                    <p className="mt-1 text-[12px] text-zinc-400">4 Nodes · Automatisch aktiv</p>
                    <div className="mt-4 flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                      <span className="text-[12px] font-medium text-emerald-400">Nachrichten werden beantwortet</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom step counter */}
              {step >= 1 && step <= 4 && (
                <div className="flex items-center gap-2 border-t border-zinc-800/80 px-4 py-2.5">
                  {[1,2,3,4].map((s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        s <= step ? 'bg-indigo-500' : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[9px] text-zinc-600">{step}/4</span>
                </div>
              )}
            </div>

            {/* ════ RIGHT PANEL – Canvas ════ */}
            <div className="relative flex flex-1 flex-col overflow-hidden bg-[#070709]">
              {/* Dot grid */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />

              {/* Canvas header */}
              <div className="relative flex items-center justify-between px-4 py-2.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Flow-Canvas</span>
                <span className={`flex items-center gap-1 rounded bg-zinc-800/70 px-2 py-0.5 text-[8px] font-medium transition-colors ${step === 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <span className={`h-1 w-1 rounded-full ${step === 5 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                  {step === 5 ? 'Live' : 'Entwurf'}
                </span>
              </div>

              {/* ── Node + Connection Canvas ── */}
              <div className="relative mx-4 flex-1">
                {/* CSS for path draw animation */}
                <style>{`
                  @keyframes drawConn {
                    from { stroke-dashoffset: 200; opacity: 0; }
                    to   { stroke-dashoffset: 0;   opacity: 1; }
                  }
                  @keyframes nodeAppear {
                    from { opacity: 0; transform: translateY(10px) scale(0.93); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                  }
                  @keyframes plusPop {
                    0%   { transform: scale(0.6); opacity: 0; }
                    60%  { transform: scale(1.15); opacity: 1; }
                    100% { transform: scale(1);    opacity: 1; }
                  }
                  @keyframes qrPill {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                `}</style>

                {/* SVG connections */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                  <defs>
                    <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
                    </linearGradient>
                    <marker id="connArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <circle cx="3" cy="3" r="2.5" fill="#8b5cf6" />
                    </marker>
                  </defs>

                  {CONNS.map((conn) => {
                    const key = `${conn.from}-${conn.to}`;
                    if (!visibleConns.has(key)) return null;
                    const d = getPath(conn.from, conn.to);
                    return (
                      <path
                        key={key}
                        d={d}
                        fill="none"
                        stroke="url(#connGrad)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        markerEnd="url(#connArrow)"
                        style={{
                          strokeDasharray: 200,
                          animation: 'drawConn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        }}
                      />
                    );
                  })}

                  {/* Output handle dots (bottom of each visible node) */}
                  {CANVAS_NODES.map((node) => {
                    if (!visibleNodes.has(node.id)) return null;
                    const isLast = node.id === 'confirm';
                    return (
                      <circle
                        key={`handle-${node.id}`}
                        cx={CCX}
                        cy={node.top + NH + 1}
                        r={isLast ? 0 : 3.5}
                        fill="#6366f1"
                        opacity={0.8}
                      />
                    );
                  })}
                </svg>

                {/* Nodes */}
                {CANVAS_NODES.map((node) => {
                  if (!visibleNodes.has(node.id)) return null;
                  const cfg     = NODE_STYLE[node.type];
                  const Icon    = cfg.icon;
                  const isActive = node.id === activeNodeId;
                  const isLive   = step === 5;

                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{
                        left:   NL,
                        top:    node.top,
                        width:  NW,
                        height: NH,
                        animation: 'nodeAppear 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
                      }}
                    >
                      <div
                        className="relative flex h-full w-full items-center gap-2 overflow-hidden rounded-xl border transition-all duration-500"
                        style={{
                          background: isLive ? cfg.bg : isActive ? cfg.bg : 'rgba(255,255,255,0.04)',
                          borderColor: isActive || isLive ? `${cfg.accent}60` : 'rgba(255,255,255,0.08)',
                          boxShadow: isActive
                            ? `0 0 0 1px ${cfg.accent}30, 0 4px 20px -4px ${cfg.accent}40`
                            : isLive
                            ? `0 0 0 1px ${cfg.accent}25, 0 2px 12px -2px ${cfg.accent}30`
                            : 'none',
                        }}
                      >
                        {/* Left accent bar */}
                        <div
                          className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl transition-opacity duration-300"
                          style={{ background: cfg.accent, opacity: isActive || isLive ? 1 : 0.4 }}
                        />
                        {/* Icon */}
                        <Icon
                          className="ml-4 h-3.5 w-3.5 flex-shrink-0"
                          style={{ color: cfg.text }}
                        />
                        {/* Label */}
                        <span className="text-[11px] font-semibold text-white/90">{node.label}</span>

                        {/* Input handle (top, except trigger) */}
                        {node.id !== 'trigger' && (
                          <div
                            className="absolute -top-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-zinc-900"
                            style={{ background: cfg.accent }}
                          />
                        )}
                      </div>

                      {/* Quick Reply pills on canvas (below time node) */}
                      {node.id === 'time' && qrVisible > 0 && (
                        <div
                          className="absolute left-0 flex flex-wrap gap-1 pt-1.5"
                          style={{ top: NH }}
                        >
                          {QR_REPLIES.slice(0, qrVisible).map((r, i) => (
                            <span
                              key={r}
                              className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[9px] font-medium text-violet-300"
                              style={{ animation: `qrPill 0.4s ease ${i * 50}ms both` }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* "+" add-node button between steps */}
                {showPlus && (() => {
                  const node = CANVAS_NODES.find((n) => n.id === showPlus);
                  if (!node) return null;
                  // Show below the node, or below QR pills for time
                  const extraY = showPlus === 'time' ? 28 : 0;
                  const btnY = node.top + NH + 8 + extraY;
                  return (
                    <div
                      className="absolute flex items-center justify-center"
                      style={{
                        left:      CCX - 10,
                        top:       btnY,
                        animation: 'plusPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
                      }}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-indigo-500/60 bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.4)]">
                        <Plus className="h-2.5 w-2.5 text-indigo-400" />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Canvas bottom status bar ── */}
              <div
                className={`mx-4 mb-3 rounded-lg border px-3 py-2 text-center transition-all duration-500 ${
                  step === 5
                    ? 'border-emerald-500/30 bg-emerald-500/8'
                    : 'border-zinc-800/60 bg-zinc-900/40'
                }`}
              >
                <p className={`text-[10px] font-medium ${step === 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {step === 5
                    ? '4 Nodes verbunden · Flow ist aktiv'
                    : step === 0
                    ? 'Wähle eine Vorlage, um zu starten'
                    : `${visibleNodes.size} von 4 Nodes erstellt`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Laptop base ── */}
        <div className="relative mx-auto h-4 w-[80%] rounded-b-xl bg-gradient-to-b from-zinc-700 to-zinc-800">
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-b bg-zinc-600/60" />
        </div>
        <div className="mx-auto h-1.5 w-[90%] rounded-b-lg bg-zinc-800/80 shadow-2xl" />
      </div>

      {/* ── Feature pills ── */}
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {['Drag & Drop', 'Branchen-Templates', 'Quick Replies', 'Keine Programmierung'].map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-medium text-zinc-400"
          >
            <Check className="h-3 w-3 text-emerald-500" />
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
