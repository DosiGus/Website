# Wesponde - Letzte Updates

**Letzte Session:** 6. Februar 2026
**Status:** Registrierungsflow Security + UX Overhaul abgeschlossen

---

## Was wurde gemacht (6. Februar 2026)

### Registrierungs-Flow: Security + UX Overhaul

**Security (P0):**
- `AppAuthGate.tsx`: `getSession()` → `getUser()` (serverseitige Token-Validierung statt localStorage)
- `middleware.ts` (NEU): Server-Side Middleware schuetzt `/app/*` Routen, refresht Auth-Tokens
- `@supabase/ssr` installiert fuer cookie-basierte Sessions

**Zuverlaessigkeit (P1):**
- `app/auth/callback/route.ts` (NEU): Dedizierter Callback fuer Email-Bestaetigung (token_hash) + PKCE (code)
- `lib/supabaseBrowserClient.ts`: Migriert auf `createBrowserClient` aus `@supabase/ssr` (Singleton-Pattern)
- `lib/supabaseSSRClient.ts` (NEU): Cookie-basierter Server-Client fuer SSR
- `PartnerLoginForm.tsx`: emailRedirectTo + OAuth redirectTo zeigen auf `/auth/callback`
- Deutsche Fehlermeldungen statt roher englischer Supabase-Strings

**UX (P2):**
- Passwort-Bestaetigung + 5-Stufen Staerke-Indikator beim Signup
- "E-Mail erneut senden" Button + "Zum Login" Link nach Signup-Erfolg
- Firmenname-Feld beim Signup (geht in user_metadata.full_name → Account-Name)
- AGB/Datenschutz-Checkbox (required) beim Signup

**DB-Migration:**
- `create_account_for_user()`: `vertical` nicht mehr hardcoded 'restaurant', sondern NULL

**Copy-Fixes (P3):**
- Login-Seite: "Success-Team schaltet frei" → korrekter Self-Service Text
- Auth-Timeout von 4s auf 10s erhoeht

**Dashboard-Aenderungen (manuell noetig):**
- Supabase → Authentication → URL Configuration: `https://wesponde.com/auth/callback` als Redirect URL
- Supabase → Authentication → Email Templates: Confirmation Link → `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`

---

## Was wurde gemacht (5. Februar 2026)

### DB-Restructuring: Multi-Tenant SaaS (Erledigt)

**Ziel:** Datenbank von Single-User (`user_id`) auf Multi-Tenant (`account_id`) umgebaut.

#### Phase 1: Account-Modell
- **`accounts` Tabelle:** Tenant-Entity (Restaurant/Salon/Praxis) mit name, slug, vertical, settings
- **`account_members` Tabelle:** User-zu-Account-Zuordnung mit Rollen (owner/admin/member/viewer)
- **`account_id` auf allen Tabellen:** flows, integrations, conversations, reservations, review_requests, logs
- **Backfill:** 3 bestehende User automatisch zu Accounts migriert, alle Daten verknuepft
- **RLS:** `user_account_ids()` Helper-Funktion, account-basierte Policies parallel zu legacy user_id Policies
- **Signup-Trigger:** `on_auth_user_created` erstellt automatisch Account + Owner-Membership bei Registrierung

#### Phase 2: Kontakte & Kanal-Vorbereitung
- **`contacts` Tabelle:** Gaeste/Endkunden, trackbar ueber mehrere Gespraeche
- **`contact_channels` Tabelle:** Kanal-Identitaeten (Instagram PSID, WhatsApp, etc.) mit `account_id` + unique index
- **Kanal-Spalten:** `channel`, `channel_sender_id` auf conversations, `channel_message_id` auf messages
- **Backfill:** 2 Kontakte aus bestehenden Instagram-Sender-IDs erstellt und verknuepft

#### Code-Aenderungen
- **`lib/apiAuth.ts`:** Neue `requireAccountMember()` Funktion
- **`lib/contacts.ts`:** Neues Modul fuer Kontakt-Verwaltung (findOrCreateContact, etc.)
- **Alle API-Routes:** Umgestellt auf `account_id`-basierte Queries
- **Webhook:** `account_id` + `channel` Unterstuetzung
- **`supabase/schema.sql`:** Komplett neu geschrieben

#### Security-Fixes
- RLS-Luecke in `account_members` INSERT-Policy geschlossen (kein `or not exists` mehr)
- `search_path` auf allen Funktionen gesetzt
- RLS auf `oauth_states` und `flow_templates` aktiviert

#### Offene Punkte
- OAuth Callback Route muss `account_id` aus `oauth_states` lesen und in Integration schreiben
- Kontakt-Modell im Webhook noch nicht verdrahtet (findOrCreateContact nicht aufgerufen)
- Messages-RLS noch user-basiert (kein Team-Zugriff)

---

## Was wurde gemacht (2. Februar 2026)

