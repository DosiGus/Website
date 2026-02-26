# Wesponde - Letzte Updates

**Letzte Session:** 26. Februar 2026
**Status:** Homepage-Feinschliff (Google Kalender Demo, Flow Builder Demo, Animation-Timing)

---

## Was wurde gemacht (26. Februar 2026) – Homepage Feinschliff

### GoogleCalendarSyncDemo – Komplett ueberarbeitet (`components/GoogleCalendarSyncDemo.tsx`)
- Linke Seite: Authentische Instagram-DM-Bubble mit Gradient-Avatar + Online-Indikator
- Linke Seite: Timeline-Connector-Linie zwischen Steps, Badge-Labels pro Step (Instagram DM / Google Calendar API / etc.)
- Linke Seite: Nummerierte Kreise → Checkmark bei abgeschlossenen Steps, pulsierende Dots beim aktiven Step
- Rechte Seite: Echte 3-Tage-Ansicht (Fr / Sa / So) statt 7 Spalten → Spalten 3x breiter, kein Text mehr abgeschnitten
- Rechte Seite: Echter Google-G (4-farbig: blau/gruen/gelb/rot) statt generischem Icon
- Rechte Seite: Event-Block absolut positioniert via CSS calc(), zeigt Titel + Uhrzeit ("10:00 – 10:30")
- Rechte Seite: Event-Farbuebergang animiert: hellblau (pruefen) → Google-Blau (bestaetigt) → Gruen (synchronisiert)
- Rechte Seite: Samstag-Spalte mit Google-Blau-Highlight (Datum-Kreis + Spalten-Hauch)
- Rechte Seite: Status-Footer mit farbigem Dot-Indikator

### FlowBuilderDemo – Komplett ueberarbeitet (`components/FlowBuilderDemo.tsx`)
- Canvas-Nodes mit farbigem Left-Accent-Bar (gruen/indigo/violett) statt einfachen Border-Boxen
- Input/Output-Handles (farbige Dots) an Node-Enden sichtbar
- SVG-Verbindungspfade werden animiert gezeichnet (stroke-dasharray / drawConn Keyframe)
- "+" Button zwischen Steps: erscheint animiert an der Output-Handle-Position
- Linkes Panel: echter Node-Editor mit Typing-Animation (38ms/Zeichen), Fortschrittsleiste (1/4 ... 4/4)
- Quick Replies auf dem Canvas als violette Pills sichtbar, erscheinen einzeln nacheinander
- Template-Picker: Emojis durch farbige Indikator-Dots ersetzt (keine Emojis in der gesamten Komponente)
- Animationsgeschwindigkeit: 25s Gesamtzyklus (vorher 15.5s) fuer entspannte, gut lesbare Darstellung
- Responsive Hoehe: h-[420px] sm:h-[500px] lg:h-[520px] – kein Abschneiden mehr bei kleineren Viewports
- Node-Positionen angepasst: confirm bei top=326 fuer ausreichend Platz auch mit QR Pills

---

## Was wurde gemacht (26. Februar 2026)

### Homepage Hero & Positionierung
- Hero-Copy auf allgemeinen Terminbuchungs-Fokus umgestellt (weg von reinem Restaurant-Wording)
- Benefit-Leiste unter CTA vereinfacht auf klare Outcomes:
  - Kuerzere Antwortzeiten
  - Weniger No-Shows
  - Mehr Bewertungen
- iPhone-Mockup-Dialog auf allgemeine Terminbuchung angepasst:
  - Header: "Wesponde"
  - Anfrage/Bestätigung ohne Tisch-Reservierungsbezug

### Interaktive Demo ohne Login
- `Demo starten` auf der Homepage oeffnet jetzt eine interaktive Template-Demo direkt fuer Besucher
- Neues Demo-Modal mit:
  - Branchenauswahl
  - Template-Auswahl
  - Live-Simulation des Flows
- Fallback-Route `/demo` hinzugefuegt, damit der Einstieg auch ohne funktionierende Client-Hydration moeglich bleibt
- Filterlogik verfeinert:
  - Links nur 4 Branchen
  - Bei jeder Branche werden passende Templates + Bewertungs-Template angezeigt

