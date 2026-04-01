'use client';

import { useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  ListChecks,
  MessageCircle,
  Phone,
  Users,
  Zap,
} from "lucide-react";
import { Node, Edge } from "reactflow";
import type { FlowTrigger, FlowQuickReply, FlowMetadata } from "../../lib/flowTypes";
import { getWizardCopy, type VerticalKey } from "../../lib/verticals";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

type WizardConfig = {
  // Step 1: Greeting
  restaurantName: string;
  greetingMessage: string;
  triggerKeywords: string[];
  triggerInput: string;
  // Step 2: Einstieg
  // Step 3: Dates
  dateOptions: ("heute" | "morgen" | "uebermorgen" | "wunschdatum")[];
  // Step 4: Times
  timeSlots: string[];
  customTimeSlots: string;
  // Step 5: Guests
  maxGuests: number;
  guestOptions: number[];
  // Step 6: Contact
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
    metadata: FlowMetadata;
  }) => void;
  onCancel: () => void;
  vertical?: VerticalKey | null;
};

const buildGreetingMessage = (restaurantName: string, question: string) => {
  const trimmedName = restaurantName.trim();
  const intro = trimmedName
    ? `Willkommen bei ${trimmedName}! 👋`
    : "Willkommen! 👋";
  return `${intro} Schön, dass du uns schreibst. ${question}`;
};

const buildConfirmationMessage = (restaurantName: string, confirmationText: string) => {
  const trimmedName = restaurantName.trim();
  const intro = trimmedName
    ? `Danke für deine Anfrage bei ${trimmedName}.`
    : "Danke für deine Anfrage.";
  return `${intro} ${confirmationText}`;
};

const buildDefaultConfig = (copy: ReturnType<typeof getWizardCopy>): WizardConfig => ({
  restaurantName: "",
  greetingMessage: buildGreetingMessage("", copy.greetingQuestion),
  triggerKeywords: [...copy.triggerKeywords],
  triggerInput: "",
  dateOptions: ["heute", "morgen", "wunschdatum"],
  timeSlots: ["12:00", "13:00", "18:00", "19:00", "20:00"],
  customTimeSlots: "",
  maxGuests: 8,
  guestOptions: [1, 2, 3, 4, 5, 6],
  collectPhone: true,
  collectEmail: false,
  collectSpecialRequests: true,
  confirmationMessage: buildConfirmationMessage("", copy.confirmationText),
});

const DATE_OPTIONS = [
  { id: "heute", label: "Heute" },
  { id: "morgen", label: "Morgen" },
  { id: "uebermorgen", label: "Übermorgen" },
  { id: "wunschdatum", label: "Wunschdatum" },
] as const;

