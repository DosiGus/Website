'use client';

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Lock,
  Plug,
  Radio,
  X,
  Zap,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import useAccountVertical from "../../lib/useAccountVertical";
import Button from "../ui/Button";

type GuideTaskId = "instagram" | "google" | "flow" | "live";

type GuideStatus = {
  loading: boolean;
  metaConnected: boolean;
  googleConnected: boolean;
  flowCount: number;
  activeFlowCount: number;
  instagramLabel: string | null;
  activeFlowName: string | null;
};

type GuideTask = {
  id: GuideTaskId;
  title: string;
  description: string;
  helper: string;
  bullets: string[];
  href: string;
  icon: LucideIcon;
  actionLabel: string;
  statusLabel: string;
  complete: boolean;
  optional?: boolean;
  blocked?: boolean;
  matchPath: (pathname: string) => boolean;
};

const LEGACY_STEP_MAP: GuideTaskId[] = ["instagram", "flow", "live"];

const DEFAULT_STATUS: GuideStatus = {
  loading: true,
  metaConnected: false,
  googleConnected: false,
  flowCount: 0,
  activeFlowCount: 0,
  instagramLabel: null,
  activeFlowName: null,
};

export default function OnboardingGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { accountId, loading: accountLoading } = useAccountVertical();

  const [isOpen, setIsOpen] = useState(false);
  const [presentation, setPresentation] = useState<"hub" | "context">("hub");
  const [focusTaskId, setFocusTaskId] = useState<GuideTaskId | null>(null);
  const [didResolveAutoOpen, setDidResolveAutoOpen] = useState(false);
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<GuideStatus>(DEFAULT_STATUS);

  const loadStatus = useCallback(async () => {
    if (accountLoading) return;
    if (!accountId) {
      setStatus((current) => ({ ...current, loading: false }));
      return;
    }

    setStatus((current) => ({ ...current, loading: true }));

    const [integrationsRes, flowsRes] = await Promise.all([
      supabase
        .from("integrations")
        .select("provider,status,account_name,instagram_username")
        .eq("account_id", accountId),
      supabase
        .from("flows")
        .select("id,name,status")
        .eq("account_id", accountId),
    ]);

    const integrations = integrationsRes.data ?? [];
    const flows = flowsRes.data ?? [];

    const metaIntegration =
      integrations.find(
        (integration) =>
          integration.provider === "meta" && integration.status === "connected",
      ) ?? null;
    const googleIntegration =
      integrations.find(
        (integration) =>
          integration.provider === "google_calendar" &&
          integration.status === "connected",
      ) ?? null;
    const activeFlows = flows.filter((flow) => flow.status === "Aktiv");

    setStatus({
      loading: false,
      metaConnected: Boolean(metaIntegration),
      googleConnected: Boolean(googleIntegration),
      flowCount: flows.length,
      activeFlowCount: activeFlows.length,
      instagramLabel: metaIntegration?.instagram_username
        ? `@${metaIntegration.instagram_username}`
        : (metaIntegration?.account_name ?? null),
      activeFlowName: activeFlows[0]?.name ?? null,
    });
  }, [accountId, accountLoading, supabase]);

  const updateGuideMeta = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!userId) return;
      await supabase.auth.updateUser({ data: payload });
    },
    [supabase, userId],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user || cancelled) {
          setDismissed(true);
          return;
        }
        setUserId(data.user.id);
        setDismissed(Boolean(data.user.user_metadata?.onboarding_dismissed_at));
      } catch {
        if (!cancelled) setDismissed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!isOpen) return;

    const handleFocus = () => {
      void loadStatus();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isOpen, loadStatus]);

  useEffect(() => {
    if (!isOpen) return;
    void loadStatus();
  }, [isOpen, pathname, loadStatus]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ step?: number }>).detail;
      const mappedTaskId =
        typeof detail?.step === "number"
          ? (LEGACY_STEP_MAP[
              Math.max(0, Math.min(LEGACY_STEP_MAP.length - 1, detail.step))
            ] ?? null)
          : null;

      setFocusTaskId(mappedTaskId);
      setPresentation("hub");
      setIsOpen(true);
      void loadStatus();
    };

    window.addEventListener("wesponde:onboarding:open", handler);
    return () => window.removeEventListener("wesponde:onboarding:open", handler);
  }, [loadStatus]);

  const tasks = useMemo<GuideTask[]>(() => {
    const flowCountLabel =
      status.flowCount === 1
        ? "1 Flow vorhanden"
        : `${status.flowCount} Flows vorhanden`;
    const activeFlowLabel =
      status.activeFlowCount === 1
        ? "1 Flow aktiv"
        : `${status.activeFlowCount} Flows aktiv`;

    return [
      {
        id: "instagram",
        title: "Instagram verbinden",
        description: status.metaConnected
          ? `Instagram ist bereits verbunden${status.instagramLabel ? ` mit ${status.instagramLabel}` : ""}.`
          : "Verbinde deinen Instagram Business- oder Creator-Account, damit Wesponde Nachrichten automatisiert verarbeiten kann.",
        helper: status.metaConnected
          ? "Der wichtigste Kanal steht. Du kannst die Verbindung in Integrationen jederzeit prüfen."
          : "Ohne diesen Schritt kann Wesponde keine Instagram-DMs empfangen oder beantworten.",
        bullets: status.metaConnected
          ? [
              "Instagram-Kanal ist aktiv",
              "Verbindung kann in Integrationen geprüft werden",
            ]
          : [
              "Öffne Integrationen",
              "Klicke auf Instagram verbinden",
              "Bestätige den Meta-Zugriff",
            ],
        href: "/app/integrations",
        icon: Plug,
        actionLabel: status.metaConnected
          ? "Integrationen öffnen"
          : "Instagram verbinden",
        statusLabel: status.metaConnected
          ? (status.instagramLabel ?? "Verbunden")
          : "Pflichtschritt",
        complete: status.metaConnected,
        matchPath: (currentPath) => currentPath.startsWith("/app/integrations"),
      },
      {
        id: "google",
        title: "Google Kalender verbinden",
        description: status.googleConnected
          ? "Google Kalender ist verbunden."
          : "Optional: Verbinde Google Kalender, damit Verfügbarkeiten und Terminlogik sauber zusammenspielen.",
        helper: status.googleConnected
          ? "Kalenderdaten können jetzt in deine Terminabläufe einbezogen werden."
          : "Dieser Schritt ist optional, aber besonders für Termin- und Reservierungs-Setups sinnvoll.",
        bullets: status.googleConnected
          ? [
              "Kalender ist angebunden",
              "Einstellungen kannst du in Integrationen prüfen",
            ]
          : [
              "Öffne Integrationen",
              "Klicke auf Google Kalender verbinden",
              "Wähle den passenden Kalender aus",
            ],
        href: "/app/integrations",
        icon: CalendarCheck,
        actionLabel: status.googleConnected ? "Kalender prüfen" : "Kalender verbinden",
        statusLabel: status.googleConnected ? "Optional erledigt" : "Optional",
        complete: status.googleConnected,
        optional: true,
        matchPath: (currentPath) => currentPath.startsWith("/app/integrations"),
      },
      {
        id: "flow",
        title: "Ersten Flow erstellen",
        description:
          status.flowCount > 0
            ? `${flowCountLabel}. Du kannst jetzt Inhalte anpassen oder direkt den nächsten Schritt angehen.`
            : "Erstelle deinen ersten Flow mit dem Setup-Assistenten, einem Template oder einem leeren Start.",
        helper:
          status.flowCount > 0
            ? "Sobald ein Flow existiert, kannst du ihn testen und anschließend live schalten."
            : "Hier definierst du Trigger, Nachrichten und die eigentliche Logik deiner Automatisierung.",
        bullets:
          status.flowCount > 0
            ? [flowCountLabel, "Flows lassen sich jederzeit im Builder anpassen"]
            : [
                "Setup-Assistent, Template oder Leerer Flow wählen",
                "Trigger und Inhalte definieren",
                "Flow speichern",
              ],
        href: status.flowCount > 0 ? "/app/flows" : "/app/flows/new",
        icon: Zap,
        actionLabel: status.flowCount > 0 ? "Flows öffnen" : "Flow erstellen",
        statusLabel: status.flowCount > 0 ? flowCountLabel : "Pflichtschritt",
        complete: status.flowCount > 0,
        matchPath: (currentPath) =>
          currentPath.startsWith("/app/flows/new"),
      },
      {
        id: "live",
        title: "Flow live schalten",
        description:
          status.activeFlowCount > 0
            ? `${activeFlowLabel}${status.activeFlowName ? `, z. B. ${status.activeFlowName}` : ""}.`
            : "Schalte mindestens einen Flow aktiv, damit Wesponde nicht nur vorbereitet ist, sondern wirklich automatisiert reagiert.",
        helper:
          status.activeFlowCount > 0
            ? "Dein System ist einsatzbereit. Du kannst weitere Flows ergänzen oder bestehende optimieren."
            : status.flowCount === 0
              ? "Dieser Schritt ist erst sinnvoll, sobald mindestens ein Flow erstellt wurde."
              : "Öffne einen vorhandenen Flow und stelle ihn im Builder auf Aktiv.",
        bullets:
          status.activeFlowCount > 0
            ? [activeFlowLabel, "Du kannst aktive Flows jederzeit weiter optimieren"]
            : status.flowCount === 0
              ? [
                  "Erstelle zuerst einen Flow",
                  "Danach kannst du ihn im Builder aktiv schalten",
                ]
              : ["Flow öffnen", "Im Builder auf Aktiv stellen", "Speichern"],
        href: status.flowCount > 0 ? "/app/flows" : "/app/flows/new",
        icon: Radio,
        actionLabel:
          status.activeFlowCount > 0
            ? "Aktive Flows ansehen"
            : status.flowCount > 0
              ? "Flow live schalten"
              : "Zuerst Flow erstellen",
        statusLabel:
          status.activeFlowCount > 0
            ? activeFlowLabel
            : status.flowCount > 0
              ? "Pflichtschritt"
              : "Blockiert",
        complete: status.activeFlowCount > 0,
        blocked: status.flowCount === 0,
        matchPath: (currentPath) =>
          currentPath.startsWith("/app/flows") &&
          !currentPath.startsWith("/app/flows/new"),
      },
    ];
  }, [status]);

  const requiredTasks = useMemo(
    () => tasks.filter((task) => !task.optional),
    [tasks],
  );
  const optionalTasks = useMemo(
    () => tasks.filter((task) => task.optional),
    [tasks],
  );

  const completedRequiredCount = requiredTasks.filter((task) => task.complete).length;
  const allRequiredComplete =
    requiredTasks.length > 0 && completedRequiredCount === requiredTasks.length;
  const nextRequiredTask = requiredTasks.find((task) => !task.complete) ?? null;
  const featuredTaskId =
    focusTaskId ?? nextRequiredTask?.id ?? requiredTasks[0]?.id ?? null;
  useEffect(() => {
    if (didResolveAutoOpen) return;
    if (dismissed === null || accountLoading || status.loading) return;

    if (!dismissed && !allRequiredComplete) {
      setIsOpen(true);
      setPresentation("hub");
    }

    setDidResolveAutoOpen(true);
  }, [
    accountLoading,
    allRequiredComplete,
    didResolveAutoOpen,
    dismissed,
    status.loading,
  ]);

  useEffect(() => {
    if (!isOpen || presentation !== "hub") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setPresentation("hub");
        setFocusTaskId(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, presentation]);

  const closeTemporarily = useCallback(() => {
    setIsOpen(false);
    setPresentation("hub");
    setFocusTaskId(null);
  }, []);

  const dismissGuide = useCallback(async () => {
    setDismissed(true);
    setIsOpen(false);
    setPresentation("hub");
    setFocusTaskId(null);

    const now = new Date().toISOString();
    await updateGuideMeta({
      onboarding_dismissed_at: now,
      onboarding_seen: true,
      onboarding_seen_at: now,
    });
  }, [updateGuideMeta]);

  const openTask = useCallback(
    (task: GuideTask) => {
      setFocusTaskId(task.id);
      setPresentation("context");
      setIsOpen(true);

      if (!task.matchPath(pathname)) {
        router.push(task.href);
      }
    },
    [pathname, router],
  );

  const focusedTask = focusTaskId
    ? (tasks.find((task) => task.id === focusTaskId) ?? null)
    : null;

  const shouldShowContext = Boolean(
    isOpen &&
      presentation === "context" &&
      focusedTask &&
      focusedTask.matchPath(pathname),
  );

  const contextTask = shouldShowContext ? focusedTask : null;

  const handleContextPrimary = useCallback(() => {
    if (!contextTask) return;

    if (contextTask.complete) {
      if (nextRequiredTask && nextRequiredTask.id !== contextTask.id) {
        openTask(nextRequiredTask);
        return;
      }
      setPresentation("hub");
      setFocusTaskId(null);
      return;
    }

    void loadStatus();
  }, [contextTask, loadStatus, nextRequiredTask, openTask]);

  // Only skip rendering if permanently dismissed or still resolving
  if (dismissed === true) return null;

  const hubMode = isOpen && !shouldShowContext;

  return (
    <>
      {/* ─── Hub Modal ─── */}
      <AnimatePresence>
        {hubMode && (
          <motion.div
            key="hub-overlay"
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]"
              onClick={closeTemporarily}
            />

            {/* Modal */}
            <motion.div
              className="relative flex w-full max-w-[660px] max-h-[min(92dvh,860px)] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_100px_rgba(15,23,42,0.22),0_0_0_1px_rgba(226,232,240,0.7)]"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              role="dialog"
              aria-modal="true"
              aria-label="Setup-Guide"
            >
              {/* ─ Header ─ */}
              <div className="px-6 pt-6 pb-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#EFF6FF]">
                        <span className="h-[7px] w-[7px] rounded-full bg-[#2450b2]" />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2450b2]">
                        Setup Guide
                      </span>
                    </div>
                    <h2 className="mt-2.5 text-[24px] font-bold tracking-tight text-[#0F172A] sm:text-[26px]">
                      {allRequiredComplete ? "Alles bereit." : "Wesponde einrichten"}
                    </h2>
                    <p className="mt-1 text-[13px] text-[#64748B]">
                      {allRequiredComplete
                        ? "Alle Pflichtschritte sind abgeschlossen. Du kannst jetzt live gehen."
                        : `${completedRequiredCount} von ${requiredTasks.length} Pflichtschritten abgeschlossen`}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] text-[#94A3B8] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-2"
                    onClick={closeTemporarily}
                    aria-label="Guide schließen"
                  >
                    <X className="h-[15px] w-[15px]" />
                  </button>
                </div>

                {/* Segmented progress */}
                <div className="mt-4 flex items-center gap-1.5">
                  {requiredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-[#E2E8F0]"
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-[#2450b2]"
                        initial={{ width: "0%" }}
                        animate={{ width: task.complete ? "100%" : "0%" }}
                        transition={{
                          type: "spring",
                          stiffness: 140,
                          damping: 22,
                          delay: 0.15,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ─ Step list ─ */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 pb-2 sm:px-7">

                  {/* Required tasks */}
                  <div className="space-y-2">
                    {requiredTasks.map((task, index) => {
                      const TaskIcon = task.icon;
                      const isActive = featuredTaskId === task.id && !task.complete;
                      const stepNum = index + 1;

                      return (
                        <div
                          key={task.id}
                          className={[
                            "rounded-2xl border transition-all duration-200",
                            task.complete
                              ? "border-[#E2E8F0] bg-[#FAFBFF]"
                              : isActive
                                ? "border-[#BFDBFE] bg-[#F0F7FF] shadow-[0_2px_14px_rgba(36,80,178,0.07)]"
                                : task.blocked
                                  ? "border-[#E2E8F0] bg-white opacity-50"
                                  : "border-[#E2E8F0] bg-white",
                          ].join(" ")}
                        >
                          {/* Row */}
                          <div
                            className={[
                              "flex items-start gap-3 p-4",
                              !task.complete && !task.blocked ? "cursor-pointer" : "",
                            ].join(" ")}
                            onClick={() => {
                              if (!task.blocked && !task.complete) {
                                openTask(task);
                              }
                            }}
                          >
                            {/* Step indicator */}
                            <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center">
                              {task.complete ? (
                                <motion.div
                                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCFCE7]"
                                  initial={{ scale: 0.7, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                  }}
                                >
                                  <Check className="h-[15px] w-[15px] stroke-[2.5] text-[#16A34A]" />
                                </motion.div>
                              ) : (
                                <>
                                  {isActive && (
                                    <motion.span
                                      className="absolute inset-0 rounded-full border-[1.5px] border-[#2450b2]"
                                      animate={{
                                        scale: [1, 1.55, 1],
                                        opacity: [0.5, 0, 0.5],
                                      }}
                                      transition={{
                                        duration: 2.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                    />
                                  )}
                                  <div
                                    className={[
                                      "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold",
                                      isActive
                                        ? "bg-[#2450b2] text-white"
                                        : task.blocked
                                          ? "border border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1]"
                                          : "border border-[#CBD5E1] bg-white text-[#94A3B8]",
                                    ].join(" ")}
                                  >
                                    {task.blocked ? (
                                      <Lock className="h-3.5 w-3.5" />
                                    ) : (
                                      stepNum
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Icon */}
                            <div
                              className={[
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
                                task.complete
                                  ? "bg-[#F0FDF4] text-[#16A34A]"
                                  : isActive
                                    ? "bg-[#EFF6FF] text-[#2450b2]"
                                    : "bg-[#F8FAFC] text-[#CBD5E1]",
                              ].join(" ")}
                            >
                              <TaskIcon className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3
                                  className={[
                                    "text-[15px] font-semibold",
                                    task.complete
                                      ? "text-[#64748B]"
                                      : "text-[#0F172A]",
                                  ].join(" ")}
                                >
                                  {task.title}
                                </h3>
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    task.complete
                                      ? "bg-[#DCFCE7] text-[#15803D]"
                                      : isActive
                                        ? "bg-[#DBEAFE] text-[#1D4ED8]"
                                        : task.blocked
                                          ? "bg-[#F1F5F9] text-[#94A3B8]"
                                          : "bg-[#FEF9C3] text-[#854D0E]",
                                  ].join(" ")}
                                >
                                  {task.complete ? "Erledigt" : task.statusLabel}
                                </span>
                              </div>
                              <p
                                className={[
                                  "mt-0.5 text-[13px] leading-relaxed",
                                  task.complete || task.blocked
                                    ? "text-[#94A3B8]"
                                    : "text-[#475569]",
                                ].join(" ")}
                              >
                                {task.complete ? task.helper : task.description}
                              </p>
                            </div>

                            {/* Arrow hint (collapsed, non-active) */}
                            {!isActive && !task.blocked && (
                              <div className="mt-0.5 shrink-0">
                                <ArrowRight
                                  className={[
                                    "h-4 w-4 transition-colors",
                                    task.complete
                                      ? "text-[#E2E8F0]"
                                      : "text-[#CBD5E1]",
                                  ].join(" ")}
                                />
                              </div>
                            )}
                          </div>

                          {/* Expanded panel (active step) */}
                          <AnimatePresence initial={false}>
                            {isActive && (
                              <motion.div
                                key="expanded"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 280,
                                  damping: 28,
                                }}
                                className="overflow-hidden"
                              >
                                {/* pl aligns with text: step(36)+gap(12)+icon(36)+gap(12) = 96px = 6rem */}
                                <div className="px-4 pb-4 pl-24">
                                  <ul className="mb-4 space-y-2">
                                    {task.bullets.map((bullet, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start gap-2.5 text-[13px] text-[#475569]"
                                      >
                                        <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2450b2]/50" />
                                        {bullet}
                                      </li>
                                    ))}
                                  </ul>
                                  <Button
                                    onClick={() => openTask(task)}
                                    size="sm"
                                    className="gap-2"
                                  >
                                    {task.actionLabel}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional tasks */}
                  {optionalTasks.length > 0 && (
                    <div className="mt-4 pb-2">
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#B0BAD0]">
                        Optional
                      </p>
                      <div className="space-y-2">
                        {optionalTasks.map((task) => {
                          const TaskIcon = task.icon;

                          return (
                            <div
                              key={task.id}
                              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FCFDFE] p-4 transition-colors hover:bg-[#F8FAFC]"
                              onClick={() => openTask(task)}
                            >
                              <div
                                className={[
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                  task.complete
                                    ? "bg-[#F0FDF4] text-[#16A34A]"
                                    : "bg-[#F1F5F9] text-[#94A3B8]",
                                ].join(" ")}
                              >
                                <TaskIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <h3 className="text-[14px] font-semibold text-[#0F172A]">
                                    {task.title}
                                  </h3>
                                  <span
                                    className={[
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                      task.complete
                                        ? "bg-[#DCFCE7] text-[#15803D]"
                                        : "bg-[#EFF6FF] text-[#1D4ED8]",
                                    ].join(" ")}
                                  >
                                    {task.complete ? "Erledigt" : "Optional"}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[13px] text-[#64748B]">
                                  {task.description}
                                </p>
                              </div>
                              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#CBD5E1]" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All done banner */}
                  <AnimatePresence>
                    {allRequiredComplete && (
                      <motion.div
                        key="done-banner"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 mb-2 flex items-center gap-3 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7]">
                          <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-[#15803D]">
                            Setup abgeschlossen
                          </p>
                          <p className="text-[13px] text-[#16A34A]/80">
                            Wesponde ist bereit. Du kannst jetzt live gehen.
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push("/app/flows")}
                          size="sm"
                          className="shrink-0"
                        >
                          Zu den Flows
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ─ Footer ─ */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[#F1F5F9] px-6 py-4 sm:px-7">
                <Button variant="secondary" size="sm" onClick={closeTemporarily}>
                  Später
                </Button>
                <button
                  type="button"
                  className="text-[13px] text-[#94A3B8] transition-colors hover:text-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-1"
                  onClick={dismissGuide}
                >
                  Nicht mehr automatisch zeigen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Context Panel (floating bottom-right) ─── */}
      <AnimatePresence>
        {shouldShowContext && contextTask && (
          <motion.div
            key="context-panel"
            className="fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-[380px]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.14),0_0_0_1px_rgba(226,232,240,0.5)]"
              role="dialog"
              aria-modal="false"
              aria-label="Guide-Hinweis"
            >
              {/* Top row: progress dots + close */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {requiredTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      className={[
                        "h-[5px] rounded-full transition-all duration-300",
                        task.complete
                          ? "w-5 bg-[#2450b2]"
                          : task.id === contextTask.id
                            ? "w-5 bg-[#BFDBFE]"
                            : "w-2 bg-[#E2E8F0]",
                      ].join(" ")}
                    />
                  ))}
                  <span className="ml-1 text-[11px] text-[#94A3B8]">
                    {completedRequiredCount}/{requiredTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] text-[#94A3B8] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-1"
                  onClick={closeTemporarily}
                  aria-label="Guide-Hinweis schließen"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Task info */}
              <div className="mt-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Schritt {requiredTasks.findIndex((t) => t.id === contextTask.id) + 1}{" "}
                  von {requiredTasks.length}
                </p>
                <h3 className="mt-1.5 text-[18px] font-bold tracking-tight text-[#0F172A]">
                  {contextTask.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">
                  {contextTask.complete
                    ? contextTask.helper
                    : contextTask.description}
                </p>
              </div>

              {/* Completion notice */}
              {contextTask.complete && (
                <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-3 py-2.5">
                  <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5] text-[#16A34A]" />
                  <p className="text-[12px] font-semibold text-[#15803D]">
                    Schritt abgeschlossen
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  onClick={handleContextPrimary}
                  size="sm"
                  className="flex-1"
                >
                  {contextTask.complete
                    ? nextRequiredTask && nextRequiredTask.id !== contextTask.id
                      ? `Weiter`
                      : "Zur Übersicht"
                    : "Status prüfen"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPresentation("hub");
                    setFocusTaskId(null);
                  }}
                >
                  Übersicht
                </Button>
                {!contextTask.complete && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#94A3B8] transition-colors hover:text-[#475569] focus-visible:outline-none"
                    onClick={() => openTask(contextTask)}
                  >
                    Neu laden
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
