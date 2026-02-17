'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, Bell, Key, Shield, Save, CheckCircle, AlertTriangle, LogOut, Users, Clock, Building2 } from "lucide-react";
import { createSupabaseBrowserClient } from "../../../lib/supabaseBrowserClient";
import { getDefaultCalendarSettings, type CalendarSettings } from "../../../lib/google/settings";
import { VERTICAL_OPTIONS, type VerticalKey } from "../../../lib/verticals";

export default function SettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamNotice, setTeamNotice] = useState<string | null>(null);
  const [teamSavingId, setTeamSavingId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarForm, setCalendarForm] = useState<CalendarSettings>(getDefaultCalendarSettings());
  const [vertical, setVertical] = useState<VerticalKey | null>(null);
  const [verticalSaving, setVerticalSaving] = useState(false);
  const [verticalNotice, setVerticalNotice] = useState<string | null>(null);
  const [verticalError, setVerticalError] = useState<string | null>(null);

  type TeamRole = "owner" | "admin" | "member" | "viewer";
  type TeamMember = {
    userId: string;
    role: TeamRole;
    joinedAt: string | null;
    email: string | null;
    fullName: string | null;
  };

  const ROLE_LABELS: Record<TeamRole, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Mitarbeiter",
    viewer: "Viewer",
  };

  const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "member", label: "Mitarbeiter" },
    { value: "viewer", label: "Viewer" },
  ];

  const CALENDAR_DAYS: { key: string; label: string }[] = [
    { key: "mon", label: "Montag" },
    { key: "tue", label: "Dienstag" },
    { key: "wed", label: "Mittwoch" },
    { key: "thu", label: "Donnerstag" },
    { key: "fri", label: "Freitag" },
    { key: "sat", label: "Samstag" },
    { key: "sun", label: "Sonntag" },
  ];

  // Notification settings
  const [notifications, setNotifications] = useState({
    newLeads: true,
    botErrors: true,
    integrationExpiry: true,
    monthlyReport: false,
  });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const name = user.user_metadata?.full_name ||
                   user.user_metadata?.name ||
                   user.email?.split('@')[0] ||
                   '';
      setUserName(name);
      setUserEmail(user.email || '');
      setLoading(false);
    }
    loadUser();
  }, [supabase, router]);

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    setTeamError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setTeamError("Bitte erneut anmelden.");
      setTeamLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/account/members", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setTeamError(data?.error || "Team konnte nicht geladen werden.");
        setTeamLoading(false);
        return;
      }

      const data = await response.json();
      setTeamMembers(data.members || []);
      setCurrentUserId(data.currentUserId || null);
      setCurrentUserRole(data.currentUserRole || null);
      setCanManageTeam(Boolean(data.canManage));
    } catch {
      setTeamError("Team konnte nicht geladen werden.");
    } finally {
      setTeamLoading(false);
    }
  }, [supabase]);

  const loadCalendarSettings = useCallback(async () => {
    setCalendarLoading(true);
    setCalendarError(null);
    setCalendarNotice(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setCalendarError("Bitte erneut anmelden.");
      setCalendarLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/account/settings", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const payload = await response.json();
        setCalendarError(payload?.error || "Kalender-Einstellungen konnten nicht geladen werden.");
        setCalendarLoading(false);
        return;
      }
      const payload = await response.json();
      setCalendarForm(payload.calendar ?? getDefaultCalendarSettings());
      setVertical(payload.vertical ?? null);
    } catch {
      setCalendarError("Kalender-Einstellungen konnten nicht geladen werden.");
    } finally {
      setCalendarLoading(false);
    }
  }, [supabase]);

  const updateMemberRole = async (memberId: string, nextRole: TeamRole) => {
    if (!canManageTeam) return;

    const member = teamMembers.find((item) => item.userId === memberId);
    if (!member || member.role === nextRole) return;

    setTeamSavingId(memberId);
    setTeamError(null);
    setTeamNotice(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setTeamError("Bitte erneut anmelden.");
      setTeamSavingId(null);
      return;
    }

    try {
      const response = await fetch("/api/account/members", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: memberId, role: nextRole }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setTeamError(payload?.error || "Rolle konnte nicht aktualisiert werden.");
        setTeamSavingId(null);
        return;
      }

      setTeamMembers((prev) =>
        prev.map((item) =>
          item.userId === memberId ? { ...item, role: nextRole } : item
        )
      );
      setTeamNotice("Rolle aktualisiert.");
    } catch {
      setTeamError("Rolle konnte nicht aktualisiert werden.");
    } finally {
      setTeamSavingId(null);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadTeam();
      loadCalendarSettings();
    }
  }, [loading, loadTeam, loadCalendarSettings]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: userName }
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const handleCalendarFieldChange = (field: keyof CalendarSettings, value: string) => {
    setCalendarForm((prev) => {
      if (field === "bookingWindowDays" || field === "slotDurationMinutes") {
        const numeric = Number(value);
        return {
          ...prev,
          [field]: Number.isFinite(numeric) ? numeric : prev[field],
        };
      }
      if (field === "timeZone") {
        return { ...prev, timeZone: value };
      }
      return prev;
    });
  };

  const handleCalendarDayToggle = (day: string) => {
    setCalendarForm((prev) => {
      const isOpen = (prev.hours?.[day] ?? []).length > 0;
      return {
        ...prev,
        hours: {
          ...prev.hours,
          [day]: isOpen ? [] : ["07:00-21:00"],
        },
      };
    });
  };

  const canEditVertical = currentUserRole === "owner";

  const handleVerticalChange = async (nextVertical: VerticalKey) => {
    if (!canEditVertical || verticalSaving || nextVertical === vertical) return;
    setVerticalSaving(true);
    setVerticalNotice(null);
    setVerticalError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setVerticalError("Bitte erneut anmelden.");
      setVerticalSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ vertical: nextVertical }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setVerticalError(payload?.error || "Branche konnte nicht gespeichert werden.");
        setVerticalSaving(false);
        return;
      }
      window.dispatchEvent(
        new CustomEvent("wesponde:vertical-changed", { detail: { vertical: nextVertical } })
      );
      setVertical(nextVertical);
      setVerticalNotice("Branche gespeichert.");
    } catch {
      setVerticalError("Branche konnte nicht gespeichert werden.");
    } finally {
      setVerticalSaving(false);
    }
  };

  const handleCalendarDayRangeChange = (day: string, start: string, end: string) => {
    if (!start || !end) return;
    setCalendarForm((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: [`${start}-${end}`],
      },
    }));
  };

  const handleSaveCalendarSettings = async () => {
    setCalendarSaving(true);
    setCalendarNotice(null);
    setCalendarError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setCalendarError("Bitte erneut anmelden.");
      setCalendarSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ calendar: calendarForm }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setCalendarError(payload?.error || "Kalender-Einstellungen konnten nicht gespeichert werden.");
        setCalendarSaving(false);
        return;
      }
      setCalendarForm(payload.calendar ?? calendarForm);
      setCalendarNotice("Kalender-Einstellungen gespeichert.");
    } catch {
      setCalendarError("Kalender-Einstellungen konnten nicht gespeichert werden.");
    } finally {
      setCalendarSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-3 py-1 text-xs font-medium text-zinc-400">
            <Settings className="h-3 w-3" />
            Einstellungen
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white">Wird geladen...</h1>
        </div>
      </div>
    );
  }

  const ownerCount = teamMembers.filter((member) => member.role === "owner").length;
  const sortedMembers = [...teamMembers].sort((a, b) => {
    const roleOrder: Record<TeamRole, number> = {
      owner: 0,
      admin: 1,
      member: 2,
      viewer: 3,
    };
    const roleDiff = roleOrder[a.role] - roleOrder[b.role];
    if (roleDiff !== 0) return roleDiff;
    const aName = (a.fullName || a.email || a.userId).toLowerCase();
    const bName = (b.fullName || b.email || b.userId).toLowerCase();
    return aName.localeCompare(bName);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-3 py-1 text-xs font-medium text-zinc-400">
          <Settings className="h-3 w-3" />
          Einstellungen
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Kontoeinstellungen
        </h1>
        <p className="mt-1 text-zinc-400">
          Verwalte dein Profil, Benachrichtigungen und Sicherheitseinstellungen.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Profil</h2>
              <p className="text-sm text-zinc-400">Deine persönlichen Informationen</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Dein Name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">E-Mail</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-400 focus:outline-none disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-zinc-500">E-Mail kann nicht geändert werden.</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Speichern..." : "Änderungen speichern"}
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Gespeichert
              </span>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Benachrichtigungen</h2>
              <p className="text-sm text-zinc-400">Wähle, wann wir dich informieren sollen</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10">
              <div>
                <span className="text-sm font-medium text-white">Neue Leads per E-Mail</span>
                <p className="text-xs text-zinc-500">Erhalte eine E-Mail bei neuen Reservierungen</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.newLeads}
                onChange={(e) => setNotifications({ ...notifications, newLeads: e.target.checked })}
                className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10">
              <div>
                <span className="text-sm font-medium text-white">Bot-Fehler / Fallbacks</span>
                <p className="text-xs text-zinc-500">Benachrichtigung wenn der Bot nicht antworten konnte</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.botErrors}
                onChange={(e) => setNotifications({ ...notifications, botErrors: e.target.checked })}
                className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10">
              <div>
                <span className="text-sm font-medium text-white">Integration läuft ab</span>
                <p className="text-xs text-zinc-500">Warnung bevor dein Instagram-Token abläuft</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.integrationExpiry}
                onChange={(e) => setNotifications({ ...notifications, integrationExpiry: e.target.checked })}
                className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10">
              <div>
                <span className="text-sm font-medium text-white">Monatlicher Performance-Report</span>
                <p className="text-xs text-zinc-500">Zusammenfassung deiner Automation-Statistiken</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.monthlyReport}
                onChange={(e) => setNotifications({ ...notifications, monthlyReport: e.target.checked })}
                className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
            </label>
          </div>
        </div>

        {/* Industry Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Branche</h2>
              <p className="text-sm text-zinc-400">Wähle, welche Default-Flows wir dir zeigen sollen</p>
            </div>
          </div>

          {calendarLoading ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
              Branchen-Einstellungen werden geladen...
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {VERTICAL_OPTIONS.map((option) => {
                  const isActive = vertical === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={verticalSaving || !canEditVertical}
                      onClick={() => handleVerticalChange(option.key)}
                      className={`flex h-full flex-col rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-emerald-500/60 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:border-emerald-400/40 hover:bg-emerald-500/10"
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">{option.label}</div>
                      <div className="mt-2 text-xs text-zinc-400">{option.description}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                        {option.examples.map((example) => (
                          <span key={example} className="rounded-full border border-white/10 px-2 py-1">
                            {example}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!canEditVertical && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Nur Owner kann die Branche ändern.
                </div>
              )}
              {verticalNotice && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {verticalNotice}
                </div>
              )}
              {verticalError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {verticalError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Kalender & Verfügbarkeit</h2>
              <p className="text-sm text-zinc-400">Arbeitszeiten, Slots und Buchungsfenster</p>
            </div>
          </div>

          {calendarLoading ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
              Kalender-Einstellungen werden geladen...
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">Zeitzone</label>
                  <input
                    type="text"
                    value={calendarForm.timeZone}
                    onChange={(e) => handleCalendarFieldChange("timeZone", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Europe/Berlin"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">Buchungsfenster (Tage)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={calendarForm.bookingWindowDays}
                    onChange={(e) => handleCalendarFieldChange("bookingWindowDays", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">Slot-Dauer (Min.)</label>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={calendarForm.slotDurationMinutes}
                    onChange={(e) => handleCalendarFieldChange("slotDurationMinutes", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-300">Arbeitszeiten</div>
                <div className="mt-3 space-y-3">
                  {CALENDAR_DAYS.map((day) => {
                    const range = calendarForm.hours?.[day.key]?.[0] ?? "";
                    const [start, end] = range.split("-");
                    const isOpen = Boolean(range);
                    return (
                      <div
                        key={day.key}
                        className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="text-sm font-medium text-white">{day.label}</div>
                        <div className="flex flex-1 flex-wrap items-center gap-3 sm:justify-end">
                          <label className="flex items-center gap-2 text-xs text-zinc-400">
                            <input
                              type="checkbox"
                              checked={isOpen}
                              onChange={() => handleCalendarDayToggle(day.key)}
                              className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                            />
                            Offen
                          </label>
                          <input
                            type="time"
                            value={start || "07:00"}
                            disabled={!isOpen}
                            onChange={(e) => handleCalendarDayRangeChange(day.key, e.target.value, end || "21:00")}
                            className="rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                          />
                          <span className="text-xs text-zinc-500">bis</span>
                          <input
                            type="time"
                            value={end || "21:00"}
                            disabled={!isOpen}
                            onChange={(e) => handleCalendarDayRangeChange(day.key, start || "07:00", e.target.value)}
                            className="rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {calendarError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  {calendarError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveCalendarSettings}
                  disabled={calendarSaving}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {calendarSaving ? "Speichern..." : "Kalender speichern"}
                </button>
                {calendarNotice && (
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    {calendarNotice}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Team & Rollen</h2>
              <p className="text-sm text-zinc-400">Verwalte, wer Zugriff hat</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {teamLoading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                Team wird geladen...
              </div>
            ) : teamError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {teamError}
              </div>
            ) : sortedMembers.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                Keine Team-Mitglieder gefunden.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMembers.map((member) => {
                  const isCurrentUser = member.userId === currentUserId;
                  const canEditMember =
                    canManageTeam &&
                    (currentUserRole === "owner" || member.role !== "owner");
                  const label = member.fullName || member.email || member.userId;
                  const secondary =
                    member.fullName && member.email ? member.email : null;
                  return (
                    <div
                      key={member.userId}
                      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {label}
                          </span>
                          {isCurrentUser && (
                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
                              Du
                            </span>
                          )}
                        </div>
                        {secondary && (
                          <div className="text-xs text-zinc-500">{secondary}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {canManageTeam ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateMemberRole(member.userId, e.target.value as TeamRole)
                            }
                            disabled={!canEditMember || teamSavingId === member.userId}
                            className="app-select disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                            {ROLE_LABELS[member.role]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!teamLoading && !teamError && teamNotice && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                {teamNotice}
              </div>
            )}

            {!teamLoading && !teamError && !canManageTeam && (
              <p className="text-xs text-zinc-500">
                Rollen können nur von Owner/Admin geändert werden.
              </p>
            )}

            {!teamLoading && !teamError && canManageTeam && ownerCount <= 1 && (
              <p className="text-xs text-zinc-500">
                Mindestens ein Owner muss bestehen bleiben.
              </p>
            )}
          </div>
        </div>

        {/* API Access Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">API-Zugriff</h2>
              <p className="text-sm text-zinc-400">Für Webhooks oder externe Integrationen</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-medium text-zinc-400">API-Schlüssel</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-300">
                  wesponde_live_••••••••••••••••
                </code>
                <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                  Kopieren
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Verwende diesen Schlüssel, um Wesponde mit anderen Tools zu verbinden. Teile ihn niemals öffentlich.
            </p>
            <button className="mt-4 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25">
              Neuen Schlüssel generieren
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Sicherheit</h2>
              <p className="text-sm text-zinc-400">Konto-Sicherheit und Abmeldung</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm font-medium text-white">Letzte Anmeldung</p>
              <p className="mt-1 text-xs text-zinc-400">Heute, von diesem Gerät</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm font-medium text-white">Passwort ändern</p>
              <p className="mt-1 text-xs text-zinc-400">Du kannst dein Passwort über den Login-Bereich zurücksetzen.</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