const TIME_PRESETS = [
  { label: "Mittag (11-14 Uhr)", slots: ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30"] },
  { label: "Abend (17-21 Uhr)", slots: ["17:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"] },
  { label: "Ganztags", slots: ["11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00"] },
];

const STEP_HEADER_CLASS = "flex items-center gap-4 text-[#2563EB]";
const STEP_TITLE_CLASS = "text-[32px] font-semibold tracking-tight text-[#0F172A] sm:text-[36px]";
const STEP_COPY_CLASS = "text-[19px] leading-8 text-[#475569]";
const STEP_HINT_CLASS = "text-[15px] leading-7 text-[#94A3B8]";
const FIELD_LABEL_CLASS = "mb-3 block text-[17px] font-semibold text-[#334155]";
const INPUT_CLASS = "app-input rounded-2xl px-5 py-4 font-medium text-[#0F172A] placeholder:text-[#94A3B8]";
const SELECTION_CARD_BASE_CLASS = "flex items-center gap-4 rounded-3xl border-2 p-5 text-left transition";
const SELECTION_CARD_SELECTED_CLASS = "border-[#93C5FD] bg-[#EFF6FF]";
const SELECTION_CARD_IDLE_CLASS = "border-[#E2E8F0] bg-white hover:border-[#BFDBFE] hover:bg-[#F8FAFC]";
const INPUT_TEXT_STYLE = { fontSize: "18px", lineHeight: "1.45" } as const;
const TEXTAREA_TEXT_STYLE = { fontSize: "18px", lineHeight: "1.6" } as const;

export default function FlowSetupWizard({ onComplete, onCancel, vertical }: FlowSetupWizardProps) {
  const copy = getWizardCopy(vertical);
  const [step, setStep] = useState<WizardStep>(1);
  const [config, setConfig] = useState<WizardConfig>(() => buildDefaultConfig(copy));
  const [greetingTouched, setGreetingTouched] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);

  const updateConfig = useCallback(<K extends keyof WizardConfig>(key: K, value: WizardConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const syncAutoMessages = useCallback((restaurantName: string, currentConfig: WizardConfig) => {
    const nextGreeting = buildGreetingMessage(restaurantName, copy.greetingQuestion);
    if (!greetingTouched && currentConfig.greetingMessage !== nextGreeting) {
      updateConfig("greetingMessage", nextGreeting);
    }

    const nextConfirmation = buildConfirmationMessage(restaurantName, copy.confirmationText);
    if (!confirmationTouched && currentConfig.confirmationMessage !== nextConfirmation) {
      updateConfig("confirmationMessage", nextConfirmation);
    }
  }, [confirmationTouched, copy.confirmationText, copy.greetingQuestion, greetingTouched, updateConfig]);

  useEffect(() => {
    syncAutoMessages(config.restaurantName, config);
  }, [config, syncAutoMessages]);

  useEffect(() => {
    setConfig(buildDefaultConfig(copy));
    setGreetingTouched(false);
    setConfirmationTouched(false);
  }, [copy]);

  const canProceed = useCallback(() => {
    switch (step) {
      case 1:
        return config.restaurantName.trim().length > 0;
      case 2:
        return config.triggerKeywords.length > 0;
      case 3:
        return config.dateOptions.length > 0;
      case 4:
        return config.timeSlots.length > 0;
      case 5:
        return config.guestOptions.length > 0;
      case 6:
        return true;
    }
  }, [step, config]);

  const nextStep = () => {
    if (step < 6) setStep((step + 1) as WizardStep);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const generateFlow = useCallback(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const makeEdgeId = (source: string, target: string) => `e-${source}-${target}`;
    const makeQuickReply = (id: string, label: string, targetNodeId: string): FlowQuickReply => ({
      id,
      label,
      payload: label.toUpperCase().replace(/\s+/g, "_"),
      targetNodeId,
    });

    const greetingId = "wizard-greeting";
    const dateNodeId = "wizard-date";
    const timeNodeId = "wizard-time";
    const guestNodeId = "wizard-guest";
    const nameNodeId = "wizard-name";
    const phoneNodeId = "wizard-phone";
    const emailNodeId = "wizard-email";
    const specialNodeId = "wizard-special";
    const confirmNodeId = "wizard-confirm";

    const wantsCustomDate = config.dateOptions.includes("wunschdatum");
    const dateCustomNodeId = wantsCustomDate ? "wizard-date-input" : null;
    const allowCustomTime = true;
    const timeCustomNodeId = allowCustomTime ? "wizard-time-input" : null;

    const baseGuestOptions = config.guestOptions.slice(0, 4);
    const maxBaseGuests = baseGuestOptions.length
      ? Math.max(...baseGuestOptions)
      : 0;
    const shouldOfferCustomGuests =
      config.guestOptions.length > baseGuestOptions.length ||
      config.maxGuests > maxBaseGuests;
    const guestCustomNodeId = shouldOfferCustomGuests ? "wizard-guest-input" : null;
    const nameNodeY = guestCustomNodeId ? 1080 : 920;

    // Node 1: Greeting
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
          makeQuickReply("qr-yes", copy.startQuickReply, dateNodeId),
        ],
      },
    });

    // Node 2: Date selection
    const dateQuickReplies = config.dateOptions.map((opt) => {
      if (opt === "wunschdatum" && dateCustomNodeId) {
        return makeQuickReply("qr-date-custom", "Wunschdatum", dateCustomNodeId);
      }
      const label = DATE_OPTIONS.find(d => d.id === opt)?.label || opt;
      return makeQuickReply(`qr-date-${opt}`, label, timeNodeId);
    });

    nodes.push({
      id: dateNodeId,
      position: { x: 100, y: 280 },
      type: "wesponde",
      data: {
        label: "Datum wählen",
        text: copy.datePrompt,
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

    if (dateCustomNodeId) {
      nodes.push({
        id: dateCustomNodeId,
        position: { x: 100, y: 420 },
        type: "wesponde",
        data: {
          label: "Wunschdatum",
          text: "Nenne uns bitte dein Wunschdatum (z. B. 14.02. oder Samstag).",
          variant: "message",
          quickReplies: [],
          inputMode: "free_text",
          collects: "date",
          placeholder: "z. B. 14.02. oder Samstag",
        },
      });
      edges.push({
        id: makeEdgeId(dateNodeId, dateCustomNodeId),
        source: dateNodeId,
        target: dateCustomNodeId,
        data: { quickReplyId: "qr-date-custom" },
      });
      edges.push({
        id: makeEdgeId(dateCustomNodeId, timeNodeId),
        source: dateCustomNodeId,
        target: timeNodeId,
      });
    }

    // Node 3: Time selection
    const timeQuickReplies = [
      ...config.timeSlots.slice(0, 4).map((slot) =>
        makeQuickReply(`qr-time-${slot}`, `${slot} Uhr`, guestNodeId)
      ),
      ...(timeCustomNodeId
        ? [makeQuickReply("qr-time-custom", "Andere Uhrzeit", timeCustomNodeId)]
        : []),
    ];

    nodes.push({
      id: timeNodeId,
      position: { x: 100, y: 460 },
      type: "wesponde",
      data: {
        label: "Uhrzeit wählen",
        text: copy.timePrompt,
        variant: "message",
        inputMode: "buttons",
        quickReplies: timeQuickReplies,
      },
    });
    // Edges from date options to time
    dateQuickReplies
      .filter((qr) => qr.targetNodeId === timeNodeId)
      .forEach((qr) => {
        edges.push({
          id: makeEdgeId(dateNodeId, `${timeNodeId}-${qr.id}`),
          source: dateNodeId,
          target: timeNodeId,
          data: { quickReplyId: qr.id },
        });
      });

    if (timeCustomNodeId) {
      nodes.push({
        id: timeCustomNodeId,
        position: { x: 100, y: 600 },
        type: "wesponde",
        data: {
          label: "Wunschzeit",
          text: "Welche Uhrzeit wünschst du dir? (z. B. 19:30)",
          variant: "message",
          quickReplies: [],
          inputMode: "free_text",
          collects: "time",
          placeholder: "z. B. 19:30",
        },
      });
      edges.push({
        id: makeEdgeId(timeNodeId, timeCustomNodeId),
        source: timeNodeId,
        target: timeCustomNodeId,
        data: { quickReplyId: "qr-time-custom" },
      });
      edges.push({
        id: makeEdgeId(timeCustomNodeId, guestNodeId),
        source: timeCustomNodeId,
        target: guestNodeId,
      });
    }

    // Node 4: Guest count
    const guestQuickReplies = [
      ...baseGuestOptions.map((count) =>
        makeQuickReply(
          `qr-guests-${count}`,
          `${count} ${count === 1 ? copy.participantUnitSingular : copy.participantUnitPlural}`,
          nameNodeId
        )
      ),
      ...(guestCustomNodeId
        ? [makeQuickReply("qr-guests-custom", copy.participantsCustomLabel, guestCustomNodeId)]
        : []),
    ];

    nodes.push({
      id: guestNodeId,
      position: { x: 100, y: 740 },
      type: "wesponde",
      data: {
        label: copy.participantsLabel,
        text: copy.participantsQuestion,
        variant: "message",
        inputMode: "buttons",
        quickReplies: guestQuickReplies,
      },
    });
    timeQuickReplies.forEach((qr) => {
      if (qr.targetNodeId === guestNodeId) {
        edges.push({
          id: makeEdgeId(timeNodeId, `${guestNodeId}-${qr.id}`),
          source: timeNodeId,
          target: guestNodeId,
          data: { quickReplyId: qr.id },
        });
      }
    });

    if (guestCustomNodeId) {
      nodes.push({
        id: guestCustomNodeId,
        position: { x: 100, y: 920 },
        type: "wesponde",
        data: {
          label: copy.participantsLabel,
          text: copy.participantsCustomPrompt,
          variant: "message",
          quickReplies: [],
          inputMode: "free_text",
          collects: "guestCount",
          placeholder: copy.participantsPlaceholder,
        },
      });
      edges.push({
        id: makeEdgeId(guestNodeId, guestCustomNodeId),
        source: guestNodeId,
        target: guestCustomNodeId,
        data: { quickReplyId: "qr-guests-custom" },
      });
      edges.push({
        id: makeEdgeId(guestCustomNodeId, nameNodeId),
        source: guestCustomNodeId,
        target: nameNodeId,
      });
    }

    // Node 5: Name (Freitext)
    nodes.push({
      id: nameNodeId,
      position: { x: 100, y: nameNodeY },
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
      if (qr.targetNodeId === nameNodeId) {
        edges.push({
          id: makeEdgeId(guestNodeId, `${nameNodeId}-${qr.id}`),
          source: guestNodeId,
          target: nameNodeId,
          data: { quickReplyId: qr.id },
        });
      }
    });

    let lastNodeId = nameNodeId;
    let currentY = nameNodeY + 180;

    if (config.collectPhone) {
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
    const triggerKeywords = Array.from(
      new Set(
        config.triggerKeywords
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      )
    );

    const triggers: FlowTrigger[] = [
      {
        id: "trigger-wizard-1",
        type: "KEYWORD",
        config: {
          keywords: triggerKeywords.length
            ? triggerKeywords
            : copy.triggerKeywords,
          matchType: "CONTAINS",
        },
        startNodeId: greetingId,
      },
    ];

    const requiredFields =
      vertical === "gastro" || !vertical
        ? ["name", "date", "time", "guestCount"]
        : ["name", "date", "time"];

    const metadata: FlowMetadata = {
      version: "1.0",
      output_config: {
        type: "reservation",
        requiredFields,
        defaults: requiredFields.includes("guestCount") ? undefined : { guestCount: 1 },
      },
    };

    onComplete({
      nodes,
      edges,
      triggers,
      name: `${config.restaurantName} - ${copy.flowNameSuffix}`,
      metadata,
    });
  }, [config, copy, onComplete, vertical]);

  const renderStepIndicator = () => (
    <div className="mb-12 flex items-center justify-center gap-3.5">
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <div
          key={s}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold transition-all ${
            s === step
              ? "scale-110 bg-[#2563EB] text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)]"
              : s < step
                ? "border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                : "border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]"
          }`}
        >
          {s < step ? <Check className="h-4 w-4" /> : s}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className={STEP_HEADER_CLASS}>
        <MessageCircle className="h-7 w-7" />
        <h2 className={STEP_TITLE_CLASS}>Begrüßung</h2>
      </div>
      <p className={STEP_COPY_CLASS}>
        Wie heißt dein {copy.businessTypeLabel} und wie möchtest du deine {copy.customerPlural} begrüßen?
      </p>
      <p className={STEP_HINT_CLASS}>
        Tipp: Der {copy.businessTypeLabel}-Name wird automatisch in die Begrüßung eingefügt.
      </p>

      <div className="space-y-6">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            {copy.businessLabel} *
          </label>
          <input
            type="text"
            value={config.restaurantName}
            onChange={(e) => updateConfig("restaurantName", e.target.value)}
            placeholder={copy.businessPlaceholder}
            className={`w-full ${INPUT_CLASS}`}
            style={INPUT_TEXT_STYLE}
          />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>
            Begrüßungsnachricht
          </label>
          <textarea
            value={config.greetingMessage}
            onChange={(e) => {
              setGreetingTouched(true);
              updateConfig("greetingMessage", e.target.value);
            }}
            rows={5}
            className="app-input w-full resize-none rounded-2xl px-5 py-4 font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            style={TEXTAREA_TEXT_STYLE}
          />
          <p className={`mt-1 ${STEP_HINT_CLASS}`}>
            Diese Nachricht sehen {copy.customerPlural} als erstes, wenn sie die Unterhaltung starten.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className={STEP_HEADER_CLASS}>
        <Zap className="h-7 w-7" />
        <h2 className={STEP_TITLE_CLASS}>Einstieg</h2>
      </div>
      <p className={STEP_COPY_CLASS}>
        Welche Wörter tippen {copy.customerPlural}, um die Unterhaltung zu starten?
      </p>

      <div className="space-y-6">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            Einstiegswörter *
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={config.triggerInput}
              onChange={(e) => updateConfig("triggerInput", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const nextValue = config.triggerInput.trim();
                  if (nextValue && !config.triggerKeywords.includes(nextValue)) {
                    updateConfig("triggerKeywords", [...config.triggerKeywords, nextValue]);
                    updateConfig("triggerInput", "");
                  }
                }
              }}
              placeholder={`z. B. ${copy.triggerKeywords.slice(0, 2).join(", ")}`}
              className={`flex-1 ${INPUT_CLASS}`}
              style={INPUT_TEXT_STYLE}
            />
            <button
              type="button"
              onClick={() => {
                const nextValue = config.triggerInput.trim();
                if (nextValue && !config.triggerKeywords.includes(nextValue)) {
                  updateConfig("triggerKeywords", [...config.triggerKeywords, nextValue]);
                  updateConfig("triggerInput", "");
                }
              }}
              className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-5 py-3 text-base font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
            >
              Hinzufügen
            </button>
          </div>
          {config.triggerKeywords.length > 0 ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2563EB]">Auswahl</span>
                <span className="text-[#94A3B8]">
                  {config.triggerKeywords.length} ausgewählt
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.triggerKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-1.5 text-[15px] font-semibold text-[#2563EB]"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig(
                          "triggerKeywords",
                          config.triggerKeywords.filter((item) => item !== keyword),
                        )
                      }
                      className="text-[#2563EB]/60 hover:text-[#1D4ED8]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#DC2626]">
              Bitte mindestens ein Wort hinzufügen.
            </p>
          )}
          <p className={`mt-2 ${STEP_HINT_CLASS}`}>
            {copy.customerPlural} nutzen diese Wörter, um die Unterhaltung zu beginnen.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className={STEP_HEADER_CLASS}>
        <CalendarDays className="h-7 w-7" />
        <h2 className={STEP_TITLE_CLASS}>Datum-Optionen</h2>
      </div>
      <p className={STEP_COPY_CLASS}>
        Welche Tage sollen {copy.customerPlural} zur Auswahl haben?
      </p>

      <div className="grid grid-cols-2 gap-4">
        {DATE_OPTIONS.map((opt) => {
          const isSelected = config.dateOptions.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (isSelected) {
                  updateConfig("dateOptions", config.dateOptions.filter((d) => d !== opt.id));
                } else {
                  updateConfig("dateOptions", [...config.dateOptions, opt.id]);
                }
              }}
              className={`${SELECTION_CARD_BASE_CLASS} ${
                isSelected ? SELECTION_CARD_SELECTED_CLASS : SELECTION_CARD_IDLE_CLASS
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 ${
                  isSelected ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#CBD5E1] bg-white"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className={`text-base font-medium ${isSelected ? "text-[#2563EB]" : "text-[#334155]"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className={STEP_HINT_CLASS}>
        Tipp: Mit „Wunschdatum“ können {copy.customerPlural} ein konkretes Datum eintippen.
      </p>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className={STEP_HEADER_CLASS}>
        <Clock className="h-7 w-7" />
        <h2 className={STEP_TITLE_CLASS}>Uhrzeiten</h2>
      </div>
      <p className={STEP_COPY_CLASS}>
        Welche Uhrzeiten bietest du für {copy.bookingNounPlural} an? {copy.customerPlural} können auch eine andere Uhrzeit anfragen.
      </p>

      <div className="space-y-6">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            Schnellauswahl
          </label>
          <div className="flex flex-wrap gap-3">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => updateConfig("timeSlots", preset.slots)}
                className={`rounded-full border px-5 py-2.5 text-[15px] font-medium transition ${
                  JSON.stringify(config.timeSlots) === JSON.stringify(preset.slots)
                    ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#BFDBFE] hover:text-[#0F172A]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>
            Aktuelle Auswahl
          </label>
          <div className="flex min-h-[72px] flex-wrap gap-3 rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            {config.timeSlots.map((slot) => (
              <span
                key={slot}
                className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-1.5 text-[15px] font-medium text-[#2563EB]"
              >
                {slot} Uhr
                <button
                  type="button"
                  onClick={() => updateConfig("timeSlots", config.timeSlots.filter((s) => s !== slot))}
                  className="ml-1 text-[#2563EB]/60 hover:text-[#DC2626]"
                >
                  ×
                </button>
              </span>
            ))}
            {config.timeSlots.length === 0 && (
              <span className="text-sm text-[#94A3B8]">Keine Uhrzeiten ausgewählt</span>
            )}
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>
            Eigene Zeiten hinzufügen
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={config.customTimeSlots}
              onChange={(e) => updateConfig("customTimeSlots", e.target.value)}
              placeholder="z.B. 14:30"
              className={`flex-1 ${INPUT_CLASS}`}
              style={INPUT_TEXT_STYLE}
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
              className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-5 py-3 text-base font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8">
      <div className={STEP_HEADER_CLASS}>
        <Users className="h-7 w-7" />
        <h2 className={STEP_TITLE_CLASS}>{copy.participantsLabel}</h2>
      </div>
      <p className={STEP_COPY_CLASS}>
        Wie viele {copy.customerPlural} können maximal gleichzeitig {copy.bookingVerb}?
      </p>

      <div className="space-y-6">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            Maximale {copy.participantsLabel}
          </label>
          <input
            type="range"
            min="2"
            max="20"
            value={config.maxGuests}
            onChange={(e) => {
              const max = parseInt(e.target.value);
              updateConfig("maxGuests", max);
              const options = [];
              for (let i = 1; i <= Math.min(max, 6); i++) {
                options.push(i);
              }
              if (max > 6) options.push(max);
              updateConfig("guestOptions", options);
            }}
            className="w-full accent-[#2563EB]"
          />
          <div className="mt-1 flex justify-between text-[15px] text-[#94A3B8]">
            <span>2</span>
            <span className="font-semibold text-[#2563EB]">{config.maxGuests} {copy.participantUnitPlural}</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>
            Angezeigte Optionen (als Buttons)
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n <= config.maxGuests).map((num) => {
              const isSelected = config.guestOptions.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      updateConfig("guestOptions", config.guestOptions.filter((g) => g !== num));
                    } else {
                      updateConfig("guestOptions", [...config.guestOptions, num].sort((a, b) => a - b));
                    }
                  }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-semibold transition ${
                    isSelected
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#BFDBFE]"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <p className={`mt-2 ${STEP_HINT_CLASS}`}>
            Tipp: 4-6 Buttons sind optimal für die mobile Ansicht.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-8">
      <div className={STEP_HEADER_CLASS}>
        <Phone className="h-7 w-7" />
        <h2 className={STEP_TITLE_CLASS}>Kontaktdaten & Abschluss</h2>
      </div>
      <p className={STEP_COPY_CLASS}>
        Welche Informationen sollen am Ende erfragt werden?
      </p>
      <p className={STEP_HINT_CLASS}>
        Der Name wird immer abgefragt.
      </p>

      <div className="space-y-4">
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
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                isSelected ? SELECTION_CARD_SELECTED_CLASS : SELECTION_CARD_IDLE_CLASS
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 ${
                  isSelected ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#CBD5E1] bg-white"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className={`text-[17px] font-medium ${isSelected ? "text-[#2563EB]" : "text-[#334155]"}`}>
                {item.label}
              </span>
              {item.recommended && (
                <span className="ml-auto rounded-full bg-[#EFF6FF] px-3 py-1 text-[13px] font-semibold text-[#2563EB]">
                  Empfohlen
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <label className={FIELD_LABEL_CLASS}>
          Bestätigungsnachricht
        </label>
        <textarea
          value={config.confirmationMessage}
          onChange={(e) => {
            setConfirmationTouched(true);
            updateConfig("confirmationMessage", e.target.value);
          }}
          rows={5}
          className="app-input w-full resize-none rounded-2xl px-5 py-4 font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
          style={TEXTAREA_TEXT_STYLE}
        />
        <p className={`mt-1 ${STEP_HINT_CLASS}`}>
          Diese Nachricht sehen {copy.customerPlural} nach erfolgreicher Buchung.
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-8">
      <div className="app-panel rounded-[32px] p-10 shadow-[0_28px_70px_rgba(15,23,42,0.10)] sm:p-12 lg:p-14">
        <div className="mb-10 flex items-center gap-3 text-[#2563EB]">
          <ListChecks className="h-6 w-6" />
          <span className="text-base font-semibold uppercase tracking-[0.18em] text-[#2563EB]">Setup-Assistent</span>
        </div>

        {renderStepIndicator()}

        <div className="min-h-[460px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-[#E2E8F0] pt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-6 py-3 text-base font-semibold text-[#475569] transition-colors hover:border-[#BFDBFE] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="text-base font-semibold text-[#64748B] transition-colors hover:text-[#0F172A]"
            >
              Abbrechen
            </button>
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 rounded-full bg-[#2450b2] px-7 py-3 text-base font-semibold text-white shadow-[0_10px_28px_rgba(36,80,178,0.22)] transition-all hover:bg-[#1a46c4] disabled:opacity-50 disabled:shadow-none"
            >
              Weiter
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={generateFlow}
              className="inline-flex items-center gap-2 rounded-full bg-[#2450b2] px-7 py-3 text-base font-semibold text-white shadow-[0_10px_28px_rgba(36,80,178,0.22)] transition-all hover:bg-[#1a46c4]"
            >
              <ListChecks className="h-4 w-4" />
              Flow erstellen
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 text-sm text-[#94A3B8]">
        <span>Schritt {step} von 6</span>
        <span>•</span>
        <span>
          {step === 1 && "Begrüßung"}
          {step === 2 && "Einstieg"}
          {step === 3 && "Datum"}
          {step === 4 && "Uhrzeit"}
          {step === 5 && copy.participantsLabel}
          {step === 6 && "Abschluss"}
        </span>
      </div>
    </div>
  );
}