### Google Kalender Sektion (neu)
- Neue Sektion zwischen "Ablauf" und "Ergebnisse" eingefuegt
- Visualisiert den Prozess:
  - Anfrage
  - Verfuegbarkeitspruefung
  - Terminbestaetigung
  - automatische Kalender-Synchronisierung
- Rechte Demo-Karte auf klarere Google-Kalender-Optik umgebaut (Zeitraster + Event-Block)
- Begriffe wie "Bot/Chatbot" in diesem Bereich entfernt und durch neutrales Wording ersetzt

### Localhost-Stabilitaet
- Development-Header in `next.config.js` so angepasst, dass lokale Hydration/HMR nicht durch Custom-CSP behindert wird
- Ziel: zuverlaessiges lokales Testen vor Deployments

---

## Was wurde gemacht (17. Februar 2026)

### Branchen-Pivot & UI (Trainer/Fitness/Beauty)
- Branchen-Auswahl im Onboarding/Settings (gastro/fitness/beauty) mit branchenspezifischen Defaults
- Copy/Labels pro Branche (z. B. Reservierung -> Termin) inkl. Sidebar/Dashboard/Flows
- Vertical-Wechsel nur fuer Owner, Rollen-Guard in Settings
- Review-Template bleibt immer sichtbar (branchenunabhaengig)

### Google Calendar (Verfuegbarkeit & Events)
- OAuth Flow stabil (CSRF, Callback, Token-Refresh) + UI-Connect/Test
- Kalender-Auswahl (nicht nur Primary) + Time-Zone Handling
- Free/Busy Check + Slot-Vorschlaege + Cache (geringe API-Calls)
- Event-Lifecycle: Create/Update/Cancel inkl. google_event_id Speicherung
- Atomaritaet: Event vor DB-Insert, Rollback bei Insert-Fehler

### Webhooks/Flow-Engine Hardening
- Idempotency Gate fuer Messages + Duplicate-Handling (inkl. Postbacks ohne mid)
- Optimistic Concurrency (state_version) + Conflict-Retry via QStash
- Final-Step-Logik gefixt, Flow-Trigger-Hijack verhindert
- Quick-Reply-Stale-Fallback + "Ich habe dich nicht verstanden" Standardantwort
- Instagram API Retries mit Exponential Backoff + Rate-Limit Awareness
- Contacts Upsert gegen Race-Condition
- QStash Process Endpoint: Signatur-Check verpflichtend + 5xx bei Errors
- Flow-Matching priorisiert beste Keywords (keine Substring-False-Positives)

### Sicherheit & Zugriff (RLS + Rollen)
- Token-Verschluesselung (Meta/Google) inkl. Fallback wenn Key fehlt
- RLS erzwungen durch User-Client; Admin-Client nur wo noetig
- requireAccountMember strikt: falsches x-account-id -> 403
- Rollenchecks fuer Schreib-Endpoints (Flows/Integrations/Reservations/Settings)
- Unique Index integrations: (account_id, provider)
- Security Headers (CSP, X-Frame-Options, etc.) via `next.config.js`
- Legacy user_id Policies entfernt, WITH CHECK + Delete-Policies ergaenzt
- flow_templates + message_failures + integration_alerts RLS aktiviert

### Reservations & Data-Handling
- PATCH cancel/no_show: Calendar-Cancel VOR DB-Update (konsistent mit DELETE)
- Slot-unavailable setzt State/Node sauber zurueck (nur wenn Update gelingt)
- 15.30 als Zeit erkannt (am Time-Node), "heute/morgen" TZ-sicher
- GuestCount normalisiert (NaN-Schutz), Defaults fuer Nicht-Gastro
- calendar_store_failed explizit behandelt
- Reservation-Fallback wenn Google Calendar down (mit Warn-Message)

### System Jobs & Benachrichtigungen
- Meta Token Refresh Cron (automatisch ab Tag 50) + Resend Email Alerts
- Logging/Diagnostics fuer OAuth/Webhook-Faelle erweitert
- Cleanup Jobs fuer oauth_states, message_failures, calendar_cache
- Log-DB Write optional via ENV (Sampling)

### UX/Builder Stabilitaet
- FlowBuilder: Backspace nur bei Selektion, beforeunload Warnung, Autosave nur bei Changes
- FlowBuilder: Token Refresh pro Request, Inline-Edit trifft korrektes Node
- ReservationsClient: Filter/Page Race entschaerft
- WhatsApp-Placeholder Button disabled (kein toter Klick)

