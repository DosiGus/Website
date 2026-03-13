'use client';

import { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Layers,
  MessageCircle,
  MessageSquare,
  Pencil,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

type NodeKind = 'trigger' | 'message' | 'reply';
type Phase = 'setup-start' | 'template-select' | 'build';

type CanvasNode = {
  id: string;
  label: string;
  kind: NodeKind;
  top: number;
  icon?: LucideIcon;
};

type InspectorNode = {
  id: string;
  label: string;
  kind: NodeKind;
  text: string;
  replies?: string[];
};

type StageConfig = {
  phase: Phase;
  activeNodeId: string;
  visibleNodeIds: string[];
  status: 'Entwurf' | 'Aktiv';
  footer: string;
  urlPath: string;
};

const NODE_WIDTH = 204;
const NODE_HEIGHT = 52;
const NODE_LEFT = 146;
const NODE_CENTER = NODE_LEFT + NODE_WIDTH / 2;

const CANVAS_NODES: CanvasNode[] = [
  { id: 'trigger', label: 'Trigger',        kind: 'trigger', top: 8  },
  { id: 'welcome', label: 'Begrüßung',      kind: 'message', top: 72 },
  { id: 'persons', label: 'Personenanzahl', kind: 'reply',   top: 136, icon: Users },
  { id: 'time',    label: 'Uhrzeit wählen', kind: 'reply',   top: 200 },
  { id: 'confirm', label: 'Bestätigung',    kind: 'message', top: 264 },
];

const INSPECTOR_NODES: InspectorNode[] = [
  {
    id: 'trigger',
    label: 'Trigger',
    kind: 'trigger',
    text: 'Startet den Flow, sobald eine Nachricht eingeht.',
  },
  {
    id: 'welcome',
    label: 'Begrüßung',
    kind: 'message',
    text: 'Hallo! Ich helfe gerne bei deiner Reservierung und frage die wichtigsten Details direkt ab.',
  },
  {
    id: 'persons',
    label: 'Personenanzahl',
    kind: 'reply',
    text: 'Für wie viele Personen darf ich reservieren?',
    replies: ['1 Person', '2 Personen', '3–4 Personen', '5+'],
  },
  {
    id: 'time',
    label: 'Uhrzeit wählen',
    kind: 'reply',
    text: 'Welche Uhrzeit passt am besten?',
    replies: ['18:00 Uhr', '19:00 Uhr', '20:00 Uhr'],
  },
  {
    id: 'confirm',
    label: 'Bestätigung',
    kind: 'message',
    text: 'Dein Tisch für 2 Personen um 19:00 Uhr ist reserviert – der Eintrag ist direkt in deinem Kalender',
  },
];

const STAGES: StageConfig[] = [
  {
    phase: 'setup-start',
    activeNodeId: '',
    visibleNodeIds: [],
    status: 'Entwurf',
    footer: 'Startmethode wählen und Flow-Typ festlegen.',
    urlPath: 'flows/new',
  },
  {
    phase: 'template-select',
    activeNodeId: '',
    visibleNodeIds: [],
    status: 'Entwurf',
    footer: 'Branchentemplate ausgewählt – Vorlage wird geladen.',
    urlPath: 'flows/builder',
  },
  {
    phase: 'build',
    activeNodeId: 'trigger',
    visibleNodeIds: ['trigger'],
    status: 'Entwurf',
    footer: 'Trigger eingerichtet – wartet auf eingehende Nachrichten.',
    urlPath: 'flows/builder',
  },
  {
    phase: 'build',
    activeNodeId: 'welcome',
    visibleNodeIds: ['trigger', 'welcome'],
    status: 'Entwurf',
    footer: 'Vorlage geladen und Begrüßung vorbereitet.',
    urlPath: 'flows/builder',
  },
  {
    phase: 'build',
    activeNodeId: 'persons',
    visibleNodeIds: ['trigger', 'welcome', 'persons'],
    status: 'Entwurf',
    footer: 'Quick Replies werden für die wichtigsten Antworten ergänzt.',
    urlPath: 'flows/builder',
  },
  {
    phase: 'build',
    activeNodeId: 'time',
    visibleNodeIds: ['trigger', 'welcome', 'persons', 'time'],
    status: 'Entwurf',
    footer: 'Der Ablauf verknüpft Antworten direkt mit dem nächsten Schritt.',
    urlPath: 'flows/builder',
  },
  {
    phase: 'build',
    activeNodeId: 'confirm',
    visibleNodeIds: ['trigger', 'welcome', 'persons', 'time', 'confirm'],
    status: 'Aktiv',
    footer: 'Flow ist bereit und kann Anfragen sofort strukturiert beantworten.',
    urlPath: 'flows/builder',
  },
];

const KIND_LABELS: Record<NodeKind, string> = {
  trigger: 'Eingangsnachricht',
  message: 'Nachricht',
  reply: 'Quick Reply',
};

const NODE_ICONS: Record<NodeKind, LucideIcon> = {
  trigger: Zap,
  message: MessageSquare,
  reply: Clock,
};

function getKindBadge(kind: NodeKind, isLight: boolean) {
  if (isLight) {
    if (kind === 'trigger') return 'border-[#b9dfc8] bg-[#eef9f1] text-[#2e7d57]';
    if (kind === 'reply')   return 'border-[#cad4f5] bg-[#eef2ff] text-[#556fb8]';
    return 'border-[#d7dcee] bg-white/75 text-[#59627d]';
  }
  if (kind === 'trigger') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  if (kind === 'reply')   return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300';
  return 'border-white/10 bg-white/[0.04] text-zinc-300';
}

const START_OPTIONS = [
  {
    icon: Layers,
    title: 'Branchentemplate',
    desc: 'Starte mit einem vorgefertigten Template für deine Branche.',
  },
  {
    icon: Pencil,
    title: 'Setup-Assistent',
    desc: 'Schritt-für-Schritt durch den Aufbau deines ersten Flows.',
  },
  {
    icon: FileText,
    title: 'Leerer Flow',
    desc: 'Erstelle deinen Flow von Grund auf – ohne Vorlage.',
  },
];

const BRANCH_OPTIONS = [
  { title: 'Restaurant & Gastronomie', desc: 'Reservierungen, Tischbuchungen und Anfragen.' },
  { title: 'Beauty & Kosmetik',        desc: 'Terminbuchungen, Beratungen und Angebote.' },
  { title: 'Fitness & Sport',          desc: 'Kursbuchungen, Mitglieder und Anfragen.' },
];

export default function FlowBuilderDemo({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const isLight = theme === 'light';
  const [stageIndex, setStageIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  const stage = STAGES[stageIndex];
  const inspectorNode = INSPECTOR_NODES.find((n) => n.id === stage.activeNodeId) ?? INSPECTOR_NODES[0];

  useEffect(() => {
    const t = window.setInterval(() => setStageIndex((c) => (c + 1) % STAGES.length), 4400);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (stage.phase !== 'setup-start') { setSelectedOption(null); return; }
    setSelectedOption(null);
    const t = window.setTimeout(() => setSelectedOption(0), 650);
    return () => window.clearTimeout(t);
  }, [stageIndex, stage.phase]);

  useEffect(() => {
    if (stage.phase !== 'template-select') { setSelectedBranch(null); return; }
    setSelectedBranch(null);
    const t = window.setTimeout(() => setSelectedBranch(0), 650);
    return () => window.clearTimeout(t);
  }, [stageIndex, stage.phase]);

  useEffect(() => {
    if (stage.phase !== 'build' || inspectorNode.kind === 'trigger') return;
    setTypedText('');
    let i = 0;
    const full = inspectorNode.text;
    const t = window.setInterval(() => {
      i += 1;
      setTypedText(full.slice(0, i));
      if (i >= full.length) window.clearInterval(t);
    }, 28);
    return () => window.clearInterval(t);
  }, [inspectorNode.id, inspectorNode.text, inspectorNode.kind, stage.phase]);

  useEffect(() => {
    if (inspectorNode.kind !== 'trigger') { setTriggerWord(''); return; }
    setTriggerWord('');
    const word = 'reservieren';
    let i = 0;
    const delay = window.setTimeout(() => {
      const t = window.setInterval(() => {
        i += 1;
        setTriggerWord(word.slice(0, i));
        if (i >= word.length) window.clearInterval(t);
      }, 110);
      return () => window.clearInterval(t);
    }, 800);
    return () => window.clearTimeout(delay);
  }, [inspectorNode.kind]);

  // Shared theme tokens
  const mutedText  = isLight ? 'text-[#67718a]' : 'text-zinc-300';
  const strongText = isLight ? 'text-[#172033]' : 'text-white';
  const subtleBord = isLight ? 'border-black/8' : 'border-white/[0.08]';
  const footerCls  = isLight
    ? 'border-t border-black/8 bg-white/42'
    : 'border-t border-white/[0.06] bg-white/[0.02]';

  // ── Canvas nodes (shared) ───────────────────────────────────────────
  const renderCanvasNodes = () =>
    CANVAS_NODES.map((node, index) => {
      const isVisible = stage.visibleNodeIds.includes(node.id);
      const isActive  = node.id === stage.activeNodeId;
      const Icon      = node.icon ?? NODE_ICONS[node.kind];
      const nextNode  = CANVAS_NODES[index + 1];
      const showConn  = Boolean(nextNode && stage.visibleNodeIds.includes(nextNode.id));

      return (
        <div key={node.id}>
          <div
            className="absolute transition-all duration-700"
            style={{
              left: NODE_LEFT, top: node.top, width: NODE_WIDTH,
              opacity:   isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
            }}
          >
            <div
              className={`rounded-2xl border px-3.5 py-2.5 transition-all duration-500 ${
                isActive
                  ? isLight
                    ? 'border-[#98addf] bg-[#edf3ff] shadow-[0_12px_28px_rgba(80,104,170,0.12)]'
                    : 'border-indigo-500/30 bg-indigo-500/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.35)]'
                  : isLight
                  ? 'border-[#d8deef] bg-white/82 shadow-[0_4px_12px_rgba(53,69,112,0.05)]'
                  : 'border-white/[0.08] bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border ${
                    isActive
                      ? isLight
                        ? 'border-[#c6d2f0] bg-white/90 text-[#5570b9]'
                        : 'border-indigo-500/25 bg-indigo-500/[0.14] text-indigo-300'
                      : isLight
                      ? 'border-[#dde4f2] bg-[#f4f7ff] text-[#6f7f9e]'
                      : 'border-white/[0.08] bg-white/[0.05] text-zinc-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-semibold leading-tight ${isLight ? 'text-[#172033]' : 'text-white'}`}>
                    {node.label}
                  </p>
                  <p className={`text-[10px] ${isLight ? 'text-[#6a7590]' : 'text-zinc-400'}`}>
                    {KIND_LABELS[node.kind]}
                  </p>
                </div>
                {isActive && (
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${isLight ? 'bg-[#7d91c4]' : 'bg-indigo-400'}`} />
                    <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${isLight ? 'bg-[#9eb0db]' : 'bg-indigo-300'}`} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {showConn && nextNode && (
            <div
              className="absolute transition-all duration-700"
              style={{
                left: NODE_CENTER - 1, top: node.top + NODE_HEIGHT,
                height: nextNode.top - (node.top + NODE_HEIGHT), width: 2,
              }}
            >
              <div className={`mx-auto h-full w-full rounded-full ${isLight ? 'bg-[#cbd6ee]' : 'bg-white/[0.12]'}`} />
              <div className={`absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border ${
                isLight ? 'border-[#dce4f4] bg-white' : 'border-[#080809] bg-white/[0.14]'
              }`} />
            </div>
          )}
        </div>
      );
    });

  // ── Progress footer (shared) ────────────────────────────────────────
  const renderFooter = (totalSteps = STAGES.length) => (
    <div className={`relative px-5 py-3 ${footerCls}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= stageIndex
                  ? isLight ? 'w-6 bg-[#6a7fbb]' : 'w-6 bg-zinc-300'
                  : isLight ? 'w-4 bg-[#d5dcee]'  : 'w-4 bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <p className={`text-[11px] font-medium ${mutedText}`}>
          {stageIndex + 1} von {totalSteps} Schritten
        </p>
      </div>
    </div>
  );

  // ── Light theme: left panel content ────────────────────────────────
  const renderLightLeftPanel = () => {
    if (stage.phase === 'setup-start') {
      return (
        <div className="flex flex-1 flex-col p-4">
          <p className={`mb-3 text-[12px] font-medium ${mutedText}`}>Wie möchtest du starten?</p>
          <div className="flex flex-col gap-2">
            {START_OPTIONS.map((opt, i) => {
              const Icon = opt.icon;
              const isSelected = selectedOption === i;
              return (
                <div
                  key={opt.title}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                    isSelected
                      ? 'border-[#98addf] bg-[#edf3ff]'
                      : `${subtleBord} bg-white/50`
                  }`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-500 ${
                    isSelected ? 'bg-[#dce8ff] text-[#4f68a6]' : 'bg-white/80 text-[#7a88a4]'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] font-semibold ${strongText}`}>{opt.title}</p>
                    <p className={`mt-0.5 text-[11px] leading-snug ${mutedText}`}>{opt.desc}</p>
                  </div>
                  <div className={`mt-0.5 transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <Check className="h-4 w-4 shrink-0 text-[#4f68a6]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (stage.phase === 'template-select') {
      return (
        <>
          {/* Compact start method strip */}
          <div className={`flex items-center gap-2.5 border-b px-5 py-2.5 ${subtleBord} bg-[#edf3ff]/50`}>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#dce8ff] text-[#4f68a6]">
              <Layers className="h-3 w-3" />
            </div>
            <p className={`flex-1 text-[12px] font-semibold ${strongText}`}>Branchentemplate</p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#c8d4f4] bg-[#eef2ff] px-2 py-0.5 text-[9px] font-semibold text-[#4f68a6]">
              <Check className="h-2.5 w-2.5" />
              Ausgewählt
            </span>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <p className={`mb-3 text-[12px] font-medium ${mutedText}`}>Für welche Branche?</p>
            <div className="flex flex-col gap-2">
              {BRANCH_OPTIONS.map((opt, i) => {
                const isSelected = selectedBranch === i;
                return (
                  <div
                    key={opt.title}
                    className={`rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                      isSelected
                        ? 'border-[#98addf] bg-[#edf3ff]'
                        : `${subtleBord} bg-white/50`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[12px] font-semibold ${strongText}`}>{opt.title}</p>
                      <div className={`transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#4f68a6]" />
                      </div>
                    </div>
                    <p className={`mt-0.5 text-[11px] leading-snug ${mutedText}`}>{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      );
    }

    // phase === 'build'
    return (
      <>
        {/* Compact template strip */}
        <div className={`flex items-center gap-2.5 border-b px-5 py-2.5 ${subtleBord} bg-[#f8f4ec]/50`}>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4f68a6]">
            <Layers className="h-3 w-3" />
          </div>
          <p className={`flex-1 truncate text-[12px] font-semibold ${strongText}`}>
            Restaurant Reservierungen
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#c8d4f4] bg-[#eef2ff] px-2 py-0.5 text-[9px] font-semibold text-[#4f68a6]">
            <Check className="h-2.5 w-2.5" />
            Ausgewählt
          </span>
        </div>

        {/* Inspector */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className={`rounded-2xl border p-4 ${subtleBord} bg-white/76`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${mutedText}`}>
                  Aktueller Schritt
                </p>
                <p className={`mt-1 text-[15px] font-semibold ${strongText}`}>{inspectorNode.label}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getKindBadge(inspectorNode.kind, isLight)}`}>
                {KIND_LABELS[inspectorNode.kind]}
              </span>
            </div>

            {inspectorNode.kind === 'trigger' ? (
              <>
                <div className="mt-3 rounded-xl border border-[#dbe4f6] bg-[#f5f8ff] p-3">
                  <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
                    Trigger-Typ
                  </p>
                  <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${subtleBord} bg-white/80`}>
                    <Zap className="h-3 w-3 text-[#5570b9]" />
                    <span className="text-[12px] font-medium text-[#36415f]">Schlüsselwort enthält</span>
                  </div>
                  <p className={`mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
                    Schlüsselwort eingeben
                  </p>
                  <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${subtleBord} bg-white/90`}>
                    <span className="text-[12px] text-[#36415f]">
                      {triggerWord || <span className="text-[#b0b8cc]">z.B. reservieren</span>}
                    </span>
                    <span className="inline-block h-3.5 w-0.5 animate-pulse bg-[#5b74b6]" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
                    Schlüsselwörter
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['reservieren', 'tisch', 'buchung'].map((kw) => (
                      <span key={kw} className="rounded-full border border-[#d7dcee] bg-white/85 px-2.5 py-1 text-[11px] font-medium text-[#43506b]">
                        {kw}
                      </span>
                    ))}
                    <span className="rounded-full border border-dashed border-[#cdd5e8] px-2.5 py-1 text-[11px] text-[#9aa3bc]">
                      + Hinzufügen
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 rounded-xl border border-[#dbe4f6] bg-[#f5f8ff] p-3">
                  <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
                    Nachricht
                  </p>
                  <p className="min-h-[44px] text-[13px] leading-relaxed text-[#36415f]">
                    {typedText}
                    <span className="ml-px inline-block h-3.5 w-0.5 animate-pulse align-middle bg-[#5b74b6]" />
                  </p>
                </div>

                {inspectorNode.replies && (
                  <div className="mt-3">
                    <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
                      Quick Replies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectorNode.replies.map((reply, ri) => (
                        <span
                          key={reply}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-500 ${
                            ri === 1 && inspectorNode.id === 'time'
                              ? 'border-[#b9c7ef] bg-[#6b7df0] text-white'
                              : 'border-[#d7dcee] bg-white/85 text-[#43506b]'
                          }`}
                        >
                          {reply}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status strip */}
          {stage.status === 'Aktiv' ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#cbe0d3] bg-[#eef9f1] px-3 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dff2e6] text-[#2f8058]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className={`text-[12px] font-semibold ${strongText}`}>Flow ist bereit</p>
                <p className={`truncate text-[11px] leading-snug ${mutedText}`}>{stage.footer}</p>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl border px-3 py-2.5 ${subtleBord} bg-white/60`}>
              <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
                Verbunden mit
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c5cdf0] bg-[#f0f1ff] px-2.5 py-1 text-[11px] font-medium text-[#4f68a6]">
                  <Camera className="h-3 w-3" />
                  Instagram
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8dfc8] bg-[#eef9f1] px-2.5 py-1 text-[11px] font-medium text-[#2e7d57]">
                  <MessageCircle className="h-3 w-3" />
                  WhatsApp
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e0d08a] bg-[#fdf8e6] px-2.5 py-1 text-[11px] font-medium text-[#7a6010]">
                  <Globe className="h-3 w-3" />
                  Google
                </span>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // ── Canvas empty state (setup phases) ──────────────────────────────
  const renderCanvasEmpty = () => (
    <div className="flex flex-1 items-center justify-center">
      <p className={`text-[12px] ${mutedText}`}>Canvas ist bereit</p>
    </div>
  );

  const shellClass = isLight
    ? 'border border-[#b9bec9] bg-[linear-gradient(180deg,#d8dbe2_0%,#c8cdd6_100%)] shadow-[0_30px_80px_rgba(34,43,70,0.12)]'
    : 'border border-white/[0.08] bg-zinc-950 shadow-2xl shadow-black/60';

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className={isLight ? 'px-6' : ''}>
        <div className={`overflow-hidden ${isLight ? 'rounded-[34px] p-3' : 'rounded-[30px]'} ${shellClass}`}>

          {/* ══════════ LIGHT THEME ══════════ */}
          {isLight && (
            <div className="overflow-hidden rounded-[24px] border border-black/8 bg-white/70">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-black/8 bg-[linear-gradient(180deg,rgba(249,250,252,0.96),rgba(236,239,245,0.96))] px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-3 flex flex-1 items-center gap-2 rounded-full border border-black/8 bg-white/80 px-3 py-1 text-[11px] text-[#5f6982] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <span className="h-2 w-2 rounded-full bg-[#c7cfdf]" />
                  app.wesponde.com/{stage.urlPath}
                </div>
              </div>

              <div className="flex h-[480px] flex-col lg:h-[500px] lg:flex-row">
                {/* LEFT PANEL */}
                <div className={`flex w-full flex-shrink-0 flex-col border-r ${subtleBord} bg-white/55 lg:w-[38%]`}>
                  <div className={`border-b px-5 py-3 ${subtleBord}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                      {stage.phase === 'setup-start' ? 'Flow erstellen' : 'Flow Builder'}
                    </p>
                    <h3 className={`mt-1 text-[14px] font-semibold leading-snug ${strongText}`}>
                      Geführter Aufbau statt Tool-Chaos
                    </h3>
                  </div>
                  {renderLightLeftPanel()}
                </div>

                {/* RIGHT PANEL: canvas */}
                <div className="relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#f6f8ff_0%,#edf1fb_100%)]">
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(84,106,173,0.08) 1px, transparent 1px)',
                      backgroundSize: '26px 26px',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(84,106,173,0.09),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(129,143,199,0.12),transparent_34%)]" />

                  {/* Canvas header */}
                  <div className={`relative flex items-center justify-between border-b px-5 py-3 ${subtleBord}`}>
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>Flow Canvas</p>
                      <p className={`mt-0.5 text-[12px] ${mutedText}`}>
                        Visuell verbunden, ruhig aufgebaut, direkt verständlich.
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      stage.status === 'Aktiv'
                        ? 'border-[#cbe0d3] bg-[#eef9f1] text-[#2f8058]'
                        : 'border-[#d7dcee] bg-white/70 text-[#55607d]'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${stage.status === 'Aktiv' ? 'animate-pulse bg-emerald-400' : 'bg-[#7b8caf]'}`} />
                      {stage.status}
                    </span>
                  </div>

                  {/* Nodes or empty state */}
                  {stage.phase === 'build' ? (
                    <div className="relative flex-1 overflow-hidden px-4 pb-4 pt-4">
                      {renderCanvasNodes()}
                    </div>
                  ) : (
                    renderCanvasEmpty()
                  )}

                  {renderFooter()}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ DARK THEME ══════════ */}
          {!isLight && (
            <div className="flex h-[500px] flex-col lg:h-[520px] lg:flex-row">
              <div className="flex w-full flex-shrink-0 flex-col border-r border-white/[0.08] bg-zinc-950 lg:w-[36%]">
                <div className="border-b border-white/[0.08] px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                    {stage.phase === 'setup-start' ? 'Flow erstellen' : 'Flow Builder'}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Geführter Aufbau statt Tool-Chaos
                  </h3>
                </div>

                {stage.phase === 'setup-start' && (
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-3 text-[12px] text-zinc-400">Wie möchtest du starten?</p>
                    <div className="flex flex-col gap-2">
                      {START_OPTIONS.map((opt, i) => {
                        const Icon = opt.icon;
                        const isSelected = selectedOption === i;
                        return (
                          <div key={opt.title} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                            isSelected ? 'border-indigo-500/30 bg-indigo-500/[0.08]' : 'border-white/[0.08] bg-white/[0.02]'
                          }`}>
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-500 ${
                              isSelected ? 'bg-indigo-500/15 text-indigo-300' : 'bg-white/[0.05] text-zinc-400'
                            }`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[12px] font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{opt.title}</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{opt.desc}</p>
                            </div>
                            <div className={`mt-0.5 transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                              <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {stage.phase === 'template-select' && (
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-3 text-[12px] text-zinc-400">Für welche Branche?</p>
                    <div className="flex flex-col gap-2">
                      {BRANCH_OPTIONS.map((opt, i) => {
                        const isSelected = selectedBranch === i;
                        return (
                          <div key={opt.title} className={`rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                            isSelected ? 'border-indigo-500/30 bg-indigo-500/[0.08]' : 'border-white/[0.08] bg-white/[0.02]'
                          }`}>
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-[12px] font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{opt.title}</p>
                              <div className={`transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                <Check className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                              </div>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{opt.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {stage.phase === 'build' && (
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-indigo-300">
                            <Layers className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">Vorlage</p>
                            <p className="mt-1 text-sm font-semibold text-white">Restaurant Reservierungen</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-300">
                          <Check className="h-3 w-3" />
                          Ausgewählt
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                        Start mit DM Eingang, Begrüßung, Quick Replies und direkter Bestätigung.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">Aktueller Schritt</p>
                          <p className="mt-1 text-base font-semibold text-white">{inspectorNode.label}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getKindBadge(inspectorNode.kind, false)}`}>
                          {KIND_LABELS[inspectorNode.kind]}
                        </span>
                      </div>
                      <div className="mt-4 rounded-2xl border border-indigo-500/[0.18] bg-indigo-500/[0.05] p-4">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-300">Nachricht</p>
                        <p className="min-h-[72px] text-sm leading-relaxed text-zinc-200">
                          {typedText}
                          <span className="ml-px inline-block h-4 w-0.5 animate-pulse align-middle bg-indigo-400" />
                        </p>
                      </div>
                      {inspectorNode.replies && (
                        <div className="mt-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-300">Quick Replies</p>
                          <div className="flex flex-wrap gap-2">
                            {inspectorNode.replies.map((reply, index) => (
                              <span key={reply} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-500 ${
                                index === 1 && inspectorNode.id === 'time'
                                  ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200'
                                  : 'border-white/[0.08] bg-white/[0.05] text-zinc-200'
                              }`}>
                                {reply}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {stage.status === 'Aktiv' ? (
                      <div className="mt-auto flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Flow ist bereit</p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-300">{stage.footer}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                          Verbunden mit
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[11px] font-medium text-pink-300">
                            <Camera className="h-3 w-3" />
                            Instagram
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-300">
                            <Globe className="h-3 w-3" />
                            Google
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dark canvas */}
              <div className="relative flex flex-1 flex-col overflow-hidden bg-[#080809]">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                />
                <div className="relative flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">Flow Canvas</p>
                    <p className="mt-1 text-sm text-zinc-300">Visuell verbunden, ruhig aufgebaut, direkt verständlich.</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    stage.status === 'Aktiv'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/[0.08] bg-white/[0.04] text-zinc-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stage.status === 'Aktiv' ? 'animate-pulse bg-emerald-400' : 'bg-zinc-600'}`} />
                    {stage.status}
                  </span>
                </div>

                {stage.phase === 'build' ? (
                  <div className="relative flex-1 overflow-hidden px-6 pb-4 pt-4">
                    {renderCanvasNodes()}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-[12px] text-zinc-600">Canvas ist bereit</p>
                  </div>
                )}

                {renderFooter()}
              </div>
            </div>
          )}
        </div>

        {isLight && (
          <>
            <div className="mx-auto h-3 w-[76%] rounded-b-[18px] bg-[linear-gradient(180deg,#b9bec8_0%,#aab1bc_100%)]" />
            <div className="mx-auto h-1.5 w-[88%] rounded-b-full bg-[#a6adb7]/70 shadow-[0_18px_40px_rgba(63,73,94,0.18)]" />
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {['Visueller Editor', 'Vorlagen', 'Quick Replies', 'Saubere Logik'].map((item) => (
          <span
            key={item}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              isLight
                ? 'border border-[#98addf] bg-white/72 text-[#4b5268]'
                : 'border border-white/10 bg-white/5 text-zinc-300'
            }`}
          >
            <Check className={`h-3.5 w-3.5 flex-shrink-0 ${isLight ? 'text-[#5e73b1]' : 'text-indigo-400'}`} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
