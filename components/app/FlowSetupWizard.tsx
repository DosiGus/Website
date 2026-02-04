'use client';

import { useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  MessageCircle,
  Phone,
  Users,
  Sparkles,
} from "lucide-react";
import { Node, Edge } from "reactflow";
import type { FlowTrigger, FlowQuickReply } from "../../lib/flowTypes";

type WizardStep = 1 | 2 | 3 | 4 | 5;

type WizardConfig = {
  // Step 1: Greeting
  restaurantName: string;
  greetingMessage: string;
  // Step 2: Dates
  dateOptions: ("heute" | "morgen" | "uebermorgen" | "naechste_woche")[];
  // Step 3: Times
  timeSlots: string[];
  customTimeSlots: string;
  // Step 4: Guests
  maxGuests: number;
  guestOptions: number[];
  // Step 5: Contact
  collectPhone: boolean;
  collectEmail: boolean;
  collectSpecialRequests: boolean;
  confirmationMessage: string;
};

type FlowSetupWizardProps = {
  onComplete: (data: {
    nodes: Node[];
    edges: Edge[];
    triggers: FlowTrigger[];
    name: string;
  }) => void;
  onCancel: () => void;
};

const defaultConfig: WizardConfig = {
  restaurantName: "",
  greetingMessage: "Hallo! 👋 Schön, dass du uns schreibst. Möchtest du einen Tisch reservieren?",
  dateOptions: ["heute", "morgen"],
  timeSlots: ["12:00", "13:00", "18:00", "19:00", "20:00"],
  customTimeSlots: "",
  maxGuests: 8,
  guestOptions: [1, 2, 3, 4, 5, 6],
  collectPhone: true,
  collectEmail: false,
  collectSpecialRequests: true,
  confirmationMessage: "Perfekt! Deine Reservierung ist eingegangen. Wir bestätigen dir diese in Kürze. Bis bald! 🎉",
};

const DATE_OPTIONS = [
  { id: "heute", label: "Heute" },
  { id: "morgen", label: "Morgen" },
  { id: "uebermorgen", label: "Übermorgen" },
  { id: "naechste_woche", label: "Nächste Woche" },
] as const;