### Tests
- `npm run lint`
- `npm run build`

---

## Was wurde gemacht (15.-16. Februar 2026)

### Instagram Webhook Fix (GELOEST)

**Problem:** Nutzer konnten sich mit Instagram verbinden (OAuth erfolgreich), aber der Bot antwortete nicht auf DMs. Webhooks wurden von Meta nicht geliefert fuer Non-Admin-Accounts.

**Root Cause:**
1. **OAuth-Methode:** Scope-basierte OAuth (`dialog/oauth` mit `scope=...`) registrierte die App nicht auf Instagram-Ebene. Umstellung auf **Facebook Login for Business (FLB)** mit `config_id` loeste dies.
2. **Page-Subscription Timing:** Page-Level Webhook-Subscription muss bei jeder Neu-Verbindung aktiv sein, BEVOR DMs gesendet werden. Webhooks sind nicht rueckwirkend.

**Fixes:**

| Fix | Datei |
|-----|-------|
| OAuth auf FLB mit `config_id` umgestellt | `app/api/meta/oauth/start/route.ts` |
| Read Receipts frueh filtern (kein message + kein postback -> skip) | `app/api/webhooks/instagram/route.ts` |
| `instagram_business_manage_messages` zum OAuth-Scope | `lib/meta/types.ts` |
| DB-Index auf `integrations.instagram_id` | Migration + `supabase/schema.sql` |
| Page-Subscription-Logging verbessert | `app/api/meta/oauth/callback/route.ts` |

**Verifiziert:** 2 verschiedene Sender auf aboobot3, kompletter Flow durchlaufen mit Variablen-Extraktion.

---

## Was wurde gemacht (6. Februar 2026)

### Registrierungs-Flow: Security + UX Overhaul

**Security (P0):**
- `AppAuthGate.tsx`: `getSession()` -> `getUser()` (serverseitige Token-Validierung)
- `middleware.ts` (NEU): Server-Side Middleware schuetzt `/app/*` Routen, refresht Auth-Tokens
- `@supabase/ssr` installiert fuer cookie-basierte Sessions

**Zuverlaessigkeit (P1):**
- `app/auth/callback/route.ts` (NEU): Dedizierter Callback fuer Email-Bestaetigung (token_hash) + PKCE (code)
- `lib/supabaseBrowserClient.ts`: Migriert auf `createBrowserClient` aus `@supabase/ssr`
- `lib/supabaseSSRClient.ts` (NEU): Cookie-basierter Server-Client fuer SSR
- Deutsche Fehlermeldungen statt roher englischer Supabase-Strings

**UX (P2):**
- Passwort-Bestaetigung + 5-Stufen Staerke-Indikator beim Signup
- "E-Mail erneut senden" Button + "Zum Login" Link nach Signup-Erfolg
- Firmenname-Feld beim Signup (geht in user_metadata.full_name -> Account-Name)
- AGB/Datenschutz-Checkbox (required) beim Signup

---

## Was wurde gemacht (5. Februar 2026)

### DB-Restructuring: Multi-Tenant SaaS (Erledigt)

**Ziel:** Datenbank von Single-User (`user_id`) auf Multi-Tenant (`account_id`) umgebaut.

- **`accounts` + `account_members`:** Tenant-Entity mit Rollen (owner/admin/member/viewer)
- **`account_id` auf allen Tabellen:** flows, integrations, conversations, reservations, review_requests, logs
- **RLS:** `user_account_ids()` Helper-Funktion, account-basierte Policies
- **Signup-Trigger:** `on_auth_user_created` erstellt automatisch Account + Owner-Membership
- **`contacts` + `contact_channels`:** Gaeste trackbar ueber mehrere Gespraeche
- **Kanal-Spalten:** `channel`, `channel_sender_id` auf conversations, `channel_message_id` auf messages

---

## Fruehere Sessions (30. Jan - 2. Feb 2026)

- Variable-System + Zusammenfassung
- Reservierungen in DB speichern + Duplikate verhindern
- Bestehende Reservierung pruefen (Stornieren/Behalten/Neu)
- Google-Review-Flow (Bewertung nach "Besuch abgeschlossen")
- Flow Simulator (Testmodus im Browser)
- MCP-Integration (Supabase + Vercel)