### 1. Google‑Review‑Flow (Erledigt ✅)
- **Neu:** Review‑Flow als eigenes Template (Kategorie „Bewertungen“) mit Sternen‑Abfrage
- **Logik:** 1–2 Sterne → Feedback‑Frage, 3–5 Sterne → direkt Google‑Link
- **Variablen:** `{{googleReviewUrl}}` wird in der Nachricht ersetzt

### 2. Trigger bei „Besuch abgeschlossen“ (Erledigt ✅)
- **Jetzt:** Wenn eine Reservierung im Dashboard auf **completed** gesetzt wird, wird der Review‑Flow ausgelöst
- **Stabilität:** Versand wird serverseitig abgewartet (kein „Fire‑and‑forget“ mehr)

### 3. Google‑Review‑Link im Dashboard (Erledigt ✅)
- **Neu im UI:** Feld in **Integrationen → Meta/Instagram**
- Kein manuelles Eintragen in der DB nötig

### 4. Vercel Hobby Limit berücksichtigt (Erledigt ✅)
- Cron‑Job/Endpoint entfernt
- Review‑Flow läuft aktuell **nur** über „Besuch abgeschlossen“

### 5. Sichtbarkeit & Feedback (Erledigt ✅)
- Review‑Template ist in den Templates sichtbar und anpassbar
- Dashboard zeigt eine verständliche Meldung, falls der Review‑Flow nicht gesendet werden kann

---

## Vorherige Session (1. Februar 2026)

### 1. Reservierungs-Timing Fix (Erledigt ✅)
- **Problem:** Reservierung wurde zu früh erstellt (sobald Name/Datum/Zeit/Gäste da waren) - BEVOR Telefon und Sonderwünsche eingegeben werden konnten
- **Lösung:** Data-Collection-Nodes (ask-phone, ask-special, etc.) werden jetzt explizit ausgeschlossen
- **Ergebnis:** Reservierung wird nur noch beim `confirmed` Node erstellt

### 2. Bestehende Reservierungen prüfen (Erledigt ✅)
- **Problem:** Alte `reservationId` im Metadata blockierte neue Reservierungen
- **Lösung:**
  - `existingMetadata` wird jetzt bei Flow-Start korrekt zurückgesetzt
  - Prüfung ob Reservierung zur aktuellen Conversation gehört UND noch aktiv ist
- **Ergebnis:** User kann jetzt problemlos neue Reservierungen machen

### 3. Metadata-Verwaltung verbessert (Erledigt ✅)
- `existingMetadata` von `const` zu `let` geändert
- Wird bei Flow-Start und "Neue Reservierung" korrekt aktualisiert
- Keine "Ghost"-Reservierungen mehr durch alte IDs

### 4. MCP-Integration Setup (Erledigt ✅)
- Supabase MCP verbunden
- Vercel MCP verbunden
- Direkte DB-Abfragen und Deployment-Management möglich

---

## Status der Features

### Erledigt ✅

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Instagram OAuth | ✅ | Verbindung mit Instagram-Account |
| Flow Builder | ✅ | Visueller Editor für Konversationsflows |
| Flow Templates | ✅ | Vorgefertigte Templates (Restaurant, Salon, etc.) |
| Flow Simulator | ✅ | Test-Modus im Browser |
| Webhook-Verarbeitung | ✅ | Empfang und Verarbeitung von Instagram DMs |
| Variable-Extraktion | ✅ | Name, Datum, Zeit, Gäste, Telefon, Wünsche |
| Platzhalter-Ersetzung | ✅ | `{{name}}`, `{{date}}`, etc. in Nachrichten |
| Zusammenfassung | ✅ | Summary-Node zeigt alle Daten |
| Reservierung erstellen | ✅ | Automatisch bei Bestätigung |
| Telefon speichern | ✅ | Wird jetzt korrekt in DB gespeichert |
| Sonderwünsche speichern | ✅ | Wird jetzt korrekt in DB gespeichert |
| Bestehende Reservierung prüfen | ✅ | User wird gefragt: Stornieren/Behalten/Neu |
| Reservierungs-Dashboard | ✅ | UI zum Verwalten von Buchungen |
| Logging | ✅ | Webhook-Events werden geloggt |
| Google‑Review‑Flow | ✅ | Bewertung nach „Besuch abgeschlossen" inkl. Google‑Link |
| Multi-Tenant DB (Phase 1) | ✅ | Accounts, Team-Rollen, account_id auf allen Tabellen |
| Kontakte & Kanaele (Phase 2 DB) | ✅ | contacts, contact_channels, channel-agnostische Spalten |
| Signup Auto-Provisioning | ✅ | Trigger erstellt Account + Owner bei Registrierung |

### In Arbeit 🔄

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| OAuth Callback Fix | 🔄 | account_id in integrations schreiben |
| Kontakte im Webhook | 🔄 | findOrCreateContact verdrahten |

