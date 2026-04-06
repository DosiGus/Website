'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap, MessageCircle, CalendarDays, CheckCircle2, BarChart3, Link2, Settings, Plus, Star, Download, Save, Eye, UtensilsCrossed, Scissors, Dumbbell, Check, Camera, Globe } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────── */

type Phase = 'dashboard' | 'flows' | 'template' | 'editor';

/* ── Cursor ─────────────────────────────────────────────────────── */

function Cursor({ clicking }: { clicking: boolean }) {
  return (
    <div className="relative">
      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
        className={`drop-shadow-md transition-transform duration-100 ${clicking ? 'scale-[0.82]' : ''}`}
      >
        <path d="M3 1L3 18L7 14H14.5L3 1Z" fill="white" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      {clicking && (
        <span className="absolute -left-2.5 -top-2.5 block h-9 w-9 animate-ping rounded-full bg-[#2563EB]/15" />
      )}
    </div>
  );
}

/* ── Mini Sidebar ───────────────────────────────────────────────── */

function MiniSidebar({ activeItem }: { activeItem: string }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'flows', label: 'Flows', icon: Zap },
    { id: 'integrations', label: 'Integrationen', icon: Link2 },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ];
  return (
    <div className="hidden h-full w-[180px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white sm:flex">
      <div className="px-4 py-3">
        <p className="text-[13px] font-bold text-[#2450b2]">Wesponde</p>
      </div>
      <div className="space-y-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-[#EEF3FF] text-[#1E4FD8]'
                  : 'text-[#64748B]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Phase: Dashboard ───────────────────────────────────────────── */

function DashboardContent() {
  const stats = [
    { label: 'Aktive Flows', value: '3', trend: '+1', color: '#2563EB', bg: '#DBEAFE' },
    { label: 'Reservierungen', value: '24', trend: '+8', color: '#10B981', bg: '#D1FAE5' },
    { label: 'Konversationen', value: '156', trend: '+23', color: '#8B5CF6', bg: '#EDE9FE' },
  ];
  return (
    <div className="flex h-full">
      <MiniSidebar activeItem="dashboard" />
      <div className="flex-1 p-3 sm:p-5">
        <p className="text-[14px] font-semibold text-[#0F172A] sm:text-[15px]">Dashboard</p>
        <p className="mt-0.5 text-[10px] text-[#94A3B8] sm:text-[11px]">Willkommen zurück</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-[#E2E8F0] bg-white p-2.5 shadow-sm sm:p-3.5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg sm:h-7 sm:w-7" style={{ background: s.bg }}>
                  <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: s.color }} />
                </div>
                <span className="text-[9px] font-medium text-[#94A3B8] sm:text-[11px]">{s.label}</span>
              </div>
              <p className="mt-1.5 text-[18px] font-bold tabular-nums text-[#0F172A] sm:mt-2 sm:text-[22px]">{s.value}</p>
              <p className="mt-0.5 text-[9px] font-medium text-[#10B981] sm:text-[10px]">↑ {s.trend} diese Woche</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Phase: Flow List ───────────────────────────────────────────── */

function FlowListContent() {
  const flows = [
    { name: 'Reservierungs-Flow', status: 'Aktiv', updated: 'vor 2 Std.', fav: true },
    { name: 'Bewertungs-Flow', status: 'Entwurf', updated: 'vor 1 Tag', fav: false },
  ];
  return (
    <div className="flex h-full">
      <MiniSidebar activeItem="flows" />
      <div className="flex-1 p-3 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#0F172A] sm:text-[15px]">Flows</p>
            <p className="mt-0.5 text-[10px] text-[#94A3B8] sm:text-[11px]">Automationen verwalten</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-full bg-[#2450b2] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-[0_2px_12px_rgba(36,80,178,0.25)] sm:px-3.5 sm:py-2 sm:text-[11px]">
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">Flow erstellen</span>
            <span className="sm:hidden">Erstellen</span>
          </button>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E2E8F0]">
          {flows.map((flow, i) => (
            <div
              key={flow.name}
              className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-[#E2E8F0]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Star className={`h-3.5 w-3.5 ${flow.fav ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'}`} />
                <div>
                  <p className="text-[12px] font-semibold text-[#0F172A]">{flow.name}</p>
                  <p className="text-[10px] text-[#94A3B8]">{flow.updated}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  flow.status === 'Aktiv'
                    ? 'bg-[#ECFDF5] text-[#059669]'
                    : 'bg-[#F8FAFC] text-[#94A3B8]'
                }`}
              >
                {flow.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Phase: Template Selection ──────────────────────────────────── */

function TemplateContent({ selectedIdx }: { selectedIdx: number }) {
  const templates = [
    { name: 'Gastronomie', desc: 'Reservierungen & Tischbuchungen', icon: UtensilsCrossed },
    { name: 'Beauty & Friseur', desc: 'Terminbuchungen & Beratung', icon: Scissors },
    { name: 'Fitness & Sport', desc: 'Kurse & Mitgliederanfragen', icon: Dumbbell },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center p-4 sm:p-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div
            key={s}
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold sm:h-6 sm:w-6 sm:text-[10px] ${
              s === 1
                ? 'bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
                : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]'
            }`}
          >
            {s}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[14px] font-semibold text-[#0F172A] sm:mt-4 sm:text-[15px]">Vorlage wählen</p>
      <p className="mt-1 text-[10px] text-[#94A3B8] sm:text-[11px]">Wählen Sie eine Branche als Startvorlage</p>
      <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
        {templates.map((t, i) => (
          <div
            key={t.name}
            className={`cursor-default rounded-xl border-2 p-2.5 text-center transition-all duration-400 sm:rounded-2xl sm:p-3.5 ${
              i === selectedIdx
                ? 'border-[#93C5FD] bg-[#EFF6FF] shadow-[0_4px_16px_rgba(37,99,235,0.10)]'
                : 'border-[#E2E8F0] bg-white'
            }`}
          >
            <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl ${i === selectedIdx ? 'bg-[#DBEAFE]' : 'bg-[#F1F5F9]'} transition-colors duration-400`}>
              <t.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i === selectedIdx ? 'text-[#2563EB]' : 'text-[#64748B]'} transition-colors duration-400`} strokeWidth={1.5} />
            </div>
            <p className="mt-1 text-[10px] font-semibold text-[#0F172A] sm:mt-1.5 sm:text-[11px]">{t.name}</p>
            <p className="mt-0.5 hidden text-[9px] leading-snug text-[#94A3B8] sm:block">{t.desc}</p>
          </div>
        ))}
      </div>
      {/* Weiter button */}
      <button
        className={`mt-5 rounded-full px-6 py-2 text-[12px] font-semibold transition-all duration-300 ${
          selectedIdx >= 0
            ? 'bg-[#2450b2] text-white shadow-[0_2px_12px_rgba(36,80,178,0.25)]'
            : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
        }`}
      >
        Weiter
      </button>
    </div>
  );
}

/* ── Phase: Flow Editor ─────────────────────────────────────────── */

type EditorState = {
  expandedId: string | null;
  hoveredId: string | null;
  typedLen: number;
  visibleReplies: number;
  isActive: boolean;
};

const EDITOR_NODES = [
  { id: 'trigger', label: 'Begrüßung', kind: 'trigger', preview: 'Keyword: "Reservieren"', icon: Zap },
  { id: 'welcome', label: 'Personenanzahl', kind: 'message', preview: 'Gerne! Für wie viele Personen?', icon: MessageCircle, fullText: 'Gerne! Für wie viele Personen?', replies: ['2 Personen', '3 Personen', '4+'] },
  { id: 'date', label: 'Datum & Uhrzeit', kind: 'message', preview: 'Wann möchten Sie reservieren?', icon: CalendarDays },
  { id: 'confirm', label: 'Bestätigung', kind: 'message', preview: 'Reservierung bestätigt!', icon: CheckCircle2 },
] as const;

function EditorContent({ state }: { state: EditorState }) {
  const typedText = EDITOR_NODES[1].fullText;
  return (
    <div className="flex h-full">
      <MiniSidebar activeItem="flows" />
      <div className="flex-1 overflow-hidden">
        {/* Cockpit bar — matching real Flow Builder */}
        <div className="px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm sm:rounded-2xl sm:px-4 sm:py-2.5">
            <p className="text-[12px] font-semibold text-[#0F172A] sm:text-[13px]">Reservierungs-Flow</p>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-xl border border-[#E2E8F0] p-1.5 text-[#64748B] sm:block">
                <Download className="h-3 w-3" />
              </div>
              <div className="hidden rounded-xl border border-[#E2E8F0] p-1.5 text-[#64748B] sm:block">
                <Save className="h-3 w-3" />
              </div>
              <div className="hidden rounded-xl border border-[#E2E8F0] p-1.5 text-[#64748B] sm:block">
                <Eye className="h-3 w-3" />
              </div>
              {/* Toggle switch */}
              <div className="ml-1 flex items-center gap-1.5">
                <div
                  className={`relative inline-flex h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-300 ${
                    state.isActive ? 'bg-[#1E4FD8]' : 'bg-[#CBD5E1]'
                  }`}
                >
                  <span
                    className={`absolute left-[2px] top-[2px] inline-block h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-300 ${
                      state.isActive ? 'translate-x-[14px]' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className={`text-[11px] font-medium transition-colors duration-300 ${state.isActive ? 'text-[#1E4FD8]' : 'text-[#94A3B8]'}`}>
                  {state.isActive ? 'Aktiv' : 'Entwurf'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verbunden mit */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-1.5 sm:gap-2 sm:px-4 sm:pt-2">
          <span className="text-[9px] font-medium text-[#94A3B8] sm:text-[10px]">Verbunden mit</span>
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c5cdf0] bg-[#f0f1ff] px-2 py-0.5 text-[10px] font-medium text-[#4f68a6]">
              <Camera className="h-2.5 w-2.5" />
              Instagram
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#b8dfc8] bg-[#eef9f1] px-2 py-0.5 text-[10px] font-medium text-[#2e7d57]">
              <MessageCircle className="h-2.5 w-2.5" />
              WhatsApp
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e0d08a] bg-[#fdf8e6] px-2 py-0.5 text-[10px] font-medium text-[#7a6010]">
              <Globe className="h-2.5 w-2.5" />
              Google
            </span>
          </div>
        </div>

        {/* Node list */}
        <div className="relative px-3 py-2 sm:px-5 sm:py-3 md:px-8">
          {/* Connection line */}
          <div
            className="absolute bottom-8 top-8 w-px"
            style={{ left: 'calc(1.5rem + 10px)', background: 'linear-gradient(to bottom, #93C5FD, #E2E8F0)' }}
          />

          <div className="space-y-2.5">
            {EDITOR_NODES.map((node, i) => {
              const Icon = node.icon;
              const isExpanded = state.expandedId === node.id;
              const isHovered = state.hoveredId === node.id;
              const isStart = i === 0;

              return (
                <div key={node.id} className="relative flex items-start gap-2 sm:gap-3">
                  {/* Step circle */}
                  <div
                    className={`relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-bold transition-all duration-500 sm:h-[28px] sm:w-[28px] sm:text-[10px] ${
                      isStart
                        ? 'border-[#10B981] bg-[#ECFDF5] text-[#059669]'
                        : isExpanded || isHovered
                          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                          : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#94A3B8]'
                    }`}
                  >
                    {i + 1}
                  </div>

                  {/* Card */}
                  <div
                    className={`flex-1 overflow-hidden rounded-2xl border bg-white transition-all duration-500 ${
                      isExpanded
                        ? 'border-[#93C5FD] shadow-[0_6px_24px_rgba(37,99,235,0.08)]'
                        : isHovered
                          ? 'border-[#BFDBFE] shadow-md'
                          : 'border-[#E2E8F0] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-2.5 py-2 sm:gap-2.5 sm:px-3.5 sm:py-2.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-500 sm:h-8 sm:w-8 sm:rounded-xl ${
                          isExpanded || isHovered ? 'bg-[#DBEAFE]' : 'bg-[#F1F5F9]'
                        }`}
                      >
                        <Icon className={`h-3 w-3 transition-colors duration-500 sm:h-3.5 sm:w-3.5 ${isExpanded || isHovered ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-[#0F172A] sm:text-[12px]">{node.label}</p>
                        {!isExpanded && <p className="truncate text-[9px] text-[#94A3B8] sm:text-[10px]">{node.preview}</p>}
                      </div>
                      <svg
                        className={`h-3.5 w-3.5 shrink-0 text-[#CBD5E1] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {/* Expanded editor */}
                    <div
                      className="overflow-hidden transition-all duration-500"
                      style={{ maxHeight: isExpanded ? 160 : 0, opacity: isExpanded ? 1 : 0 }}
                    >
                      <div className="border-t border-[#F1F5F9] px-3.5 pb-3.5 pt-2.5">
                        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[12px] leading-relaxed text-[#0F172A]">
                          {typedText.substring(0, state.typedLen)}
                          {state.typedLen < typedText.length && state.typedLen > 0 && (
                            <span className="inline-block h-[13px] w-[1.5px] translate-y-[2px] animate-pulse bg-[#2563EB]" />
                          )}
                          {state.typedLen === 0 && <span className="text-[#CBD5E1]">Nachricht eingeben…</span>}
                        </div>
                        {state.visibleReplies > 0 && (
                          <div className="mt-2.5">
                            <p className="mb-1 text-[10px] font-medium text-[#94A3B8]">Quick Replies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(['2 Personen', '3 Personen', '4+'] as const).slice(0, state.visibleReplies).map((reply) => (
                                <span
                                  key={reply}
                                  className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]"
                                  style={{ animation: 'fadeInUp 300ms ease-out forwards' }}
                                >
                                  {reply}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

const URL_MAP: Record<Phase, string> = {
  dashboard: 'dashboard',
  flows: 'flows',
  template: 'flows/new',
  editor: 'flows/builder',
};

export default function FlowBuilderDemoV2({ theme = 'light' }: { theme?: 'dark' | 'light' }) {
  const [cycleKey, setCycleKey] = useState(0);
  const [phase, setPhase] = useState<Phase>('dashboard');
  const [clicking, setClicking] = useState(false);
  const [templateIdx, setTemplateIdx] = useState(-1);

  /* editor sub-state */
  const [editorState, setEditorState] = useState<EditorState>({
    expandedId: null,
    hoveredId: null,
    typedLen: 0,
    visibleReplies: 0,
    isActive: false,
  });

  const [step, setStep] = useState(0);
  const TOTAL_STEPS = 7;

  const [cursorPos, setCursorPos] = useState({ x: '50%', y: '50%' });

  const reset = useCallback(() => {
    setPhase('dashboard');
    setClicking(false);
    setTemplateIdx(-1);
    setStep(0);
    setEditorState({ expandedId: null, hoveredId: null, typedLen: 0, visibleReplies: 0, isActive: false });
    setCursorPos({ x: '50%', y: '50%' });
  }, []);

  const click = useCallback((thenFn?: () => void) => {
    setClicking(true);
    setTimeout(() => {
      setClicking(false);
      thenFn?.();
    }, 180);
  }, []);

  /* ── master timeline ──────────────────────────────────────────── */
  useEffect(() => {
    reset();
    const t: NodeJS.Timeout[] = [];
    const at = (ms: number, fn: () => void) => t.push(setTimeout(fn, ms));

    /* ── Phase 1: Dashboard ─── */
    // Cursor glides to "Flows" nav item in sidebar (2nd item, ~86px from top)
    at(1200, () => setCursorPos({ x: '9%', y: '21%' }));
    at(1800, () => click(() => { setPhase('flows'); setStep(1); }));

    /* ── Phase 2: Flow list ─── */
    // Cursor moves toward the "Flow erstellen" button (top-right)
    at(2400, () => setCursorPos({ x: '72%', y: '9%' }));
    // Fine-tune: land precisely on the button center
    at(3000, () => setCursorPos({ x: '87%', y: '9%' }));
    at(3600, () => click(() => { setPhase('template'); setStep(2); }));

    /* ── Phase 3: Template selection ─── */
    // Move to first template card "Gastronomie" (left column center)
    at(4200, () => setCursorPos({ x: '35%', y: '60%' }));
    // Select the template
    at(4800, () => click(() => { setTemplateIdx(0); setStep(3); }));
    // Move down to "Weiter" button
    at(5600, () => setCursorPos({ x: '50%', y: '82%' }));
    at(6000, () => click(() => { setPhase('editor'); setStep(4); }));

    /* ── Phase 4: Flow editor ─── */
    // Cursor rests briefly
    at(6600, () => setCursorPos({ x: '65%', y: '25%' }));

    // Hover over node 2 "Personenanzahl" (accounts for cockpit bar offset)
    at(7400, () => {
      setCursorPos({ x: '55%', y: '40%' });
      setEditorState((s) => ({ ...s, hoveredId: 'welcome' }));
    });

    // Click to expand node 2
    at(8000, () =>
      click(() => { setEditorState((s) => ({ ...s, expandedId: 'welcome' })); setStep(5); }),
    );

    // Move cursor into the text input area
    at(8600, () => setCursorPos({ x: '52%', y: '52%' }));

    // Quick replies appear one by one
    at(11200, () => setEditorState((s) => ({ ...s, visibleReplies: 1 })));
    at(11500, () => setEditorState((s) => ({ ...s, visibleReplies: 2 })));
    at(11800, () => setEditorState((s) => ({ ...s, visibleReplies: 3 })));

    // Collapse the node
    at(12800, () =>
      setEditorState((s) => ({ ...s, expandedId: null, hoveredId: null })),
    );

    // Move precisely to the toggle switch in the cockpit bar
    at(13400, () => setCursorPos({ x: '86%', y: '8%' }));

    // Click toggle: Entwurf → Aktiv
    at(14000, () =>
      click(() => { setEditorState((s) => ({ ...s, isActive: true })); setStep(6); }),
    );

    // Hold the final state, then restart
    at(16500, () => {
      reset();
      setCycleKey((k) => k + 1);
    });

    return () => t.forEach(clearTimeout);
  }, [cycleKey, reset, click]);

  /* ── typing effect for editor phase ───────────────────────────── */
  useEffect(() => {
    if (editorState.expandedId !== 'welcome') {
      setEditorState((s) => ({ ...s, typedLen: 0 }));
      return;
    }
    const text = EDITOR_NODES[1].fullText;
    let iv: NodeJS.Timeout;
    const delay = setTimeout(() => {
      let i = 0;
      iv = setInterval(() => {
        i++;
        setEditorState((s) => ({ ...s, typedLen: i }));
        if (i >= text.length) clearInterval(iv);
      }, 40);
    }, 500);
    return () => {
      clearTimeout(delay);
      clearInterval(iv);
    };
  }, [editorState.expandedId]);

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <div className="relative mx-auto w-full max-w-5xl px-0 sm:px-4 lg:px-6">
      {/* MacBook shell */}
      <div className="overflow-hidden rounded-[28px] border border-[#b9bec9] bg-[linear-gradient(180deg,#d8dbe2_0%,#c8cdd6_100%)] p-2.5 shadow-[0_30px_80px_rgba(34,43,70,0.12)] sm:rounded-[34px] sm:p-3">
        {/* Inner content */}
        <div className="overflow-hidden rounded-[20px] border border-black/8 bg-white/70 sm:rounded-[24px]">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-black/8 bg-[linear-gradient(180deg,rgba(249,250,252,0.96),rgba(236,239,245,0.96))] px-4 py-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-3 flex flex-1 items-center gap-2 rounded-full border border-black/8 bg-white/80 px-3 py-1 text-[11px] text-[#5f6982] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <span className="h-2 w-2 rounded-full bg-[#c7cfdf]" />
              <span className="truncate transition-all duration-300">app.wesponde.com/{URL_MAP[phase]}</span>
            </div>
          </div>

          {/* Content area */}
          <div className="relative h-[380px] overflow-hidden bg-[#F8FAFC] sm:h-[460px] lg:h-[500px]">
            {/* Phase screens */}
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{ opacity: phase === 'dashboard' ? 1 : 0, pointerEvents: phase === 'dashboard' ? 'auto' : 'none' }}
            >
              <DashboardContent />
            </div>
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{ opacity: phase === 'flows' ? 1 : 0, pointerEvents: phase === 'flows' ? 'auto' : 'none' }}
            >
              <FlowListContent />
            </div>
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{ opacity: phase === 'template' ? 1 : 0, pointerEvents: phase === 'template' ? 'auto' : 'none' }}
            >
              <TemplateContent selectedIdx={templateIdx} />
            </div>
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{ opacity: phase === 'editor' ? 1 : 0, pointerEvents: phase === 'editor' ? 'auto' : 'none' }}
            >
              <EditorContent state={editorState} />
            </div>

            {/* Progress footer */}
            <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-black/8 bg-white/80 backdrop-saturate-150 px-3 py-2 sm:px-5 sm:py-2.5">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all duration-500 sm:h-1.5 ${
                        i <= step ? 'w-4 bg-[#6a7fbb] sm:w-6' : 'w-3 bg-[#d5dcee] sm:w-4'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-medium text-[#67718a] sm:text-[11px]">
                  {step + 1} von {TOTAL_STEPS} Schritten
                </p>
              </div>
            </div>

            {/* Animated cursor */}
            <div
              className="pointer-events-none absolute z-50"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                transition: 'all 600ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <Cursor clicking={clicking} />
            </div>
          </div>
        </div>
      </div>

      {/* MacBook bezel */}
      <div className="mx-auto h-3 w-[76%] rounded-b-[18px] bg-[linear-gradient(180deg,#b9bec8_0%,#aab1bc_100%)]" />
      <div className="mx-auto h-1.5 w-[88%] rounded-b-full bg-[#a6adb7]/70 shadow-[0_18px_40px_rgba(63,73,94,0.18)]" />

      <div className="mt-5 flex flex-wrap justify-center gap-2 sm:mt-8 sm:gap-2.5">
        {['Visueller Editor', 'Vorlagen', 'Quick Replies', 'No-Code'].map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#98addf] bg-white/72 px-3 py-1.5 text-xs font-medium text-[#4b5268] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#5e73b1]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