---

## Status der Features

### Erledigt

| Feature | Beschreibung |
|---------|--------------|
| Instagram OAuth (FLB) | Verbindung mit config_id, Approach 4 fuer Page-Discovery |
| Instagram Webhooks | DM-Empfang + Verarbeitung fuer alle Accounts |
| Flow Builder | Visueller Editor fuer Konversationsflows |
| Flow Templates | Vorgefertigte Templates (Restaurant, Salon, etc.) |
| Flow Simulator | Test-Modus im Browser |
| Variable-Extraktion | Name, Datum, Zeit, Gaeste, Telefon, Wuensche |
| Platzhalter-Ersetzung | `{{name}}`, `{{date}}`, etc. in Nachrichten |
| Reservierung erstellen | Automatisch bei Bestaetigung |
| Reservierungs-Dashboard | UI zum Verwalten von Buchungen |
| Google-Review-Flow | Bewertung nach "Besuch abgeschlossen" inkl. Google-Link |
| Google Calendar Integration | OAuth + Free/Busy + Events (Create/Update/Cancel) |
| Token Auto-Refresh (Meta) | Cron + Email-Alerts vor Ablauf |
| Multi-Tenant DB | Accounts, Team-Rollen, account_id auf allen Tabellen |
| Kontakte & Kanaele | contacts, contact_channels, channel-agnostische Spalten |
| Messages Team-Zugriff | RLS + API account-basiert |
| Signup Auto-Provisioning | Trigger erstellt Account + Owner bei Registrierung |
| Auth Security Overhaul | getUser(), middleware, cookie-basierte Sessions |
| Logging | Webhook/OAuth-Events werden geloggt |

### Geplant

| Feature | Beschreibung |
|---------|--------------|
| Reservierungs-Benachrichtigungen | Email/Push bei neuer Reservierung |
| WhatsApp Integration | Zusaetzlicher Kanal (DB vorbereitet) |
| Kalender-Integration | iCal/Outlook zusaetzlich zu Google |
| Billing/Stripe | Subscription-Modell |
| Analytics Dashboard | Statistiken zu Flows/Reservierungen |

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `app/api/webhooks/instagram/route.ts` | Webhook-Endpoint + Flow-Logik (HAUPTDATEI) |
| `app/api/meta/oauth/start/route.ts` | OAuth-Start (FLB mit config_id) |
| `app/api/meta/oauth/callback/route.ts` | OAuth-Callback (Approach 4, Page-Subscription) |
| `lib/apiAuth.ts` | Auth: `requireUser()` + `requireAccountMember()` |
| `lib/contacts.ts` | Kontakt-Verwaltung: findOrCreateContact, updateDisplayName |
| `lib/webhook/flowExecutor.ts` | Flow-Ausfuehrung + Summary-Fallback |
| `lib/webhook/flowMatcher.ts` | Flow-Matching nach account_id |
| `lib/webhook/variableExtractor.ts` | Variablen erkennen (Name, Datum, Uhrzeit, etc.) |
| `lib/webhook/reservationCreator.ts` | Reservierung erstellen (mit account_id + contact_id) |
| `lib/meta/instagramApi.ts` | Send-API (POST /me/messages mit Page Token) |
| `lib/meta/webhookVerify.ts` | Signatur-Verifikation (beide Secrets) |
| `supabase/schema.sql` | Komplettes DB-Schema (14 Tabellen, Multi-Tenant) |

---

## Bekannte Einschraenkungen

- **Token Auto-Refresh:** Cron + Resend ENV muessen gesetzt sein, sonst manuelle Re-Auth
- **Review-Flow:** Wird bei aktiven Chats verschoben (keine Unterbrechung)
- **QStash:** Keys muessen gesetzt sein, sonst keine Async-Verarbeitung

---

## Bekannte technische Schulden

- SQL-Migration: `messages.processing_started_at` + `messages.processed_at` (Idempotency)
- `conversations.instagram_sender_id` ist NOT NULL -> blockiert channel-agnostische Conversations
- `calendar_availability_cache` Tabelle + Policies/Trigger muessen in Prod existieren (falls genutzt)