### Geplant 📋

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Messages Team-Zugriff | 📋 | RLS + API auf account_id umstellen |
| Reservierungs-Benachrichtigungen | 📋 | Email/Push bei neuer Reservierung |
| WhatsApp Integration | 📋 | Zusätzlicher Kanal (DB vorbereitet) |
| Kalender-Integration | 📋 | Google Calendar, iCal |
| Billing/Stripe | 📋 | Subscription-Modell |
| Analytics Dashboard | 📋 | Statistiken zu Flows/Reservierungen |

---

## Commits dieser Session (2. Februar 2026)

```
Lokale Änderungen (noch nicht gepusht)
```

---

## Vorherige Session (30. Januar 2026)

### Erledigt ✅
- Variable-System + Zusammenfassung
- Reservierungen in DB speichern
- Webhook/Flow Stabilisierung
- FlowBuilder Test Mode

### Commits
```
cfe5e15a Fix: Telefon und Wünsche werden jetzt korrekt gespeichert
d0b4793a Fix: Name, Telefon und Wünsche werden korrekt gespeichert
55b9cbdf Feature: Zeige bestehende Reservierung wenn User eine neue machen will
8b4b901d Fix: Prüfe ob Reservierung wirklich in DB existiert
6443ca37 Fix: Erweiterte Reservierungs-Erkennung
42ead012 Fix: Reservierungen werden jetzt bei mehr Node-Namen erstellt
```

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `app/api/webhooks/instagram/route.ts` | Webhook-Endpoint + Flow-Logik (HAUPTDATEI) |
| `lib/apiAuth.ts` | Auth: `requireUser()` + `requireAccountMember()` |
| `lib/contacts.ts` | Kontakt-Verwaltung: findOrCreateContact, updateDisplayName |
| `lib/webhook/flowExecutor.ts` | Flow-Ausfuehrung + Summary-Fallback |
| `lib/webhook/flowMatcher.ts` | Flow-Matching nach account_id |
| `lib/webhook/variableExtractor.ts` | Variablen erkennen (Name, Datum, Uhrzeit, etc.) |
| `lib/webhook/variableSubstitutor.ts` | Platzhalter ersetzen |
| `lib/webhook/reservationCreator.ts` | Reservierung erstellen (mit account_id + contact_id) |
| `lib/flowTemplates.ts` | Templates (Summary-Platzhalter) |
| `components/app/FlowBuilderClient.tsx` | Flow-Editor UI |
| `components/app/FlowSimulator.tsx` | Testmodus im FlowBuilder |
| `components/app/ReservationsClient.tsx` | Reservierungs-Dashboard |
| `lib/reviews/reviewSender.ts` | Review-Flow Versand (bei completed) |
| `supabase/schema.sql` | Komplettes DB-Schema (14 Tabellen, Multi-Tenant) |

---

## Zum Testen

### Neuer Reservierungsflow
1. Neuen Flow anlegen und auf "Aktiv" setzen
2. Instagram DM senden (z.B. "Reservieren")
3. Flow komplett durchspielen:
   - Datum wählen
   - Uhrzeit wählen
   - Gästeanzahl wählen
   - Name eingeben
   - **Telefonnummer eingeben** ← Jetzt funktioniert!
   - **Sonderwünsche eingeben** ← Jetzt funktioniert!
   - Bestätigen
4. In Supabase prüfen:
   - `reservations` → `phone_number` und `special_requests` sollten gefüllt sein

### Bestehende Reservierung
1. User hat bereits aktive Reservierung
2. User schreibt "Reservieren"
3. System zeigt bestehende Reservierung + Optionen:
   - Stornieren
   - Behalten
   - Neue Reservierung

### Review‑Flow testen (ohne Cron)
1. Google‑Review‑Link in **Integrationen → Meta** speichern
2. Eine Reservierung haben (Status **confirmed**)
3. Im Dashboard auf **„Besuch abgeschlossen“** setzen
4. Ergebnis:
   - Gast erhält Stern‑Abfrage im Instagram‑Chat
   - 1–2 Sterne → Feedback‑Frage
   - 3–5 Sterne → Google‑Link

---

## Bekannte Einschränkungen

- **Test-Modus:** Instagram-Permissions erfordern Test-User in Meta Developer Portal
- **60-Tage Token:** Access Token muss alle 60 Tage erneuert werden
- **Webhook-Delay:** Instagram kann 1-2 Sekunden Verzögerung haben
- **Review‑Flow:** Aktuell nur per „Besuch abgeschlossen“ (kein Cron auf Hobby‑Plan)

---

## Nächste Session

### Priorität 1
- [ ] Reservierungs-Benachrichtigungen (Email/Push)

### Priorität 2
- [ ] Token-Refresh automatisieren
- [ ] WhatsApp Integration vorbereiten

### Nice-to-have
- [ ] Analytics Dashboard
- [ ] Kalender-Export
