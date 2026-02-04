'use client';

import { useEffect, useState } from 'react';
import { Check, MousePointer2, MessageSquare, Zap, Clock, Star } from 'lucide-react';

/* ========================================
   FLOW BUILDER DEMO COMPONENT
   Hybrid: Wizard steps + Visual canvas
   Proper node connections with visible lines.
   ======================================== */

// Canvas nodes - logical vertical flow
type CanvasNode = {
  id: string;
  label: string;
  type: 'trigger' | 'message' | 'reply' | 'action';
  x: number;
  y: number;
  showAt: number;
};

// Nodes arranged in logical order: top to bottom flow
const canvasNodes: CanvasNode[] = [
  { id: 'trigger', label: 'DM Eingang', type: 'trigger', x: 95, y: 15, showAt: 2 },
  { id: 'welcome', label: 'Begrüßung', type: 'message', x: 95, y: 70, showAt: 3 },
  { id: 'time', label: 'Uhrzeit?', type: 'reply', x: 95, y: 125, showAt: 4 },
  { id: 'confirm', label: 'Bestätigung', type: 'message', x: 95, y: 180, showAt: 5 },
  { id: 'reminder', label: 'Reminder', type: 'action', x: 95, y: 235, showAt: 6 },
];

const connections = [
  { from: 'trigger', to: 'welcome', showAt: 3 },
  { from: 'welcome', to: 'time', showAt: 4 },
  { from: 'time', to: 'confirm', showAt: 5 },
  { from: 'confirm', to: 'reminder', showAt: 6 },
];

