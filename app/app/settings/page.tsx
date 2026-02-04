'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, Bell, Key, Shield, Save, CheckCircle, AlertTriangle, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "../../../lib/supabaseBrowserClient";

export default function SettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