const TIME_PRESETS = [
  { label: "Mittag (11-14 Uhr)", slots: ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30"] },
  { label: "Abend (17-21 Uhr)", slots: ["17:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"] },
  { label: "Ganztags", slots: ["11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00"] },
];

export default function FlowSetupWizard({ onComplete, onCancel }: FlowSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [config, setConfig] = useState<WizardConfig>(defaultConfig);

  const updateConfig = useCallback(<K extends keyof WizardConfig>(key: K, value: WizardConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const canProceed = useCallback(() => {
    switch (step) {
      case 1:
        return config.restaurantName.trim().length > 0;
      case 2:
        return config.dateOptions.length > 0;
      case 3:
        return config.timeSlots.length > 0;
      case 4:
        return config.guestOptions.length > 0;
      case 5:
        return true;
    }
  }, [step, config]);

  const nextStep = () => {
    if (step < 5) setStep((step + 1) as WizardStep);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const generateFlow = useCallback(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeIdCounter = 1;

    const makeNodeId = () => `wizard-node-${nodeIdCounter++}`;
    const makeEdgeId = (source: string, target: string) => `e-${source}-${target}`;
    const makeQuickReply = (id: string, label: string, targetNodeId: string): FlowQuickReply => ({
      id,
      label,
      payload: label.toUpperCase().replace(/\s+/g, "_"),
      targetNodeId,
    });

    // Node 1: Greeting
    const greetingId = makeNodeId();
    const dateNodeId = makeNodeId();
    nodes.push({
      id: greetingId,
      position: { x: 100, y: 100 },
      type: "wesponde",
      data: {
        label: "Begrüßung",
        text: config.greetingMessage,
        variant: "message",
        isStart: true,
        inputMode: "buttons",
        quickReplies: [
          makeQuickReply("qr-yes", "Ja, reservieren", dateNodeId),
        ],
      },
    });

    // Node 2: Date selection
    const timeNodeId = makeNodeId();
    const dateQuickReplies = config.dateOptions.map((opt) => {
      const label = DATE_OPTIONS.find(d => d.id === opt)?.label || opt;
      return makeQuickReply(`qr-date-${opt}`, label, timeNodeId);
    });

    nodes.push({
      id: dateNodeId,
      position: { x: 100, y: 280 },
      type: "wesponde",
      data: {
        label: "Datum wählen",
        text: "Für welchen Tag möchtest du reservieren?",
        variant: "message",
        inputMode: "buttons",
        quickReplies: dateQuickReplies,
      },
    });
    edges.push({
      id: makeEdgeId(greetingId, dateNodeId),
      source: greetingId,
      target: dateNodeId,
      data: { quickReplyId: "qr-yes" },
    });

    // Node 3: Time selection
    const guestNodeId = makeNodeId();
    const timeQuickReplies = config.timeSlots.slice(0, 4).map((slot) =>
      makeQuickReply(`qr-time-${slot}`, `${slot} Uhr`, guestNodeId)
    );

    nodes.push({
      id: timeNodeId,
      position: { x: 100, y: 460 },
      type: "wesponde",
      data: {
        label: "Uhrzeit wählen",
        text: "Um wie viel Uhr?",
        variant: "message",
        inputMode: "buttons",
        quickReplies: timeQuickReplies,
      },
    });
    // Edges from date options to time
    dateQuickReplies.forEach((qr) => {
      edges.push({
        id: makeEdgeId(dateNodeId, `${timeNodeId}-${qr.id}`),
        source: dateNodeId,
        target: timeNodeId,
        data: { quickReplyId: qr.id },
      });
    });

    // Node 4: Guest count
    const nameNodeId = makeNodeId();
    const guestQuickReplies = config.guestOptions.slice(0, 4).map((count) =>
      makeQuickReply(`qr-guests-${count}`, `${count} ${count === 1 ? "Person" : "Personen"}`, nameNodeId)
    );

    nodes.push({
      id: guestNodeId,
      position: { x: 100, y: 640 },
      type: "wesponde",
      data: {
        label: "Personenanzahl",
        text: "Für wie viele Personen?",
        variant: "message",
        inputMode: "buttons",
        quickReplies: guestQuickReplies,
      },
    });
    timeQuickReplies.forEach((qr) => {
      edges.push({
        id: makeEdgeId(timeNodeId, `${guestNodeId}-${qr.id}`),
        source: timeNodeId,
        target: guestNodeId,
        data: { quickReplyId: qr.id },
      });
    });

    // Node 5: Name (Freitext)
    nodes.push({
      id: nameNodeId,
      position: { x: 100, y: 820 },
      type: "wesponde",
      data: {
        label: "Name",
        text: "Wie lautet dein Name?",
        variant: "message",
        quickReplies: [],
        inputMode: "free_text",
        collects: "name",
        placeholder: "z. B. Maria",
      },
    });
    guestQuickReplies.forEach((qr) => {
      edges.push({
        id: makeEdgeId(guestNodeId, `${nameNodeId}-${qr.id}`),
        source: guestNodeId,
        target: nameNodeId,
        data: { quickReplyId: qr.id },
      });
    });

    let lastNodeId = nameNodeId;
    let currentY = 1000;

    if (config.collectPhone) {
      const phoneNodeId = makeNodeId();
      nodes.push({
        id: phoneNodeId,
        position: { x: 100, y: currentY },
        type: "wesponde",
        data: {
          label: "Telefonnummer",
          text: "Wie lautet deine Telefonnummer?",
          variant: "message",
          quickReplies: [],
          inputMode: "free_text",
          collects: "phone",
          placeholder: "z. B. 0176 12345678",
        },
      });
      edges.push({
        id: makeEdgeId(lastNodeId, phoneNodeId),
        source: lastNodeId,
        target: phoneNodeId,
      });
      lastNodeId = phoneNodeId;
      currentY += 180;
    }

    if (config.collectEmail) {
      const emailNodeId = makeNodeId();
      nodes.push({
        id: emailNodeId,
        position: { x: 100, y: currentY },
        type: "wesponde",
        data: {
          label: "E‑Mail",
          text: "Wie lautet deine E‑Mail‑Adresse?",
          variant: "message",
          quickReplies: [],
          inputMode: "free_text",
          collects: "email",
          placeholder: "z. B. maria@example.com",
        },
      });
      edges.push({
        id: makeEdgeId(lastNodeId, emailNodeId),
        source: lastNodeId,
        target: emailNodeId,
      });
      lastNodeId = emailNodeId;
      currentY += 180;
    }

    if (config.collectSpecialRequests) {
      const specialNodeId = makeNodeId();
      nodes.push({
        id: specialNodeId,
        position: { x: 100, y: currentY },
        type: "wesponde",
        data: {
          label: "Wünsche",
          text: "Gibt es besondere Wünsche?",
          variant: "message",
          quickReplies: [],
          inputMode: "free_text",
          collects: "specialRequests",
          placeholder: "z. B. Kinderstuhl, Allergie",
        },
      });
      edges.push({
        id: makeEdgeId(lastNodeId, specialNodeId),
        source: lastNodeId,
        target: specialNodeId,
      });
      lastNodeId = specialNodeId;
      currentY += 180;
    }

    const confirmNodeId = makeNodeId();
    nodes.push({
      id: confirmNodeId,
      position: { x: 100, y: currentY },
      type: "wesponde",
      data: {
        label: "Bestätigung",
        text: config.confirmationMessage,
        variant: "message",
        quickReplies: [],
        isEnd: true,
      },
    });
    edges.push({
      id: makeEdgeId(lastNodeId, confirmNodeId),
      source: lastNodeId,
      target: confirmNodeId,
    });

    // Create trigger
    const triggers: FlowTrigger[] = [
      {
        id: "trigger-wizard-1",
        type: "KEYWORD",
        config: {
          keywords: ["reservieren", "tisch", "reservierung", "buchen"],
          matchType: "CONTAINS",
        },
        startNodeId: greetingId,
      },
    ];

    onComplete({
      nodes,
      edges,
      triggers,
      name: `${config.restaurantName} - Reservierung`,
    });
  }, [config, onComplete]);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
            s === step
              ? "bg-emerald-500 text-white scale-110"
              : s < step
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-white/10 text-zinc-500"
          }`}
        >
          {s < step ? <Check className="h-4 w-4" /> : s}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-emerald-400">
        <MessageCircle className="h-6 w-6" />
        <h2 className="text-xl font-semibold text-white">Begrüßung</h2>
      </div>
      <p className="text-zinc-400">
        Wie heißt dein Restaurant und wie möchtest du deine Gäste begrüßen?
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Restaurant-Name *
          </label>
          <input
            type="text"
            value={config.restaurantName}
            onChange={(e) => updateConfig("restaurantName", e.target.value)}
            placeholder="z.B. Pizzeria Milano"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Begrüßungsnachricht
          </label>
          <textarea
            value={config.greetingMessage}
            onChange={(e) => updateConfig("greetingMessage", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Diese Nachricht sehen Gäste als erstes, wenn sie den Bot starten.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-emerald-400">
        <CalendarDays className="h-6 w-6" />
        <h2 className="text-xl font-semibold text-white">Datum-Optionen</h2>
      </div>
      <p className="text-zinc-400">
        Welche Tage sollen Gäste zur Auswahl haben?
      </p>

      <div className="grid grid-cols-2 gap-3">
        {DATE_OPTIONS.map((opt) => {
          const isSelected = config.dateOptions.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (isSelected) {
                  updateConfig("dateOptions", config.dateOptions.filter(d => d !== opt.id));
                } else {
                  updateConfig("dateOptions", [...config.dateOptions, opt.id]);
                }
              }}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                  isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-600"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className={`font-medium ${isSelected ? "text-emerald-400" : "text-zinc-300"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Wähle mindestens eine Option. Du kannst später weitere hinzufügen.
      </p>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-emerald-400">
        <Clock className="h-6 w-6" />
        <h2 className="text-xl font-semibold text-white">Uhrzeiten</h2>
      </div>
      <p className="text-zinc-400">
        Welche Uhrzeiten bietest du für Reservierungen an?
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-3">
            Schnellauswahl
          </label>
          <div className="flex flex-wrap gap-2">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => updateConfig("timeSlots", preset.slots)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  JSON.stringify(config.timeSlots) === JSON.stringify(preset.slots)
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 text-zinc-400 hover:border-white/20"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Aktuelle Auswahl
          </label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-3 min-h-[60px]">
            {config.timeSlots.map((slot) => (
              <span
                key={slot}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-white/10 px-3 py-1 text-sm font-medium text-zinc-300"
              >
                {slot} Uhr
                <button
                  type="button"
                  onClick={() => updateConfig("timeSlots", config.timeSlots.filter(s => s !== slot))}
                  className="ml-1 text-zinc-500 hover:text-rose-400"
                >
                  ×
                </button>
              </span>
            ))}
            {config.timeSlots.length === 0 && (
              <span className="text-sm text-zinc-500">Keine Uhrzeiten ausgewählt</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Eigene Zeiten hinzufügen
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={config.customTimeSlots}
              onChange={(e) => updateConfig("customTimeSlots", e.target.value)}
              placeholder="z.B. 14:30"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const time = config.customTimeSlots.trim();
                if (time && !config.timeSlots.includes(time)) {
                  updateConfig("timeSlots", [...config.timeSlots, time].sort());
                  updateConfig("customTimeSlots", "");
                }
              }}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/15"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-emerald-400">
        <Users className="h-6 w-6" />
        <h2 className="text-xl font-semibold text-white">Personenanzahl</h2>
      </div>
      <p className="text-zinc-400">
        Wie viele Gäste können maximal einen Tisch reservieren?
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Maximale Gästeanzahl
          </label>
          <input
            type="range"
            min="2"
            max="20"
            value={config.maxGuests}
            onChange={(e) => {
              const max = parseInt(e.target.value);
              updateConfig("maxGuests", max);
              // Auto-generate options based on max
              const options = [];
              for (let i = 1; i <= Math.min(max, 6); i++) {
                options.push(i);
              }
              if (max > 6) options.push(max);
              updateConfig("guestOptions", options);
            }}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-sm text-zinc-500 mt-1">
            <span>2</span>
            <span className="font-semibold text-emerald-400">{config.maxGuests} Personen</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Angezeigte Optionen (als Buttons)
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].filter(n => n <= config.maxGuests).map((num) => {
              const isSelected = config.guestOptions.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      updateConfig("guestOptions", config.guestOptions.filter(g => g !== num));
                    } else {
                      updateConfig("guestOptions", [...config.guestOptions, num].sort((a, b) => a - b));
                    }
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Tipp: 4-6 Buttons sind optimal für die mobile Ansicht.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-emerald-400">
        <Phone className="h-6 w-6" />
        <h2 className="text-xl font-semibold text-white">Kontaktdaten & Abschluss</h2>
      </div>
      <p className="text-zinc-400">
        Welche Informationen soll der Bot am Ende abfragen?
      </p>
      <p className="text-xs text-zinc-500">
        Der Name wird immer abgefragt.
      </p>

      <div className="space-y-3">
        {[
          { key: "collectPhone", label: "Telefonnummer", recommended: true },
          { key: "collectEmail", label: "E-Mail-Adresse", recommended: false },
          { key: "collectSpecialRequests", label: "Besondere Wünsche", recommended: true },
        ].map((item) => {
          const isSelected = config[item.key as keyof WizardConfig] as boolean;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => updateConfig(item.key as keyof WizardConfig, !isSelected as any)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                  isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-600"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className={`font-medium ${isSelected ? "text-emerald-400" : "text-zinc-300"}`}>
                {item.label}
              </span>
              {item.recommended && (
                <span className="ml-auto text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Empfohlen
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Bestätigungsnachricht
        </label>
        <textarea
          value={config.confirmationMessage}
          onChange={(e) => updateConfig("confirmationMessage", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Diese Nachricht sehen Gäste nach erfolgreicher Reservierung.
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-xl shadow-black/20">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 text-emerald-400">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Setup-Assistent</span>
        </div>

        {renderStepIndicator()}

        {/* Step Content */}
        <div className="min-h-[360px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-300"
            >
              Abbrechen
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50 disabled:shadow-none"
            >
              Weiter
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={generateFlow}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
            >
              <Sparkles className="h-4 w-4" />
              Flow erstellen
            </button>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <span>Schritt {step} von 5</span>
        <span>•</span>
        <span>
          {step === 1 && "Begrüßung"}
          {step === 2 && "Datum"}
          {step === 3 && "Uhrzeit"}
          {step === 4 && "Personen"}
          {step === 5 && "Abschluss"}
        </span>
      </div>
    </div>
  );
}
