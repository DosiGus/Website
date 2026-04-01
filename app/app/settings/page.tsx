'use client';

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, Bell, Key, Shield, Save, CheckCircle, AlertTriangle, LogOut, Users, Clock, Building2, ChevronDown, Bot, UserPlus, Trash2, type LucideIcon } from "lucide-react";
import { createSupabaseBrowserClient } from "../../../lib/supabaseBrowserClient";
import { getDefaultCalendarSettings, type CalendarSettings } from "../../../lib/google/settings";
import { VERTICAL_OPTIONS, type VerticalKey, getBookingLabels } from "../../../lib/verticals";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/app/PageHeader";

type SectionCardProps = {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  badge?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  badge,
  open,
  onToggle,
  children,
}: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F8FAFC]"
        onClick={onToggle}
      >
        <span
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconClassName,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0F172A]">
            {title}
          </span>
          <span className="mt-1 block text-xs text-[#64748B]">
            {description}
          </span>
        </span>
        {badge ? <span className="shrink-0">{badge}</span> : null}
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-[#94A3B8] transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      {open ? <div className="border-t border-[#E2E8F0] px-5 py-5">{children}</div> : null}
    </section>
  );
}

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
  const [teamRemovingId, setTeamRemovingId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarForm, setCalendarForm] = useState<CalendarSettings>(getDefaultCalendarSettings());
  const [vertical, setVertical] = useState<VerticalKey | null>(null);
  const [verticalSaving, setVerticalSaving] = useState(false);
  const [verticalNotice, setVerticalNotice] = useState<string | null>(null);
  const [verticalError, setVerticalError] = useState<string | null>(null);
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [fallbackSaving, setFallbackSaving] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const labels = useMemo(() => getBookingLabels(vertical), [vertical]);

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

  const [openCard, setOpenCard] = useState<string | null>("profil");
  const toggleCard = (key: string) => setOpenCard((prev) => (prev === key ? null : key));

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
      setFallbackEnabled(payload.fallback_enabled !== false); // default true
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

  const inviteMember = async () => {
    if (!canManageTeam || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteNotice(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setInviteError("Bitte erneut anmelden.");
      setInviting(false);
      return;
    }

    try {
      const response = await fetch("/api/account/members", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setInviteError(payload?.error ?? "Einladung fehlgeschlagen.");
        return;
      }
      setInviteNotice(payload.added ? "Mitglied hinzugefügt." : "Einladung gesendet.");
      setInviteEmail("");
      if (payload.added) loadTeam();
    } catch {
      setInviteError("Einladung fehlgeschlagen.");
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!canManageTeam) return;
    setTeamRemovingId(memberId);
    setTeamError(null);
    setTeamNotice(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setTeamError("Bitte erneut anmelden.");
      setTeamRemovingId(null);
      return;
    }

    try {
      const response = await fetch("/api/account/members", {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId: memberId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setTeamError(payload?.error ?? "Entfernen fehlgeschlagen.");
        return;
      }
      setTeamMembers((prev) => prev.filter((item) => item.userId !== memberId));
      setTeamNotice("Mitglied entfernt.");
    } catch {
      setTeamError("Mitglied konnte nicht entfernt werden.");
    } finally {
      setTeamRemovingId(null);
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

  const handleFallbackToggle = async (nextValue: boolean) => {
    setFallbackSaving(true);
    setFallbackNotice(null);
    setFallbackError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setFallbackError("Bitte erneut anmelden.");
      setFallbackSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ fallback_enabled: nextValue }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setFallbackError(payload?.error || "Einstellung konnte nicht gespeichert werden.");
        setFallbackSaving(false);
        return;
      }
      setFallbackEnabled(nextValue);
      setFallbackNotice(nextValue ? "Fallback-Nachrichten aktiviert." : "Fallback-Nachrichten deaktiviert.");
      setTimeout(() => setFallbackNotice(null), 3000);
    } catch {
      setFallbackError("Einstellung konnte nicht gespeichert werden.");
    } finally {
      setFallbackSaving(false);
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
      <div className="space-y-6">
        <PageHeader badge="Einstellungen" title="Einstellungen werden geladen…" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[88px] animate-pulse rounded-[18px] border border-[#E2E8F0] bg-white"
            />
          ))}
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
    <div className="space-y-8 app-page-enter">
      <PageHeader
        badge="Einstellungen"
        title="Kontoeinstellungen"
        description="Verwalte Profil, Teamzugriffe, Kalenderlogik und Sicherheitsoptionen in einem klaren App-Workspace."
      />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="app-card rounded-2xl px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Profil
            </div>
            <div className="mt-2 text-sm font-semibold text-[#0F172A]">
              {userName || "Noch kein Name"}
            </div>
            <div className="mt-1 text-xs text-[#64748B]">{userEmail}</div>
          </div>
          <div className="app-card rounded-2xl px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Team
            </div>
            <div className="mt-2 text-sm font-semibold text-[#0F172A]">
              {teamLoading ? "Laedt..." : `${teamMembers.length} Mitglieder`}
            </div>
            <div className="mt-1 text-xs text-[#64748B]">
              Rolle: {currentUserRole || "Unbekannt"}
            </div>
          </div>
          <div className="app-card rounded-2xl px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Branche
            </div>
            <div className="mt-2 text-sm font-semibold text-[#0F172A]">
              {vertical
                ? VERTICAL_OPTIONS.find((option) => option.key === vertical)?.label ||
                  vertical
                : "Nicht gesetzt"}
            </div>
            <div className="mt-1 text-xs text-[#64748B]">
              Fallback: {fallbackEnabled ? "aktiv" : "deaktiviert"}
            </div>
          </div>
        </div>

      <div className="space-y-3">
        <SectionCard
          icon={User}
          iconClassName="bg-[#DBEAFE] text-[#2563EB]"
          title="Profil"
          description="Persoenliche Informationen und Anzeigename"
          open={openCard === "profil"}
          onToggle={() => toggleCard("profil")}
          badge={saved ? <Badge variant="success">Gespeichert</Badge> : undefined}
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Name
                </span>
                <input
                  type="text"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  className="app-input px-4 py-3"
                  placeholder="Dein Name"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  E-Mail
                </span>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="app-input px-4 py-3"
                />
              </label>
            </div>

            <p className="text-xs text-[#64748B]">
              Die E-Mail-Adresse wird aus deinem Konto uebernommen und kann hier
              nicht geaendert werden.
            </p>

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSaveProfile} loading={saving}>
                <Save className="h-4 w-4" />
                Aenderungen speichern
              </Button>
              {saved ? (
                <span className="inline-flex items-center gap-2 rounded-md bg-[#ECFDF5] px-3 py-2 text-sm font-medium text-[#047857]">
                  <CheckCircle className="h-4 w-4" />
                  Gespeichert
                </span>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Bell}
          iconClassName="bg-[#FEF3C7] text-[#B45309]"
          title="Benachrichtigungen"
          description="Lege fest, wann die App dich aktiv informiert"
          open={openCard === "notifications"}
          onToggle={() => toggleCard("notifications")}
        >
          <div className="space-y-3">
            {[
              {
                key: "newLeads",
                label: "Neue Leads per E-Mail",
                desc: `Erhalte eine E-Mail bei neuen ${labels.bookingPlural}.`,
              },
              {
                key: "botErrors",
                label: "Bot-Fehler und Fallbacks",
                desc: "Benachrichtigung, wenn der Bot nicht passend antworten konnte.",
              },
              {
                key: "integrationExpiry",
                label: "Integration laeuft ab",
                desc: "Warnung, bevor dein Instagram-Token auslaeuft.",
              },
              {
                key: "monthlyReport",
                label: "Monatlicher Performance-Report",
                desc: "Zusammenfassung deiner Automations-Statistiken.",
              },
            ].map(({ key, label, desc }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4 transition-colors hover:border-[#BFDBFE] hover:bg-white"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#0F172A]">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm text-[#64748B]">
                    {desc}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={(event) =>
                    setNotifications({
                      ...notifications,
                      [key]: event.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-0"
                />
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={Building2}
          iconClassName="bg-[#D1FAE5] text-[#047857]"
          title="Branche"
          description="Steuert Default-Flows und Branchenlogik in der App"
          open={openCard === "branche"}
          onToggle={() => toggleCard("branche")}
          badge={
            vertical ? (
              <Badge variant="success">
                {VERTICAL_OPTIONS.find((option) => option.key === vertical)?.label ||
                  vertical}
              </Badge>
            ) : undefined
          }
        >
          {calendarLoading ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
              Branchen-Einstellungen werden geladen...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {VERTICAL_OPTIONS.map((option) => {
                  const isActive = vertical === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={verticalSaving || !canEditVertical}
                      onClick={() => handleVerticalChange(option.key)}
                      className={[
                        "rounded-[18px] border p-4 text-left transition",
                        isActive
                          ? "border-[#86EFAC] bg-[#F0FDF4]"
                          : "border-[#E2E8F0] bg-white hover:border-[#BFDBFE] hover:bg-[#F8FAFC]",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold text-[#0F172A]">
                        {option.label}
                      </div>
                      <div className="mt-2 text-sm text-[#64748B]">
                        {option.description}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {option.examples.map((example) => (
                          <span
                            key={example}
                            className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!canEditVertical ? (
                <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
                  Nur Owner kann die Branche aendern.
                </div>
              ) : null}

              {verticalNotice ? (
                <div className="rounded-lg border border-[#BBF7D0] bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
                  {verticalNotice}
                </div>
              ) : null}

              {verticalError ? (
                <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                  {verticalError}
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={Clock}
          iconClassName="bg-[#E0F2FE] text-[#0369A1]"
          title="Kalender und Verfuegbarkeit"
          description="Zeitzone, Buchungsfenster und Oeffnungszeiten"
          open={openCard === "kalender"}
          onToggle={() => toggleCard("kalender")}
        >
          {calendarLoading ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
              Kalender-Einstellungen werden geladen...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3">
                <div className="grid gap-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center">
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">
                      Zeitzone
                    </div>
                    <div className="mt-1 text-sm text-[#64748B]">
                      Fuer Buchungszeiten und Kalender-Events.
                    </div>
                  </div>
                  <input
                    type="text"
                    value={calendarForm.timeZone}
                    onChange={(event) =>
                      handleCalendarFieldChange("timeZone", event.target.value)
                    }
                    className="app-input px-4 py-3"
                    placeholder="Europe/Berlin"
                  />
                </div>

                <div className="grid gap-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">
                      Buchungsfenster
                    </div>
                    <div className="mt-1 text-sm text-[#64748B]">
                      Wie weit im Voraus koennen Kunden buchen?
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={calendarForm.bookingWindowDays}
                      onChange={(event) =>
                        handleCalendarFieldChange(
                          "bookingWindowDays",
                          event.target.value,
                        )
                      }
                      className="app-input px-4 py-3"
                    />
                    <span className="text-sm text-[#64748B]">Tage</span>
                  </div>
                </div>

                <div className="grid gap-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">
                      Termindauer
                    </div>
                    <div className="mt-1 text-sm text-[#64748B]">
                      Wie lange dauert ein Termin bei dir?
                    </div>
                  </div>
                  <select
                    value={calendarForm.slotDurationMinutes}
                    onChange={(event) =>
                      handleCalendarFieldChange(
                        "slotDurationMinutes",
                        event.target.value,
                      )
                    }
                    className="app-select"
                  >
                    {[15, 30, 45, 60, 90, 120].map((min) => (
                      <option key={min} value={min}>
                        {min} Min.
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Oeffnungszeiten
                </div>
                <div className="overflow-hidden rounded-[18px] border border-[#E2E8F0]">
                  {CALENDAR_DAYS.map((day) => {
                    const range = calendarForm.hours?.[day.key]?.[0] ?? "";
                    const [start, end] = range.split("-");
                    const isOpen = Boolean(range);
                    return (
                      <div
                        key={day.key}
                        className="grid gap-3 border-b border-[#E2E8F0] bg-white px-4 py-3 last:border-b-0 md:grid-cols-[120px_80px_minmax(0,1fr)] md:items-center"
                      >
                        <span className="text-sm font-semibold text-[#0F172A]">
                          {day.label}
                        </span>
                        <label className="inline-flex items-center gap-2 text-sm text-[#475569]">
                          <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={() => handleCalendarDayToggle(day.key)}
                            className="h-4 w-4 rounded border-[#CBD5E1] text-[#10B981] focus:ring-[#10B981] focus:ring-offset-0"
                          />
                          Offen
                        </label>

                        {isOpen ? (
                          <div className="grid gap-2 sm:grid-cols-[1fr_20px_1fr]">
                            <input
                              type="time"
                              value={start || "07:00"}
                              onChange={(event) =>
                                handleCalendarDayRangeChange(
                                  day.key,
                                  event.target.value,
                                  end || "21:00",
                                )
                              }
                              className="app-input px-3 py-2 [color-scheme:light]"
                            />
                            <span className="self-center text-center text-sm text-[#94A3B8]">
                              -
                            </span>
                            <input
                              type="time"
                              value={end || "21:00"}
                              onChange={(event) =>
                                handleCalendarDayRangeChange(
                                  day.key,
                                  start || "07:00",
                                  event.target.value,
                                )
                              }
                              className="app-input px-3 py-2 [color-scheme:light]"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-[#94A3B8]">
                            Geschlossen
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {calendarError ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                  <AlertTriangle className="h-4 w-4" />
                  {calendarError}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSaveCalendarSettings} loading={calendarSaving}>
                  <Save className="h-4 w-4" />
                  Kalender speichern
                </Button>
                {calendarNotice ? (
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#ECFDF5] px-3 py-2 text-sm font-medium text-[#047857]">
                    <CheckCircle className="h-4 w-4" />
                    {calendarNotice}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={Bot}
          iconClassName="bg-[#EDE9FE] text-[#7C3AED]"
          title="Bot-Verhalten"
          description="Regeln fuer automatische Antworten auf unbekannte Nachrichten"
          open={openCard === "bot"}
          onToggle={() => toggleCard("bot")}
          badge={
            fallbackEnabled ? (
              <Badge variant="success">Fallback an</Badge>
            ) : (
              <Badge variant="neutral">Fallback aus</Badge>
            )
          }
        >
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0F172A]">
                  Automatische Fallback-Nachricht
                </span>
                <span className="mt-1 block text-sm leading-6 text-[#64748B]">
                  Wenn niemand deiner Logik passt, antwortet der Bot mit einem
                  freundlichen Hinweis und zeigt verfuegbare Optionen als Buttons
                  an. Deaktiviere das, wenn du lieber gar keine Standardantwort
                  senden willst.
                </span>
              </span>
              <input
                type="checkbox"
                checked={fallbackEnabled}
                disabled={fallbackSaving}
                onChange={(event) => handleFallbackToggle(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#7C3AED] focus:ring-[#7C3AED] focus:ring-offset-0"
              />
            </label>

            {fallbackNotice ? (
              <div className="rounded-lg border border-[#BBF7D0] bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
                {fallbackNotice}
              </div>
            ) : null}

            {fallbackError ? (
              <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                {fallbackError}
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          icon={Users}
          iconClassName="bg-[#E0F2FE] text-[#0369A1]"
          title="Team und Rollen"
          description="Zugriffe, Rollen und Einladungen fuer dein Team"
          open={openCard === "team"}
          onToggle={() => toggleCard("team")}
          badge={
            !teamLoading ? (
              <Badge variant="info">
                {teamMembers.length} {teamMembers.length === 1 ? "Mitglied" : "Mitglieder"}
              </Badge>
            ) : undefined
          }
        >
          <div className="space-y-4">
            {teamLoading ? (
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
                Team wird geladen...
              </div>
            ) : teamError ? (
              <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                {teamError}
              </div>
            ) : sortedMembers.length === 0 ? (
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
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
                      className="flex flex-col gap-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#0F172A]">
                            {label}
                          </span>
                          {isCurrentUser ? (
                            <Badge variant="neutral">Du</Badge>
                          ) : null}
                        </div>
                        {secondary ? (
                          <div className="mt-1 text-sm text-[#64748B]">
                            {secondary}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canManageTeam ? (
                          <select
                            value={member.role}
                            onChange={(event) =>
                              updateMemberRole(
                                member.userId,
                                event.target.value as TeamRole,
                              )
                            }
                            disabled={!canEditMember || teamSavingId === member.userId}
                            className="app-select min-w-[160px]"
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant="neutral">{ROLE_LABELS[member.role]}</Badge>
                        )}

                        {canManageTeam &&
                        !isCurrentUser &&
                        (currentUserRole === "owner" || member.role !== "owner") ? (
                          <Button
                            variant="danger-outline"
                            size="sm"
                            disabled={teamRemovingId === member.userId}
                            onClick={() => removeMember(member.userId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Entfernen
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {teamNotice ? (
              <div className="rounded-lg border border-[#BBF7D0] bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
                {teamNotice}
              </div>
            ) : null}

            {!teamLoading && !teamError && !canManageTeam ? (
              <p className="text-sm text-[#64748B]">
                Rollen koennen nur von Owner oder Admin geaendert werden.
              </p>
            ) : null}

            {!teamLoading && !teamError && canManageTeam && ownerCount <= 1 ? (
              <p className="text-sm text-[#64748B]">
                Mindestens ein Owner muss bestehen bleiben.
              </p>
            ) : null}

            {!teamLoading && canManageTeam ? (
              <div className="rounded-[18px] border border-[#E2E8F0] bg-white p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  <UserPlus className="h-3.5 w-3.5" />
                  Teammitglied einladen
                </p>
                <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                  <input
                    type="email"
                    placeholder="E-Mail-Adresse"
                    value={inviteEmail}
                    onChange={(event) => {
                      setInviteEmail(event.target.value);
                      setInviteError(null);
                      setInviteNotice(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") inviteMember();
                    }}
                    disabled={inviting}
                    className="app-input flex-1 px-4 py-3"
                  />
                  <select
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(
                        event.target.value as "admin" | "member" | "viewer",
                      )
                    }
                    disabled={inviting}
                    className="app-select min-w-[170px]"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Mitarbeiter</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button
                    onClick={inviteMember}
                    disabled={inviting || !inviteEmail.trim()}
                    loading={inviting}
                  >
                    <UserPlus className="h-4 w-4" />
                    Einladen
                  </Button>
                </div>

                {inviteError ? (
                  <p className="mt-3 text-sm text-[#B91C1C]">{inviteError}</p>
                ) : null}
                {inviteNotice ? (
                  <p className="mt-3 text-sm text-[#047857]">{inviteNotice}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          icon={Key}
          iconClassName="bg-[#ECFCCB] text-[#4D7C0F]"
          title="API-Zugriff"
          description="Schluessel fuer Webhooks oder externe Integrationen"
          open={openCard === "api"}
          onToggle={() => toggleCard("api")}
        >
          <div className="space-y-4">
            <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                API-Schluessel
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <code className="flex-1 rounded-md border border-[#E2E8F0] bg-white px-4 py-3 font-mono text-sm text-[#0F172A]">
                  wesponde_live_****************
                </code>
                <Button variant="secondary">Kopieren</Button>
              </div>
            </div>
            <p className="text-sm text-[#64748B]">
              Verwende diesen Schluessel fuer sichere Server-Integrationen. Teile
              ihn niemals oeffentlich.
            </p>
            <Button variant="secondary">Neuen Schluessel generieren</Button>
          </div>
        </SectionCard>

        <SectionCard
          icon={Shield}
          iconClassName="bg-[#FEE2E2] text-[#B91C1C]"
          title="Sicherheit"
          description="Konto-Sicherheit, Passwort-Hinweis und Abmeldung"
          open={openCard === "sicherheit"}
          onToggle={() => toggleCard("sicherheit")}
        >
          <div className="space-y-4">
            <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-[#0F172A]">
                Letzte Anmeldung
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                Heute, von diesem Geraet.
              </p>
            </div>
            <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-[#0F172A]">
                Passwort aendern
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                Du kannst dein Passwort ueber den Login-Bereich zuruecksetzen.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#FEE2E2]/20 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-sm font-semibold text-[#EF4444]">Gefahrenzone</h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Wenn du dich abmeldest, wirst du zu der Login-Seite weitergeleitet.
              </p>
            </div>
            <Button variant="danger-outline" onClick={handleLogout} className="shrink-0">
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