export default function FlowBuilderDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 100, y: 100 });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    setCurrentStep(1);
    setShowCursor(false);
    setSelectedTemplate(null);
    setActiveMessage(null);
    setCursorPos({ x: 100, y: 100 });

    const timeouts: NodeJS.Timeout[] = [];

    // Step 1: Select template
    timeouts.push(setTimeout(() => {
      setShowCursor(true);
      setCursorPos({ x: 80, y: 120 });
    }, 800));

    timeouts.push(setTimeout(() => {
      setCursorPos({ x: 90, y: 145 });
    }, 1800));

    timeouts.push(setTimeout(() => {
      setSelectedTemplate('restaurant');
    }, 2500));

    // Step 2: Trigger node
    timeouts.push(setTimeout(() => {
      setCurrentStep(2);
      setCursorPos({ x: 60, y: 90 });
    }, 4000));

    // Step 3: Welcome message
    timeouts.push(setTimeout(() => {
      setCurrentStep(3);
      setActiveMessage('welcome');
      setCursorPos({ x: 95, y: 115 });
    }, 6000));

    // Step 4: Time question
    timeouts.push(setTimeout(() => {
      setCurrentStep(4);
      setActiveMessage('time');
      setCursorPos({ x: 95, y: 155 });
    }, 8500));

    // Step 5: Confirmation
    timeouts.push(setTimeout(() => {
      setCurrentStep(5);
      setActiveMessage('confirm');
      setCursorPos({ x: 70, y: 175 });
    }, 11000));

    // Step 6: Reminder
    timeouts.push(setTimeout(() => {
      setCurrentStep(6);
      setActiveMessage(null);
      setCursorPos({ x: 70, y: 210 });
    }, 13500));

    // Step 7: Live!
    timeouts.push(setTimeout(() => {
      setCurrentStep(7);
      setShowCursor(false);
    }, 16000));

    // Restart
    timeouts.push(setTimeout(() => {
      setCycleKey((prev) => prev + 1);
    }, 21000));

    return () => timeouts.forEach(clearTimeout);
  }, [cycleKey]);

  const getNodeStyle = (type: CanvasNode['type']) => {
    switch (type) {
      case 'trigger':
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
      case 'message':
        return 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400';
      case 'reply':
        return 'bg-violet-500/20 border-violet-500/50 text-violet-400';
      case 'action':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    }
  };

  const getNodeIcon = (type: CanvasNode['type']) => {
    switch (type) {
      case 'trigger':
        return <Zap className="h-2.5 w-2.5" />;
      case 'reply':
        return <Clock className="h-2.5 w-2.5" />;
      case 'action':
        return <Star className="h-2.5 w-2.5" />;
      default:
        return <MessageSquare className="h-2.5 w-2.5" />;
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 1: return { title: 'Template wählen', desc: 'Branche auswählen' };
      case 2: return { title: 'Trigger erstellt', desc: 'DM Eingang wird erkannt' };
      case 3: return { title: 'Begrüßung', desc: 'Willkommensnachricht' };
      case 4: return { title: 'Quick Replies', desc: 'Uhrzeit-Auswahl' };
      case 5: return { title: 'Bestätigung', desc: 'Termin bestätigen' };
      case 6: return { title: 'Reminder', desc: 'Erinnerung 4h vorher' };
      case 7: return { title: 'Live!', desc: 'Flow ist aktiv' };
      default: return { title: '', desc: '' };
    }
  };

  const stepInfo = getStepInfo();

  // Node dimensions for connection calculation
  const nodeWidth = 90;
  const nodeHeight = 28;

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Glow - reduced blur for performance */}
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[60px] sm:h-[400px] sm:w-[600px] sm:blur-[100px]" />

      <div className="relative">
        <div className="relative mx-auto w-full overflow-hidden rounded-t-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2 sm:px-4">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500/80 sm:h-2.5 sm:w-2.5" />
              <div className="h-2 w-2 rounded-full bg-yellow-500/80 sm:h-2.5 sm:w-2.5" />
              <div className="h-2 w-2 rounded-full bg-green-500/80 sm:h-2.5 sm:w-2.5" />
            </div>
            <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-zinc-800 px-2 py-1 sm:ml-4 sm:px-3">
              <svg className="hidden h-3 w-3 text-zinc-500 sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" strokeLinecap="round" />
              </svg>
              <span className="truncate text-[10px] text-zinc-400 sm:text-[11px]">app.wesponde.com/flows/builder</span>
            </div>
          </div>

          {/* Split View - Canvas hidden on mobile */}
          <div className="flex h-[340px] sm:h-[380px] md:h-[420px]">
            {/* Left Panel - Full width on mobile, 45% on desktop */}
            <div className="relative w-full border-zinc-800 bg-zinc-950 p-3 sm:p-4 md:w-[45%] md:border-r">
              {/* Step Indicator */}
              <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    currentStep === 7 ? 'bg-emerald-500' : 'bg-indigo-500'
                  } text-white`}>
                    {currentStep === 7 ? <Check className="h-4 w-4" /> : currentStep}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{stepInfo.title}</p>
                    <p className="text-[10px] text-zinc-500">{stepInfo.desc}</p>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-2">
                {currentStep === 1 && (
                  <>
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Vorlage auswählen:
                    </p>
                    {[
                      { id: 'restaurant', name: 'Restaurant', icon: '🍽️', desc: 'Reservierungen' },
                      { id: 'salon', name: 'Salon', icon: '💇', desc: 'Termine' },
                      { id: 'praxis', name: 'Praxis', icon: '🏥', desc: 'Patienten' },
                    ].map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
                          selectedTemplate === t.id
                            ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                            : 'border-zinc-800 bg-zinc-900'
                        }`}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">{t.name}</p>
                          <p className="text-[9px] text-zinc-500">{t.desc}</p>
                        </div>
                        {selectedTemplate === t.id && <Check className="h-4 w-4 text-indigo-400" />}
                      </div>
                    ))}
                  </>
                )}

                {currentStep >= 2 && currentStep <= 6 && (
                  <>
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Nachrichten bearbeiten:
                    </p>
                    <div className="space-y-2">
                      {[
                        { id: 'welcome', label: 'Begrüßung', text: 'Hallo! Wie kann ich helfen?', show: 3 },
                        { id: 'time', label: 'Uhrzeit-Frage', text: 'Wann passt es dir?', show: 4 },
                        { id: 'confirm', label: 'Bestätigung', text: 'Alles klar, reserviert!', show: 5 },
                        { id: 'reminder', label: 'Reminder', text: 'Erinnerung in 4h', show: 6 },
                      ].map((msg) => (
                        msg.show <= currentStep && (
                          <div
                            key={msg.id}
                            className={`rounded-lg border p-2 transition-all ${
                              activeMessage === msg.id
                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                : 'border-zinc-800 bg-zinc-900'
                            }`}
                            style={{ animation: msg.show === currentStep ? 'nodeAppear 0.4s ease' : undefined }}
                          >
                            <p className={`text-[9px] ${activeMessage === msg.id ? 'text-indigo-400' : 'text-zinc-500'}`}>
                              {msg.label}
                            </p>
                            <p className="text-[11px] text-white">{msg.text}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </>
                )}

                {currentStep === 7 && (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                      <Check className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-base font-semibold text-white">Flow ist live!</p>
                    <p className="mt-1 text-xs text-zinc-400">Nachrichten werden automatisch beantwortet</p>
                    <div className="mt-4 flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-400">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium">Aktiv</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cursor */}
              {showCursor && (
                <div
                  className="pointer-events-none absolute z-50 transition-all duration-700 ease-out"
                  style={{ left: cursorPos.x, top: cursorPos.y }}
                >
                  <MousePointer2 className="h-5 w-5 -rotate-12 fill-white text-white drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Right Panel - Canvas (hidden on mobile) */}
            <div className="relative hidden flex-1 overflow-hidden bg-[#08080a] md:block">
              {/* Grid */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `radial-gradient(circle, #444 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Header */}
              <div className="relative flex items-center justify-between px-4 py-3">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                  Flow-Canvas
                </span>
                <span className="flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-[8px] text-zinc-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Live-Sync
                </span>
              </div>

              {/* Canvas Area - Nodes and Connections */}
              <div className="relative mx-4 h-[280px]">
                {/* SVG Connections */}
                <svg className="absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  {connections.map((conn) => {
                    if (conn.showAt > currentStep) return null;

                    const fromNode = canvasNodes.find((n) => n.id === conn.from);
                    const toNode = canvasNodes.find((n) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;

                    // Center X of nodes, bottom of from node to top of to node
                    const fromX = fromNode.x + nodeWidth / 2;
                    const fromY = fromNode.y + nodeHeight;
                    const toX = toNode.x + nodeWidth / 2;
                    const toY = toNode.y;

                    return (
                      <g key={`${conn.from}-${conn.to}`}>
                        {/* Connection line */}
                        <line
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke="url(#lineGrad)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          style={{ animation: 'fadeIn 0.5s ease forwards' }}
                        />
                        {/* Arrow dot at end */}
                        <circle
                          cx={toX}
                          cy={toY}
                          r="4"
                          fill="#8b5cf6"
                          style={{ animation: 'fadeIn 0.5s ease forwards' }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes */}
                {canvasNodes.map((node) => {
                  if (node.showAt > currentStep) return null;

                  return (
                    <div
                      key={node.id}
                      className={`absolute flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[10px] font-medium shadow-lg ${getNodeStyle(node.type)}`}
                      style={{
                        left: node.x,
                        top: node.y,
                        width: nodeWidth,
                        height: nodeHeight,
                        animation: node.showAt === currentStep ? 'nodeAppear 0.5s ease forwards' : undefined,
                      }}
                    >
                      {getNodeIcon(node.type)}
                      {node.label}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Status */}
              {currentStep >= 2 && (
                <div className="absolute bottom-3 left-4 right-4">
                  <div className={`rounded-lg border p-2 text-center transition-all ${
                    currentStep === 7
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900/80'
                  }`}>
                    <p className={`text-[10px] font-medium ${
                      currentStep === 7 ? 'text-emerald-400' : 'text-zinc-400'
                    }`}>
                      {currentStep === 7
                        ? '✓ 5 Nodes verbunden – Flow aktiv'
                        : `${Math.min(currentStep - 1, 5)} von 5 Nodes erstellt`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Laptop Base */}
        <div className="relative mx-auto h-3 w-[85%] rounded-b-xl bg-gradient-to-b from-zinc-700 to-zinc-800 sm:h-4 sm:w-[80%]">
          <div className="absolute left-1/2 top-0 h-0.5 w-12 -translate-x-1/2 rounded-b bg-zinc-600 sm:h-1 sm:w-16" />
        </div>
        <div className="mx-auto h-1 w-[92%] rounded-b-lg bg-zinc-800 shadow-xl sm:h-1.5 sm:w-[90%]" />
      </div>

      {/* Feature Pills */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3">
        {['Drag & Drop', 'Branchen-Templates', 'Live-Vorschau', 'Keine Programmierung'].map((feature) => (
          <span
            key={feature}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] text-zinc-400 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
          >
            <Check className="h-2.5 w-2.5 text-emerald-500 sm:h-3 sm:w-3" />
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}
