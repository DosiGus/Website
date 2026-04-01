import Link from "next/link";
import DashboardStats from "../../../components/app/DashboardStats";
import DashboardActiveFlows from "../../../components/app/DashboardActiveFlows";
import DashboardCalendar from "../../../components/app/DashboardCalendar";
import TokenExpiryAlert from "../../../components/app/TokenExpiryAlert";
import PageHeader from "../../../components/app/PageHeader";
import Badge from "../../../components/ui/Badge";
import { createSupabaseSSRClient } from "../../../lib/supabaseSSRClient";
import { ArrowRight, CalendarCheck, MessageCircle, Plug, Plus } from "lucide-react";

const ROLE_PRIORITY: Record<string, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

const INTEGRATION_LABELS: Record<string, string> = {
  meta: "Instagram",
  google_calendar: "Google Kalender",
};

type AccountMembershipRow = {
  account_id: string;
  role: string | null;
  joined_at: string | null;
};

async function loadConnectedIntegrationLabels() {
  const supabase = createSupabaseSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from("account_members")
    .select("account_id, role, joined_at")
    .eq("user_id", user.id);

  if (membershipError || !memberships || memberships.length === 0) {
    return [];
  }

  const primaryMembership = [...(memberships as AccountMembershipRow[])].sort((a, b) => {
    const roleDelta =
      (ROLE_PRIORITY[String(b.role)] ?? 0) - (ROLE_PRIORITY[String(a.role)] ?? 0);
    if (roleDelta !== 0) return roleDelta;
    const aJoined = a.joined_at ? new Date(a.joined_at).getTime() : 0;
    const bJoined = b.joined_at ? new Date(b.joined_at).getTime() : 0;
    return aJoined - bJoined;
  })[0];

  if (!primaryMembership?.account_id) return [];

  const { data: integrations, error: integrationsError } = await supabase
    .from("integrations")
    .select("provider, status")
    .eq("account_id", primaryMembership.account_id)
    .eq("status", "connected");

  if (integrationsError || !integrations) {
    return [];
  }

  return Array.from(
    new Set(
      integrations.map((integration) =>
        INTEGRATION_LABELS[integration.provider] ??
        integration.provider.replace(/_/g, " "),
      ),
    ),
  );
}

export default async function DashboardPage() {
  const connectedIntegrationLabels = await loadConnectedIntegrationLabels();
  const hasConnectedIntegrations = connectedIntegrationLabels.length > 0;

  return (
    <div className="space-y-8">
      <TokenExpiryAlert />

      <PageHeader
        title="Dashboard"
        description="Überblick über aktive Automationen, Integrationen und offene Vorgänge."
        action={
          <Link
            href="/app/flows/new"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-[#2450b2] px-8 py-3.5 text-base font-semibold text-white shadow-[0_2px_20px_rgba(36,80,178,0.3)] transition-all hover:bg-[#1a46c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Neuen Flow erstellen
          </Link>
        }
      />

      <DashboardStats />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="app-panel space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A]">Aktive Flows</h2>
              <p className="mt-1 text-sm text-[#475569]">
                Übersicht über aktive Automationen und ihren aktuellen Status.
              </p>
            </div>
            <Link
              href="/app/flows"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#1E4FD8] transition-colors hover:text-[#1a46c4]"
            >
              Alle anzeigen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <DashboardActiveFlows />
        </section>

        <aside className="app-panel space-y-5 p-6">
          <div>
            <Badge variant="accent">Quick Actions</Badge>
            <h2 className="mt-3 text-lg font-semibold text-[#0F172A]">
              Nächste sinnvolle Schritte
            </h2>
            <p className="mt-1 text-sm text-[#475569]">
              Direkter Zugang zu den wichtigsten Bereichen der App.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/app/integrations"
              className="app-card app-card-interactive flex items-start gap-3 rounded-2xl p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0EA5E9]">
                <Plug className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0F172A]">
                  Integrationen prüfen
                </span>
                <span className="mt-1 block text-sm text-[#475569]">
                  {hasConnectedIntegrations
                    ? "Aktuell verbundene Dienste in deinem Workspace."
                    : "Noch nichts verbunden. Bitte Instagram oder Google Kalender verbinden."}
                </span>
                <span className="mt-3 flex flex-wrap gap-2">
                  {hasConnectedIntegrations ? (
                    connectedIntegrationLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-[12px] font-medium text-[#1E4FD8]"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-[12px] font-medium text-[#B45309]">
                      Verbindung fehlt
                    </span>
                  )}
                </span>
              </span>
            </Link>

            <Link
              href="/app/reservations?status=pending"
              className="app-card app-card-interactive flex items-start gap-3 rounded-2xl p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
                <CalendarCheck className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0F172A]">
                  Offene Reservierungen
                </span>
                <span className="mt-1 block text-sm text-[#475569]">
                  Bestätigungen und Rückmeldungen ohne Umwege bearbeiten.
                </span>
              </span>
            </Link>

            <Link
              href="/app/conversations"
              className="app-card app-card-interactive flex items-start gap-3 rounded-2xl p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1E4FD8]">
                <MessageCircle className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0F172A]">
                  Konversationen öffnen
                </span>
                <span className="mt-1 block text-sm text-[#475569]">
                  Eingehende Verläufe, Status und Flow-Bezug schneller prüfen.
                </span>
              </span>
            </Link>
          </div>
        </aside>
      </div>

      <DashboardCalendar />
    </div>
  );
}
