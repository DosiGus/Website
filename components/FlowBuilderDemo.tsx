'use client';

import { useEffect, useState } from 'react';
import { Check, MessageSquare, Zap, Clock, Plus, Layers, Wand2, FilePlus } from 'lucide-react';

/* ════════════════════════════════════════════
   LAYOUT
   ════════════════════════════════════════════ */

const NW  = 158;
const NH  = 38;
const NL  = 141;
const CCX = NL + NW / 2;
const QRH = 22;

type NodeType = 'trigger' | 'message' | 'reply';

const CANVAS_NODES = [
  { id: 'trigger', label: 'DM Eingang',     type: 'trigger' as NodeType, top: 6   },
  { id: 'welcome', label: 'Begrüßung',      type: 'message' as NodeType, top: 64  },
  { id: 'persons', label: 'Personenanzahl', type: 'reply'   as NodeType, top: 122 },
  { id: 'time',    label: 'Uhrzeit wählen', type: 'reply'   as NodeType, top: 210 },
  { id: 'confirm', label: 'Bestätigung',    type: 'message' as NodeType, top: 294 },
] as const;

const CONNS = [
  { from: 'trigger', to: 'welcome' },
  { from: 'welcome', to: 'persons' },
  { from: 'persons', to: 'time'    },
  { from: 'time',    to: 'confirm' },
];

const QR_PERSONS = ['1', '2', '3', '4+'];
const QR_TIME    = ['18:00', '19:00', '20:00'];

const NODE_ICONS: Record<NodeType, React.ElementType> = {
  trigger: Zap,
  message: MessageSquare,
  reply:   Clock,
};

const EDITOR_NODES = [
  {
    id: 'trigger',
    type: 'trigger' as NodeType,
    label: 'DM Eingang',
    text: 'Jede eingehende Instagram DM startet diesen Flow automatisch.',
  },
  {
    id: 'welcome',
    type: 'message' as NodeType,
    label: 'Begrüßung',
    text: 'Hallo! Ich helfe dir gerne bei deiner Reservierung.',
  },
  {
    id: 'persons',
    type: 'reply' as NodeType,
    label: 'Personenanzahl',
    text: 'Für wie viele Personen darf ich reservieren?',
    qr: ['1 Person', '2 Personen', '3–4 Personen', '5+'],
  },
  {
    id: 'time',
    type: 'reply' as NodeType,
    label: 'Uhrzeit wählen',
    text: 'Zu welcher Uhrzeit möchtest du kommen?',
    qr: ['18:00 Uhr', '19:00 Uhr', '20:00 Uhr'],
  },
  {
    id: 'confirm',
    type: 'message' as NodeType,
    label: 'Bestätigung',
    text: 'Perfekt! Tisch für {{persons}} um {{time}} Uhr ist reserviert. Bis bald!',
  },
];

const CREATION_OPTIONS = [
  {
    id: 'template',
    icon: Layers,
    label: 'Branchentemplate',
    desc: 'Starte mit einem vorgefertigten Template für deine Branche.',
  },
  {
    id: 'wizard',
    icon: Wand2,
    label: 'Setup-Assistent',
    desc: 'Schritt-für-Schritt durch den Aufbau deines ersten Flows.',
  },
  {
    id: 'blank',
    icon: FilePlus,
    label: 'Leerer Flow',
    desc: 'Erstelle deinen Flow von Grund auf – ohne Vorlage.',
  },
];

/* ════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════ */

