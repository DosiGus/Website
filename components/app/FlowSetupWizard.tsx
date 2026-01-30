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
    const contactNodeId = makeNodeId();
    const guestQuickReplies = config.guestOptions.slice(0, 4).map((count) =>
      makeQuickReply(`qr-guests-${count}`, `${count} ${count === 1 ? "Person" : "Personen"}`, contactNodeId)
    );

    nodes.push({
      id: guestNodeId,
      position: { x: 100, y: 640 },
      type: "wesponde",
      data: {
        label: "Personenanzahl",
        text: "Für wie viele Personen?",
        variant: "message",
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

    // Node 5: Contact info collection
    let contactText = "Perfekt! Wie lautet dein Name";
    if (config.collectPhone) contactText += " und deine Telefonnummer";
    contactText += "?";
    if (config.collectSpecialRequests) {
      contactText += "\n\nGib auch gerne besondere Wünsche an (z.B. Kinderstuhl, Allergie).";
    }

    const confirmNodeId = makeNodeId();
    nodes.push({
      id: contactNodeId,
      position: { x: 100, y: 820 },
      type: "wesponde",
      data: {
        label: "Kontaktdaten",
        text: contactText,
        variant: "message",
        quickReplies: [],
        collectsInput: true,
      },
    });
    guestQuickReplies.forEach((qr) => {
      edges.push({
        id: makeEdgeId(guestNodeId, `${contactNodeId}-${qr.id}`),
        source: guestNodeId,
        target: contactNodeId,
        data: { quickReplyId: qr.id },
      });
    });

    // Node 6: Confirmation
    nodes.push({
      id: confirmNodeId,
      position: { x: 100, y: 1000 },
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
      id: makeEdgeId(contactNodeId, confirmNodeId),
      source: contactNodeId,
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
              ? "bg-brand text-white scale-110"
              : s < step
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {s < step ? <Check className="h-4 w-4" /> : s}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-brand">
        <MessageCircle className="h-6 w-6" />
        <h2 className="text-xl font-semibold">Begrüßung</h2>
      </div>
      <p className="text-slate-500">
        Wie heißt dein Restaurant und wie möchtest du deine Gäste begrüßen?
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Restaurant-Name *
          </label>
          <input
            type="text"
            value={config.restaurantName}
            onChange={(e) => updateConfig("restaurantName", e.target.value)}
            placeholder="z.B. Pizzeria Milano"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Begrüßungsnachricht
          </label>
          <textarea
            value={config.greetingMessage}
            onChange={(e) => updateConfig("greetingMessage", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          />
          <p className="mt-1 text-xs text-slate-400">
            Diese Nachricht sehen Gäste als erstes, wenn sie den Bot starten.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-brand">
        <CalendarDays className="h-6 w-6" />
        <h2 className="text-xl font-semibold">Datum-Optionen</h2>
      </div>
      <p className="text-slate-500">
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
                  ? "border-brand bg-brand/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                  isSelected ? "border-brand bg-brand text-white" : "border-slate-300"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className={`font-medium ${isSelected ? "text-brand" : "text-slate-700"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Wähle mindestens eine Option. Du kannst später weitere hinzufügen.
      </p>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-brand">
        <Clock className="h-6 w-6" />
        <h2 className="text-xl font-semibold">Uhrzeiten</h2>
      </div>
      <p className="text-slate-500">
        Welche Uhrzeiten bietest du für Reservierungen an?
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Aktuelle Auswahl
          </label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[60px]">
            {config.timeSlots.map((slot) => (
              <span
                key={slot}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700"
              >
                {slot} Uhr
                <button
                  type="button"
                  onClick={() => updateConfig("timeSlots", config.timeSlots.filter(s => s !== slot))}
                  className="ml-1 text-slate-400 hover:text-rose-500"
                >
                  ×
                </button>
              </span>
            ))}
            {config.timeSlots.length === 0 && (
              <span className="text-sm text-slate-400">Keine Uhrzeiten ausgewählt</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Eigene Zeiten hinzufügen
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={config.customTimeSlots}
              onChange={(e) => updateConfig("customTimeSlots", e.target.value)}
              placeholder="z.B. 14:30"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand focus:outline-none"
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
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
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
      <div className="flex items-center gap-3 text-brand">
        <Users className="h-6 w-6" />
        <h2 className="text-xl font-semibold">Personenanzahl</h2>
      </div>
      <p className="text-slate-500">
        Wie viele Gäste können maximal einen Tisch reservieren?
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
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
            className="w-full"
          />
          <div className="flex justify-between text-sm text-slate-500 mt-1">
            <span>2</span>
            <span className="font-semibold text-brand">{config.maxGuests} Personen</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                      ? "border-brand bg-brand text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Tipp: 4-6 Buttons sind optimal für die mobile Ansicht.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-brand">
        <Phone className="h-6 w-6" />
        <h2 className="text-xl font-semibold">Kontaktdaten & Abschluss</h2>
      </div>
      <p className="text-slate-500">
        Welche Informationen soll der Bot am Ende abfragen?
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
                  ? "border-brand bg-brand/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                  isSelected ? "border-brand bg-brand text-white" : "border-slate-300"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className={`font-medium ${isSelected ? "text-brand" : "text-slate-700"}`}>
                {item.label}
              </span>
              {item.recommended && (
                <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Empfohlen
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Bestätigungsnachricht
        </label>
        <textarea
          value={config.confirmationMessage}
          onChange={(e) => updateConfig("confirmationMessage", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
        />
        <p className="mt-1 text-xs text-slate-400">
          Diese Nachricht sehen Gäste nach erfolgreicher Reservierung.
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 text-brand">
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
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Abbrechen
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 disabled:opacity-50 disabled:shadow-none"
            >
              Weiter
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={generateFlow}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30"
            >
              <Sparkles className="h-4 w-4" />
              Flow erstellen
            </button>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
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