export default function FlowBuilderDemo() {
  // step 0 = creation options, step 1 = template picker, step 2–6 = nodes, step 7 = live
  const [step,              setStep]              = useState(0);
  const [selectedCreation,  setSelectedCreation]  = useState<string | null>(null);
  const [selectedTemplate,  setSelectedTemplate]  = useState<string | null>(null);
  const [visibleNodes,      setVisibleNodes]      = useState<Set<string>>(new Set());
  const [visibleConns,      setVisibleConns]      = useState<Set<string>>(new Set());
  const [activeNodeId,      setActiveNodeId]      = useState<string | null>(null);
  const [qrPersonsVisible,  setQrPersonsVisible]  = useState(0);
  const [qrTimeVisible,     setQrTimeVisible]     = useState(0);
  const [typedText,         setTypedText]         = useState('');
  const [showPlus,          setShowPlus]          = useState<string | null>(null);
  const [cycleKey,          setCycleKey]          = useState(0);

  /* Typing effect */
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
    }, 34);
    return () => clearInterval(iv);
  }, [activeNodeId]);

  /* Animation sequence */
  useEffect(() => {
    setStep(0);
    setSelectedCreation(null);
    setSelectedTemplate(null);
    setVisibleNodes(new Set());
    setVisibleConns(new Set());
    setActiveNodeId(null);
    setQrPersonsVisible(0);
    setQrTimeVisible(0);
    setShowPlus(null);
    setTypedText('');

    const t = (ms: number, fn: () => void) => setTimeout(fn, ms);
    const touts: ReturnType<typeof setTimeout>[] = [];

    // Phase 0: creation options → pick Template
    touts.push(t(1400, () => setSelectedCreation('template')));

    // Phase 1: template picker
    touts.push(t(3800, () => setStep(1)));
    touts.push(t(5600, () => setSelectedTemplate('restaurant')));

    // Phase 2: trigger node
    touts.push(t(7600, () => {
      setStep(2);
      setVisibleNodes(new Set(['trigger']));
      setActiveNodeId('trigger');
    }));
    touts.push(t(10000, () => setShowPlus('trigger')));

    // Phase 3: Begrüßung
    touts.push(t(11800, () => {
      setShowPlus(null);
      setStep(3);
      setVisibleNodes(new Set(['trigger', 'welcome']));
      setVisibleConns(new Set(['trigger-welcome']));
      setActiveNodeId('welcome');
    }));
    touts.push(t(14400, () => setShowPlus('welcome')));

    // Phase 4: Personenanzahl
    touts.push(t(16400, () => {
      setShowPlus(null);
      setStep(4);
      setVisibleNodes(new Set(['trigger', 'welcome', 'persons']));
      setVisibleConns(new Set(['trigger-welcome', 'welcome-persons']));
      setActiveNodeId('persons');
    }));
    touts.push(t(18200, () => setQrPersonsVisible(1)));
    touts.push(t(19000, () => setQrPersonsVisible(2)));
    touts.push(t(19800, () => setQrPersonsVisible(3)));
    touts.push(t(20600, () => setQrPersonsVisible(4)));
    touts.push(t(21400, () => setShowPlus('persons')));

    // Phase 5: Uhrzeit
    touts.push(t(23400, () => {
      setShowPlus(null);
      setStep(5);
      setVisibleNodes(new Set(['trigger', 'welcome', 'persons', 'time']));
      setVisibleConns(new Set(['trigger-welcome', 'welcome-persons', 'persons-time']));
      setActiveNodeId('time');
    }));
    touts.push(t(25200, () => setQrTimeVisible(1)));
    touts.push(t(26200, () => setQrTimeVisible(2)));
    touts.push(t(27200, () => setQrTimeVisible(3)));
    touts.push(t(28000, () => setShowPlus('time')));

    // Phase 6: Bestätigung
    touts.push(t(30000, () => {
      setShowPlus(null);
      setStep(6);
      setVisibleNodes(new Set(['trigger', 'welcome', 'persons', 'time', 'confirm']));
      setVisibleConns(new Set(['trigger-welcome', 'welcome-persons', 'persons-time', 'time-confirm']));
      setActiveNodeId('confirm');
    }));

    // Phase 7: Live
    touts.push(t(36000, () => {
      setStep(7);
      setActiveNodeId(null);
      setShowPlus(null);
    }));

    // Restart
    touts.push(t(44000, () => setCycleKey((k) => k + 1)));
    return () => touts.forEach(clearTimeout);
  }, [cycleKey]);

  const editorNode   = EDITOR_NODES.find((n) => n.id === activeNodeId) ?? null;
  const buildingStep = step >= 2 && step <= 6 ? step - 1 : 0; // 1–5

  const outputY = (id: string) => {
    const node = CANVAS_NODES.find((n) => n.id === id);
    if (!node) return 0;
    return (id === 'persons' || id === 'time') ? node.top + NH + QRH : node.top + NH;
  };

  const getPath = (fromId: string, toId: string) => {
    const from = CANVAS_NODES.find((n) => n.id === fromId);
    const to   = CANVAS_NODES.find((n) => n.id === toId);
    if (!from || !to) return '';
    const y1 = outputY(fromId);
    const y2 = to.top;
    const cp = (y2 - y1) * 0.5;
    return `M ${CCX} ${y1} C ${CCX} ${y1 + cp} ${CCX} ${y2 - cp} ${CCX} ${y2}`;
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="relative">

        {/* Browser chrome */}
        <div className="overflow-hidden rounded-t-xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/70">
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-zinc-900 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-white/[0.04] px-3 py-1">
              <svg className="h-3 w-3 flex-shrink-0 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 010 20M2 12h20" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] text-zinc-500">app.wesponde.com/flows/builder</span>
            </div>
          </div>

          {/* Split layout */}
          <div className="flex h-[420px] sm:h-[500px] lg:h-[520px]">

            {/* ═══ LEFT PANEL ═══ */}
            <div className="relative flex w-[42%] flex-shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950">

              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  {step === 0 ? 'Flow erstellen' : step === 1 ? 'Vorlage wählen' : step === 7 ? 'Flow Status' : 'Node bearbeiten'}
                </span>
                {step >= 2 && step < 7 && (
                  <span className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium text-zinc-600">
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    Entwurf
                  </span>
                )}
                {step === 7 && (
                  <span className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium text-zinc-300">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    Aktiv
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-hidden p-4">

                {/* ── Creation options ── */}
                {step === 0 && (
                  <div className="space-y-2">
                    <p className="mb-3 text-[10px] text-zinc-600">Wie möchtest du starten?</p>
                    {CREATION_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = selectedCreation === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                            isSelected
                              ? 'border-indigo-500/30 bg-indigo-500/[0.06]'
                              : 'border-white/[0.06] bg-white/[0.02]'
                          }`}
                        >
                          <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-500 ${
                            isSelected
                              ? 'border border-indigo-500/30 bg-indigo-500/[0.15]'
                              : 'border border-white/[0.07] bg-white/[0.04]'
                          }`}>
                            <Icon className={`h-3.5 w-3.5 transition-colors duration-500 ${isSelected ? 'text-indigo-300' : 'text-zinc-600'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[12px] font-semibold transition-colors duration-500 ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                              {opt.label}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-600">{opt.desc}</p>
                          </div>
                          {isSelected && <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Template picker ── */}
                {step === 1 && (
                  <div className="space-y-2">
                    <p className="mb-3 text-[10px] text-zinc-600">Branche für Vorlage wählen:</p>
                    {[
                      { id: 'restaurant', name: 'Restaurant & Bar', desc: 'Reservierungen' },
                      { id: 'salon',      name: 'Salon & Beauty',   desc: 'Termine' },
                      { id: 'praxis',     name: 'Praxis & Klinik',  desc: 'Patienten' },
                    ].map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                          selectedTemplate === tmpl.id
                            ? 'border-indigo-500/30 bg-indigo-500/[0.06]'
                            : 'border-white/[0.06] bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04]">
                          <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${selectedTemplate === tmpl.id ? 'bg-indigo-400' : 'bg-zinc-600'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[12px] font-semibold transition-colors duration-500 ${selectedTemplate === tmpl.id ? 'text-white' : 'text-zinc-400'}`}>
                            {tmpl.name}
                          </p>
                          <p className="text-[10px] text-zinc-600">{tmpl.desc}</p>
                        </div>
                        {selectedTemplate === tmpl.id && <Check className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Node inspector ── */}
                {step >= 2 && step <= 6 && editorNode && (
                  <div className="space-y-3">
                    <span className="inline-block rounded-full bg-indigo-500/[0.15] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-300">
                      {editorNode.type === 'trigger' ? 'Trigger' : editorNode.type === 'reply' ? 'Quick Reply' : 'Nachricht'}
                    </span>

                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                      <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-zinc-600">Name</p>
                      <p className="text-[12px] font-semibold text-zinc-200">{editorNode.label}</p>
                    </div>

                    <div className="rounded-lg border border-indigo-500/[0.15] bg-indigo-500/[0.04] px-3 py-2">
                      <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">Nachricht</p>
                      <p className="min-h-[40px] text-[12px] leading-relaxed text-zinc-300">
                        {typedText}
                        <span className="ml-px inline-block h-3 w-0.5 animate-pulse bg-indigo-400 align-middle" />
                      </p>
                    </div>

                    {'qr' in editorNode && editorNode.qr && (
                      (() => {
                        const visible = editorNode.id === 'persons' ? qrPersonsVisible : editorNode.id === 'time' ? qrTimeVisible : 0;
                        return visible > 0 ? (
                          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                            <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">Quick Replies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {editorNode.qr.slice(0, visible).map((r) => (
                                <span key={r} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>
                )}

                {/* ── Live state ── */}
                {step === 7 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05]">
                      <Check className="h-6 w-6 text-white/60" />
                    </div>
                    <p className="text-sm font-semibold text-white">Flow ist live!</p>
                    <p className="mt-1 text-[12px] text-zinc-500">5 Nodes · Automatisch aktiv</p>
                    <div className="mt-4 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      <span className="text-[12px] font-medium text-zinc-400">Nachrichten werden beantwortet</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {step >= 2 && step <= 6 && (
                <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                        s <= buildingStep ? 'bg-zinc-400' : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[9px] text-zinc-600">{buildingStep}/5</span>
                </div>
              )}
            </div>

            {/* ═══ CANVAS ═══ */}
            <div className="relative flex flex-1 flex-col overflow-hidden bg-[#080809]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />

              {/* Canvas header */}
              <div className="relative flex items-center justify-between px-4 py-2.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-700">Flow-Canvas</span>
                <span className={`flex items-center gap-1 rounded bg-white/[0.04] px-2 py-0.5 text-[8px] font-medium transition-colors ${step === 7 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  <span className={`h-1 w-1 rounded-full ${step === 7 ? 'animate-pulse bg-emerald-400' : 'bg-zinc-700'}`} />
                  {step === 7 ? 'Live' : 'Entwurf'}
                </span>
              </div>

              <style>{`
                @keyframes drawConn {
                  from { stroke-dashoffset: 200; opacity: 0; }
                  to   { stroke-dashoffset: 0;   opacity: 1; }
                }
                @keyframes nodeAppear {
                  from { opacity: 0; transform: translateY(8px) scale(0.96); }
                  to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
                @keyframes plusPop {
                  0%   { transform: scale(0.6); opacity: 0; }
                  60%  { transform: scale(1.2);  opacity: 1; }
                  100% { transform: scale(1);    opacity: 1; }
                }
                @keyframes qrPill {
                  from { opacity: 0; transform: translateY(4px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <div className="relative mx-4 flex-1">

                {/* SVG connections */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                  <defs>
                    <marker id="connDot" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <circle cx="3" cy="3" r="2" fill="rgba(255,255,255,0.2)" />
                    </marker>
                  </defs>
                  {CONNS.map((conn) => {
                    const key = `${conn.from}-${conn.to}`;
                    if (!visibleConns.has(key)) return null;
                    return (
                      <path
                        key={key}
                        d={getPath(conn.from, conn.to)}
                        fill="none"
                        stroke="rgba(255,255,255,0.13)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        markerEnd="url(#connDot)"
                        style={{ strokeDasharray: 200, animation: 'drawConn 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
                      />
                    );
                  })}
                  {CANVAS_NODES.map((node) => {
                    if (!visibleNodes.has(node.id) || node.id === 'confirm') return null;
                    return (
                      <circle key={`out-${node.id}`} cx={CCX} cy={outputY(node.id)} r={2.5} fill="rgba(255,255,255,0.18)" />
                    );
                  })}
                </svg>

                {/* Nodes */}
                {CANVAS_NODES.map((node) => {
                  if (!visibleNodes.has(node.id)) return null;
                  const Icon    = NODE_ICONS[node.type];
                  const isActive = node.id === activeNodeId;
                  const isLive   = step === 7;

                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{ left: NL, top: node.top, width: NW, height: NH, animation: 'nodeAppear 0.45s cubic-bezier(0.16,1,0.3,1) forwards' }}
                    >
                      <div
                        className="relative flex h-full w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 transition-all duration-500"
                        style={{
                          background: isActive ? 'rgba(99,102,241,0.07)' : isLive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isActive ? 'rgba(99,102,241,0.35)' : isLive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: isActive ? 'inset 0 0 0 1px rgba(99,102,241,0.1), 0 4px 16px rgba(0,0,0,0.3)' : 'none',
                        }}
                      >
                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isActive ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          <Icon className={`h-2.5 w-2.5 transition-colors duration-500 ${isActive ? 'text-indigo-300' : 'text-zinc-500'}`} />
                        </div>

                        <span className={`flex-1 text-[11px] font-semibold transition-colors duration-500 ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                          {node.label}
                        </span>
                      </div>

                      {node.id !== 'trigger' && (
                        <div
                          className="absolute -top-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-[#080809]"
                          style={{ background: isActive ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.18)' }}
                        />
                      )}

                      {/* QR pills — persons */}
                      {node.id === 'persons' && qrPersonsVisible > 0 && (
                        <div className="absolute left-0 flex flex-wrap gap-1 pt-1.5" style={{ top: NH }}>
                          {QR_PERSONS.slice(0, qrPersonsVisible).map((r, i) => (
                            <span
                              key={r}
                              className="rounded-full px-2 py-0.5 text-[9px] font-medium text-zinc-400"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', animation: `qrPill 0.35s ease ${i * 50}ms both` }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* QR pills — time */}
                      {node.id === 'time' && qrTimeVisible > 0 && (
                        <div className="absolute left-0 flex flex-wrap gap-1 pt-1.5" style={{ top: NH }}>
                          {QR_TIME.slice(0, qrTimeVisible).map((r, i) => (
                            <span
                              key={r}
                              className="rounded-full px-2 py-0.5 text-[9px] font-medium text-zinc-400"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', animation: `qrPill 0.35s ease ${i * 55}ms both` }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* + button */}
                {showPlus && (() => {
                  const node = CANVAS_NODES.find((n) => n.id === showPlus);
                  if (!node) return null;
                  const hasQr = showPlus === 'persons' || showPlus === 'time';
                  const btnY  = node.top + NH + 6 + (hasQr ? QRH : 0);
                  return (
                    <div
                      className="absolute flex items-center justify-center"
                      style={{ left: CCX - 10, top: btnY, animation: 'plusPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                    >
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)' }}
                      >
                        <Plus className="h-2.5 w-2.5 text-zinc-400" />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Canvas status bar */}
              <div
                className={`mx-4 mb-3 rounded-lg px-3 py-2 text-center transition-all duration-500 ${
                  step === 7
                    ? 'border border-indigo-500/[0.2] bg-indigo-500/[0.05]'
                    : 'border border-white/[0.05] bg-white/[0.02]'
                }`}
              >
                <p className={`text-[10px] font-medium ${step === 7 ? 'text-indigo-300/80' : 'text-zinc-600'}`}>
                  {step === 7
                    ? '5 Nodes verbunden · Flow ist aktiv'
                    : step <= 1
                    ? 'Canvas ist bereit'
                    : `${visibleNodes.size} von 5 Nodes erstellt`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop base */}
        <div className="relative mx-auto h-4 w-[80%] rounded-b-xl bg-gradient-to-b from-zinc-700 to-zinc-800">
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-b bg-zinc-600/60" />
        </div>
        <div className="mx-auto h-1.5 w-[90%] rounded-b-lg bg-zinc-800/80 shadow-2xl" />
      </div>

      {/* Feature pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {['Drag & Drop', 'Branchen-Templates', 'Quick Replies', 'Keine Programmierung'].map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur-sm"
          >
            <Check className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
