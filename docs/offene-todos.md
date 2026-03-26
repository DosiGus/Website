# Offene TODOs — Wesponde

> Stand: 2026-03-23
> Priorisierung: 🔴 P0 (Launch Blocker) · 🟡 P1 (Qualitätskritisch) · 🟢 P2 (Nice to have)

---

## Backend

### 🔴 P0 — Launch Blocker

---

#### ~~1. `nodeIsConfirmation()` prüft falschen Variant-Wert → Reservierungen werden nicht erstellt~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt (3 Schutzschichten):**

Schicht 1 — TypeScript (Compile-Zeit):
- `flowTypes.ts`: neuer `FlowNodeVariant` Union-Typ (`"message" | "choice" | "input" | "confirmation" | "link" | "info"`). `FlowNodeData.variant` nutzt diesen Typ statt `string`.
- `flowTemplates.ts`: `nodes: any[]` → `nodes: TemplateNode[]` mit striktem `variant: FlowNodeVariant` (required). TypeScript-Fehler beim Schreiben eines neuen Templates mit falschem Variant-Wert.
- Alle 3 Template Confirmation-Nodes (Restaurant, Salon, Medical) von `variant: "message"` auf `variant: "confirmation"` korrigiert.

Schicht 2 — Zod-Schema (Runtime/API):
- `route.ts`: `templateNodeSchema` validiert `variant` gegen `VALID_NODE_VARIANTS`.
- `templateDataSchema` mit `.refine()` erweitert: Reservierungs-Templates müssen einen `variant: "confirmation"` Node haben. Schlägt fehl → Template wird nicht verwendet, Fallback auf Default-Preset.
- Metadata wird jetzt an beide `templateDataSchema.safeParse()` Aufrufe übergeben.

Schicht 3 — Lint-Regel (Builder):
- `flowLint.ts`: Warnung wenn Reservierungs-Flow keinen Confirmation-Node hat.
- `FlowBuilderClient.tsx`: `metadata` wird an `lintFlow()` übergeben.

Webhook:
- `nodeIsConfirmation()` prüft ausschließlich `variant`. Keyword-Matching entfernt.

**Datei:** `app/api/webhooks/instagram/route.ts` (Zeile ~538)

```typescript
function nodeIsConfirmation(nodeId, nodeLabel, nodeVariant): boolean {
  return (
    variantLower === "confirmed" ||   // ← BUG: sollte "confirmation" sein
    CONFIRMATION_NODE_KEYWORDS.some(...)
  );
}
```

**Problem:** Alle Nodes haben `variant: "confirmation"` (definiert in `FlowNodeData`), aber die Prüfung sucht nach `"confirmed"`. Der Variant-Zweig matcht **niemals**. Als Fallback greifen nur Keyword-Matches auf node.id/label (z.B. `includes("confirm")`, `includes("gebucht")`). Jeder Confirmation-Node der nicht zufällig eines dieser Wörter im ID oder Label hat → keine Reservierung wird erstellt, der Gast erhält die Bestätigung aber nichts wird gespeichert.

**Fix:** `variantLower === "confirmed"` → `variantLower === "confirmation"`

---

#### ~~2. Keine Escape-Möglichkeit für End-Kunden — Bot-Sackgasse~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- Escape-Handler in `route.ts` direkt nach Idempotenz-Gate, vor jeder Flow-Verarbeitung eingefügt.
- Keywords: `stopp`, `stop`, `abbrechen`, `abbruch`, `neustart`, `neu starten`, `von vorne`, `nochmal von vorne`, `reset`, `hilfe`, `help`, `beenden`, `ende`, `cancel`, `quit`.
- Nur für Textnachrichten (nicht Quick-Reply-Klicks), nur wenn ein Flow aktiv ist.
- Bei Escape: Conversation-State vollständig zurückgesetzt (`current_flow_id`, `current_node_id`, `metadata.variables` geleert). Antwort mit aktiven Trigger-Keywords als Quick-Reply-Buttons.
- **Hauptmenü-Button:** Jede nicht-abschließende Antwort im Flow bekommt automatisch einen "🏠 Hauptmenü" Quick-Reply-Button am Ende (max 13 gesamt, kein Doppel-Button). Klick setzt Variablen zurück und springt zum Start-Node des laufenden Flows.
  - `__HAUPTMENU__` Handler vor regulärem Quick-Reply-Handler.
  - Button wird NICHT angezeigt wenn: Flow-Ende, Confirmation-Node, bereits 13 Quick-Reply-Buttons vorhanden, oder `__HAUPTMENU__` schon drin ist.

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~3. Kein Fallback wenn kein Flow matcht — Bot schweigt~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- Fallback-Block in `route.ts` direkt vor dem Send-Block eingefügt.
- Feuert nur wenn `!flowResponse && messageType !== "image" && fallbackEnabled === true`.
- Liest `accounts.settings.fallback_enabled` (Default: `true`).
- Lädt aktive Trigger-Keywords via `listTriggerKeywords(accountId, 6)`.
- Text: *"Hallo! 👋 Das habe ich leider nicht verstanden. Schreib z.B. "reservieren", "termin" und ich helfe dir gerne weiter."*
- Keywords werden als Quick-Reply-Buttons angezeigt (kapitalisiert).
- Kein `matchedFlowId` / `matchedNodeId` → Conversation-State bleibt sauber.

**Account-Einstellung (Benutzer-steuerbar):**
- `app/api/account/settings/route.ts` → GET gibt `fallback_enabled` zurück, PATCH speichert es in `accounts.settings` JSONB.
- `app/app/settings/page.tsx` → "Bot-Verhalten" Akkordeon-Karte mit Toggle + Erklärungstext. Zeigt aktuellen Status ("Fallback an/aus") im Karten-Header.
- `components/app/FlowBuilderClient.tsx` → Cockpit-Infozeile zeigt "Fallback aktiv/deaktiviert" mit Link zu Einstellungen. Lädt Status einmalig on mount.

**Dateien:** `app/api/webhooks/instagram/route.ts`, `app/api/account/settings/route.ts`, `app/app/settings/page.tsx`, `components/app/FlowBuilderClient.tsx`

---

#### ~~4. Slot-Injection nutzt Node-ID-Pattern-Matching statt `collects`-Feld~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- Neues `matchedFlowNodes: any[] | null` tracking neben `matchedFlowId/NodeId/Metadata` — in allen 4 Assignment-Branches gesetzt (Hauptmenü, Quick-Reply, Free-Text, neuer Flow-Match).
- `isTimeAskNode`-Check ersetzt durch zweistufige Logik:
  1. **Primary:** `executedNode?.data?.collects === "time"` — funktioniert für alle Flows inkl. UUID-basierter Custom-Flows ohne Extra-DB-Query.
  2. **Fallback:** Legacy Node-ID-Pattern (`includes("time")`, `includes("uhrzeit")`) — für Flows die vor dem `collects`-Feld erstellt wurden.
- Kein Extra-DB-Query nötig — Nodes sind bereits im Scope via `matchedFlowNodes`.

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~5. Kein Conversation-Timeout — Konversationen bleiben ewig offen~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- Webhook-Check-Ansatz (kein Cron nötig): Beim Eingang jeder Nachricht wird geprüft ob die Konversation stale ist.
- Stale-Bedingung: `current_flow_id !== null && current_node_id !== null && last_message_at < jetzt - 24h`.
- `last_message_at` zu allen 3 conversation-SELECT-Statements hinzugefügt (initial load, upsert, fallback query).
- Reset-Block direkt nach Contact-Backfill, vor Message-Extraktion: löscht `current_flow_id`, `current_node_id`, `metadata.variables`, `metadata.reservationId`, `metadata.flowCompleted`.
- In-Memory `conversation`-Objekt wird sofort aktualisiert — alle nachfolgenden Checks sehen den frischen State.
- Fehlerresilienz: Bei Version-Konflikt (concurrent request) wird der Reset übersprungen und geloggt (non-critical).
- Timeout konfigurierbar via `CONVERSATION_TIMEOUT_MS` Konstante (aktuell 24h).

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~6. `forceNewReservation` hardcoded auf `"reservieren"` → funktioniert nur für Gastro~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt (3-Schichten-Strategie):**

**Schicht 1 — Exakter Flow-Restart (Primär, 100% korrekt):**
- `reservations.flow_id` war bereits im DB-Schema vorhanden und wird bereits beim Erstellen geschrieben — aber nie beim Restart gelesen.
- `flow_id` zu `resolveExistingReservation()` SELECT hinzugefügt.
- Neue Funktion `loadFlowById(flowId)` in `flowMatcher.ts`: lädt genau diesen Flow (nur wenn Status `"Aktiv"`), gibt `MatchedFlow` zurück.
- Bei `forceNewReservation`: lade bestehende Reservierung → wenn `flow_id` vorhanden → restart exakt diesen Flow. Funktioniert für alle Verticals, alle Branchen, beliebig viele Flows — kein Rätselraten.

**Schicht 2 — Scoring-Heuristik (Fallback für ältere Reservierungen):**
- Neue Funktion `findBookingFlow(accountId)`: bewertet aktive Flows nach Booking-Relevanz (+3 expliziter Reservierungs-Typ, +2 Booking-Nodes, +1 Basis). Für Accounts ohne `flow_id` in der Reservierung (Altdaten).

**Schicht 3 — Keyword-Matching (letzter Fallback):**
- `findMatchingFlow(accountId, messageText)` wie bisher. Greift wenn weder `flow_id` noch Scoring-Flow gefunden.

**Logging:** `strategy: "exact_flow_restart" | "booking_flow_scoring"` — nachvollziehbar warum welcher Flow gewählt wurde.

**Dateien:** `lib/webhook/flowMatcher.ts` (2 neue Funktionen), `app/api/webhooks/instagram/route.ts`

---

#### ~~7. Keine Server-seitige Lint-Validierung vor Flow-Aktivierung~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- `lib/flowLint.ts`: `import { Edge, Node }` → `import type { Edge, Node }` — macht die Funktion server-safe (kein reactflow-Runtime-Import auf dem Server).
- `app/api/flows/[id]/route.ts` PUT-Handler: Lint-Gate direkt nach Optimistic-Lock-Check, vor dem DB-Update.
- Wenn `body.status === "Aktiv"`: effektive Nodes/Edges/Triggers/Metadata aus body nehmen — wenn eines fehlt, aktuellen DB-Stand via Supabase laden (single SELECT).
- `lintFlow()` ausführen → `warnings.filter(w => w.severity === "warning")` → wenn blocking Warnings vorhanden: `422 LINT_FAILED` mit warnings-Array zurückgeben.
- `severity: "info"` Warnungen sind nicht blockend (z.B. Schleifen, unlabeled Edges) — nur echte Fehler blockieren die Aktivierung.
- Client-seitiger Lint (UI-Gate) bleibt unverändert — Server-Lint ist ein zusätzlicher Backstop für direkte API-Calls.

**Dateien:** `lib/flowLint.ts`, `app/api/flows/[id]/route.ts`

---

#### ~~8. Keine Benachrichtigung für Account-Owner bei neuer Reservierung~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- Neue Datei `lib/email/reservationNotification.ts` mit `sendReservationNotification(accountId, variables, reservationId)`.
- Lädt Owner-Email: `account_members` WHERE `role = "owner"` → `supabase.auth.admin.getUserById()`.
- Schickt HTML-Email via Resend mit: Gast-Name, Datum, Uhrzeit, Personenanzahl, Telefon/Email/Notizen (optional), Dashboard-Link-Button.
- Fire-and-forget: `void sendReservationNotification(...)` — blockiert den Webhook-Response nie. Alle Fehler werden geloggt, nie geworfen.
- Aufruf in `app/api/webhooks/instagram/route.ts` direkt nach dem Success-Log, vor dem Calendar-Warning-Check.
- Auch wenn Resend nicht konfiguriert ist (kein API-Key): stiller Fallback via `sendEmail()` — kein Crash.

**Dateien:** `lib/email/reservationNotification.ts` (neu), `app/api/webhooks/instagram/route.ts`

---

### 🟡 P1 — Qualitätskritisch

---

#### ~~9. Cross-Flow Trigger-Konflikte: keine Warnung, kein UI, kein Schutz~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**

**Deterministischer Tiebreaker (`lib/webhook/flowMatcher.ts`):**
- `findMatchingFlow` selektiert jetzt `updated_at` aus der DB.
- Sort: Primary = höchster Score, Tiebreaker = `updated_at` (neuerer Flow gewinnt via `localeCompare`). Kein zufälliges Verhalten mehr bei Score-Gleichstand.

**Cross-Flow Konflikt-Erkennung:**
- Neue Funktion `findCrossFlowConflicts(accountId, currentFlowId, triggers)` in `lib/webhook/flowMatcher.ts`.
- Lädt alle anderen aktiven Flows des Accounts, vergleicht Keywords normalisiert (lowercase+trim), gibt `CrossFlowConflict[]` zurück.
- Dedupliziert: ein Eintrag pro Keyword+Flow-Kombination.

**API-Integration (`app/api/flows/[id]/route.ts`):**
- PUT-Handler führt nach erfolgreichem Lint-Gate einen Conflict-Check durch.
- Nicht-blockend: Flow wird trotzdem aktiviert. Konflikte landen als `conflict_warnings` in der Response.
- Response-Shape: `{ success: true, updated_at, conflict_warnings?: CrossFlowConflict[] }`.

**FlowBuilder UI (`components/app/FlowBuilderClient.tsx`):**
- Neuer State `conflictWarnings` — wird nach jedem Save aus der Response befüllt (oder geleert wenn keine Konflikte).
- Dismissibles Warning-Panel unterhalb des Cockpits wenn `conflictWarnings.length > 0 && status === "Aktiv"`.
- Zeigt jedes konfliktierendes Keyword + Name des anderen Flows. Operator kann direkt sehen wo der Konflikt liegt und ihn beheben.
- Autoclearing: wenn der Operator das Keyword entfernt und der nächste Autosave läuft, verschwindet das Panel automatisch.

**Dateien:** `lib/webhook/flowMatcher.ts`, `app/api/flows/[id]/route.ts`, `components/app/FlowBuilderClient.tsx`

---

#### ~~10. Extra DB-Query für `collects`-Feld in jedem Freitext-Message-Processing~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- `let currentActiveFlow` vor dem collects-Block deklariert (außerhalb beider `if`-Blöcke).
- Erster Query: `select("nodes")` → `select("nodes, edges, metadata")` — deckt jetzt beide Anwendungsfälle ab.
- Zweiter Query (free-text block): komplett entfernt, ersetzt durch `const currentFlow = currentActiveFlow`.
- Ergebnis: **1 DB-Query statt 2** für jede Nachricht in einer aktiven Konversation. Kein Logik-Change.
- Bedingungs-Analyse: collects läuft immer wenn `messageText + current_flow_id + current_node_id` → free-text hat dieselben Bedingungen + `!flowResponse` → free-text ist ein echter Subset. Wenn free-text läuft, hat collects immer schon geladen.
- Bekannter Trade-off: Bei DB-Fehler im collects-Query → `currentActiveFlow = null` → free-text überspringt ebenfalls. Vorher: free-text hatte eigenen Query (unabhängiger Retry). Akzeptiert: wenn Supabase in einem Request einmal versagt, ist ein zweiter Versuch Millisekunden später unwahrscheinlich erfolgreich. Praktischer Impact: minimal.

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~11. `reservations.user_id NOT NULL` kann bei neuen Accounts scheitern~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt (2-Schichten-Guard):**

**Schicht 1 — Frühzeitiges Warning (non-blocking):**
- Nach dem Fallback-Block: wenn `userId` nach `integration.user_id` UND Owner-Fallback immer noch null → `reqLogger.warn()`.
- Non-fatal: Bot läuft weiter für Nicht-Reservierungs-Flows (FAQ, Info etc.).

**Schicht 2 — Guard direkt vor DB-Insert (blocking für Reservierungen):**
- Direkt in `if (shouldCreateReservation && canCreateReservation(...))` VOR `createReservationFromVariables()`.
- Wenn `!userId`: `reqLogger.error()` → `sendInstagramMessage()` mit *"Es gab ein technisches Problem. Bitte versuche es erneut oder kontaktiere uns direkt."* → `return`.
- Verhindert den DB-Crash (NOT NULL constraint) und gibt dem Gast eine klare Fehlermeldung statt Schweigen.
- Die Confirmation-Nachricht des Flows wird nicht gesendet (kein false-positive "Reservierung bestätigt").

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~12. Veraltete Reservierung blockiert neuen Flow (Zeitfenster zu weit)~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- In `resolveExistingReservation()`: `cutoffDateStr = heute - 1 Tag` (YYYY-MM-DD) berechnet.
- `.gte("reservation_date", cutoffDateStr)` zur `buildReservationQuery()` hinzugefügt.
- Gilt für alle 3 Aufrufe von `buildReservationQuery()` gleichzeitig (contact_id-Pfad, Legacy-Pfad, Instagram-Sender-Pfad) — eine Änderung, alle Pfade abgedeckt.
- `-1 Tag` Puffer: deckt UTC/CET Timezone-Edge-Cases ab (deutsche Accounts = UTC+1/+2).
- Reservierungen ab gestern/heute/Zukunft → weiterhin geblockt ✅
- Reservierungen von vor 2+ Tagen → nicht mehr geblockt ✅

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~13. Kein Mechanismus für Korrekturen/Neustart im laufenden Flow~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt (3-Schichten-Architektur):**

**Schicht 1 — Neue Helper-Funktionen (module-level, `route.ts`):**
- `findCollectionNodeForField(nodes, field)`: findet den Flow-Node der ein bestimmtes Feld sammelt.
  - Primary: `node.data.collects === field` (Sentinel `__custom_empty__` wird ignoriert).
  - Fallback: Legacy node.id Pattern-Matching (für alte Templates ohne `collects`-Feld).
- `formatVariableForCorrection(key, value)`: formatiert Variablen kurz genug für Quick Reply Labels.
  - Datum: `"2026-03-15"` → `"15.03.2026"` (via `formatDisplayDate`).
  - Andere Felder: max. 14 Zeichen, dann `"…"`.

**Schicht 2 — Correction Handler** (nach `currentActiveFlow`-Laden, vor Response-Bestimmung):

*"nochmal"* → Re-ask Current Question:
- Ermittelt `collects`-Key des `current_node_id` (Primary: `node.data.collects`, Fallback: node.id Pattern).
- Löscht die zugehörige Variable aus `mergedVariables`.
- Führt `executeFlowNode(current_node_id, ...)` erneut aus → selbe Frage wird neu gestellt.
- `current_node_id` bleibt unverändert — der Flow-State wird nicht vorangeschaltet.
- Speichert geklärte Variable via `updateConversationState({ metadata })` → return early.

*"ändern" / "korrigieren" / "falsch"* → Variable Summary:
- Iteriert über `FIELD_LABELS` (name, date, time, guestCount, phone, email, specialRequests).
- Erstellt Quick Reply Button für jede gesammelte Variable: Label = `"📅 Datum: 15.03.2026"`, Payload = `__CORRECT_date__`.
- Sendet "Was möchtest du ändern?" mit max. 12 Buttons.
- Wenn noch keine Variablen gesammelt: freundliche Meldung.

**Schicht 3 — `__CORRECT_<field>__` Quick Reply Handler** (nach `__HAUPTMENU__`, vor normalem QR Handler):
- Extrahiert `field` aus Payload (z.B. `"__CORRECT_date__"` → `"date"`).
- Lädt Flow (bevorzugt `currentActiveFlow` um Extra-DB-Query zu vermeiden).
- Ruft `findCollectionNodeForField(nodes, field)` auf.
- Löscht `mergedVariables[field]`.
- Führt `executeFlowNode(correctionNode.id, ...)` aus → setzt `flowResponse` + `matchedNodeId`.
- Persistiert geklärte Variable via `updateConversationState` (vor dem normalen Send-Path).
- `current_node_id` wird via normalen Send-Path auf `correctionNode.id` gesetzt.
- Graceful Fallback: wenn Node nicht gefunden → "Dieses Feld konnte ich leider nicht finden. Tippe 'nochmal'…"

**UX-Flow Beispiel:**
1. Gast ist bei "Wie viele Personen?" und tippt "nochmal" → selbe Frage wird erneut gestellt, guestCount gecleart.
2. Gast tippt "ändern" → Bot zeigt "Was möchtest du ändern?" mit Buttons für Name, Datum, Uhrzeit.
3. Gast klickt "📅 Datum: 15.03." → Bot löscht Datum und stellt die Datums-Frage erneut.
4. Gast antwortet mit neuem Datum → Flow geht weiter als wäre nichts gewesen.

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~14. Slot-Injection überschreibt Flow-Text hart — kein Fallback bei Kalender-Fehler~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt:**
- Root cause: `getGoogleAccessToken()` wirft `"Google Kalender ist nicht verbunden."` → wird in `getAvailableSlotsForDate()` gefangen → gibt `[]` zurück → Webhook sieht `[]` und schreibt irreführende "keine freien Zeiten"-Warnung.
- Fix in `lib/google/availability.ts`: `getAvailableSlotsForDate` gibt jetzt `string[] | null` zurück. `null` = kein Kalender verbunden (explizites Signal), `[]` = Kalender verbunden aber Datum ausgebucht, `[...]` = freie Slots vorhanden.
- Fix im Webhook: `if (availableSlots === null)` → no-op (Flow-Text bleibt unverändert). Nur der `[]`-Zweig zeigt die Warnung.
- Nur ein Aufrufer (`app/api/webhooks/instagram/route.ts`) → Return-Type-Änderung ist safe.

**Dateien:** `lib/google/availability.ts`, `app/api/webhooks/instagram/route.ts`

---

#### ~~15. Verarbeitungsfehler im Webhook werden nicht zum Gast kommuniziert~~ ✅ ERLEDIGT 2026-03-25

**Umgesetzt (robuste Enterprise-Lösung):**
- Benachrichtigung direkt im `catch`-Block von `processMessagingEvent()` — nutzt bereits im Speicher vorhandene Variablen (`accessToken`, `senderId`), kein DB-Query nötig.
- `ConversationStateConflictError` → kein Notify (wird via QStash retried, kein false-positive für den Gast).
- Alle anderen Fehler → best-effort `sendInstagramMessage()` mit Text: *"Es tut mir leid, es gab einen technischen Fehler. Bitte versuche es in einem Moment erneut."*
- Vollständig fire-and-forget: `sendInstagramMessage`-Aufruf in eigenem `try/catch` — wenn auch das fehlschlägt, wird es ignoriert.
- `handleProcessingError()` ist reines Logging + Conflict-Retry (kein DB-Re-Query für Access-Token) — robuster bei DB-Ausfällen, da keine zweite Supabase-Abfrage im Fehlerfall.

**Warum diese Lösung besser als `handleProcessingError`-Ansatz:**
- Der ursprüngliche Plan war: in `handleProcessingError` die Integration per DB-Query laden und den Token entschlüsseln. Problem: wenn der ursprüngliche Fehler ein DB-Ausfall war, schlägt auch dieser zweite DB-Query fehl. Die jetzige Lösung hat keinen DB-Kontakt im Fehlerfall — `accessToken` und `senderId` sind bereits im Scope von `processMessagingEvent`.

**Datei:** `app/api/webhooks/instagram/route.ts`

---

#### ~~16. Kein Schutz gegen Aktivierung von mehr als X Flows gleichzeitig~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt (Backend + Client):**

**Backend (`app/api/flows/[id]/route.ts`):**
- Konstanten: `ACTIVE_FLOW_LIMITS = { free: 1, premium: 5, enterprise: 50 }`, `DEFAULT_PLAN = "free"`.
- Plan aus `accounts.settings.plan` (lowercase, Fallback: `"free"`).
- Check VOR dem Lint-Gate — Business-relevantes Feedback zuerst, keine unnötige Lint-Arbeit.
- Zwei Queries **parallel** via `Promise.all`: `accounts.settings` + `flows` COUNT mit `.neq("id", params.id)` (kein Doppelzählen bei Re-Aktivierung).
- Bei Limit überschritten → **403** mit `code: "PLAN_LIMIT_EXCEEDED"`, `limit`, `plan` + German error string (Singular/Plural korrekt).

**Client (`components/app/FlowBuilderClient.tsx`):**
- Neuer `else if (response.status === 403)` Branch in `handleSave`.
- Bei `code === "PLAN_LIMIT_EXCEEDED"`: `setStatus("Entwurf")` — lokale Aktivierung zurückgesetzt.
- 6s Anzeigedauer (statt 4s) — längere Fehlermeldung braucht mehr Lesezeit.

**Dateien:** `app/api/flows/[id]/route.ts`, `components/app/FlowBuilderClient.tsx`

---

#### ~~17. `NEUE_RESERVIERUNG` Quick Reply startet keinen Flow wenn `messageText` leer ist~~ ✅ ERLEDIGT 2026-03-26

**Problem:** Die äußere Bedingung `if (!flowResponse && messageText)` gated den gesamten Block wo NEUE_RESERVIERUNG, CANCEL_EXISTING_RESERVATION und KEEP_EXISTING_RESERVATION verarbeitet werden. Manche Meta-Client-Versionen schicken bei Quick Reply Klicks kein `message.text` → `messageText = ""` → der Block wurde übersprungen → Flow startet nicht.

**Fix (`app/api/webhooks/instagram/route.ts`):**
- Neues `hasSpecialReservationPayload` Boolean vor dem Block definiert (deckt NEUE_RESERVIERUNG, FORCE_NEW_RESERVATION, CANCEL_EXISTING_RESERVATION, KEEP_EXISTING_RESERVATION ab).
- Bedingung: `if (!flowResponse && (messageText || hasSpecialReservationPayload))` — Special Payloads bypassen die `messageText`-Prüfung.
- Zusätzlicher Guard: `findMatchingFlow(accountId, messageText)` wird nur aufgerufen wenn `messageText` nicht leer ist — verhindert unnötige DB-Query bei leerem Text.

---

#### ~~18. Kein Retry-Mechanismus für fehlgeschlagene Instagram-Nachrichten~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt (vollständige Retry-Pipeline):**

**DB-Schema (`supabase/schema.sql`):**
- 3 neue Spalten in `message_failures`: `retry_count integer not null default 0`, `next_retry_at timestamptz`, `resolved_at timestamptz`.
- Partial Index: `CREATE INDEX message_failures_retry_idx ON message_failures(next_retry_at, retry_count) WHERE retryable = true AND resolved_at IS NULL` — macht Cron-Query O(failures) statt O(table).
- Migration-SQL im Schema kommentiert (Anweisung: in Supabase SQL Editor ausführen).

**`lib/meta/messageFailures.ts`:**
- `recordMessageFailure()` setzt bei Insert: `retry_count: 0`, `resolved_at: null`.
- Bei `retryable: true`: `next_retry_at = jetzt + 2 min` — verhindert sofortigen Doppel-Send (Race mit dem Original-Versuch).
- Bei `retryable: false`: `next_retry_at = null` — Cron ignoriert diesen Eintrag.

**`app/api/cron/message-retry/route.ts` (neu):**
- `MAX_RETRIES = 3`, exponentieller Backoff: `[2min, 10min, 60min]` (Index = retry_count vor dem nächsten Versuch).
- `BATCH_SIZE = 50` — verhindert Timeout auf Vercels 10s Function Limit.
- Bearer-Token-Auth via `CRON_SECRET` (gleicher Mechanismus wie `meta/refresh`-Cron).
- Fetch: `retryable = true`, `resolved_at IS NULL`, `retry_count < 3`, `next_retry_at <= now` — nutzt Partial Index.
- Token-Caching: `Map<integrationId, token | null>` — verhindert N+1 Queries pro Batch (eine Supabase-Query pro Integration, nicht pro Failure).
- Image-Type Skipped: URLs können abgelaufen sein — sicher überspringen.
- Bei Erfolg: `resolved_at = now` gesetzt.
- Bei Fehler (< MAX_RETRIES): `retry_count++`, `next_retry_at = now + backoff[newCount]`.
- Bei Erschöpfung (= MAX_RETRIES): `retry_count = MAX_RETRIES`, `resolved_at` bleibt `null` — für Ops-Sichtbarkeit in Logs.
- Response: `{ processed, retried, failed, skipped }`.

**`vercel.json`:**
- `{ "path": "/api/cron/message-retry", "schedule": "*/5 * * * *" }` — läuft alle 5 Minuten.

**Offen (manuell):** Migration SQL muss einmalig in Supabase SQL Editor ausgeführt werden:
```sql
ALTER TABLE message_failures
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE INDEX IF NOT EXISTS message_failures_retry_idx
  ON public.message_failures(next_retry_at, retry_count)
  WHERE retryable = true AND resolved_at IS NULL;
```

**Dateien:** `supabase/schema.sql`, `lib/meta/messageFailures.ts`, `app/api/cron/message-retry/route.ts` (neu), `vercel.json`

---

### 🟢 P2 — Gut zu haben

---

#### ~~19. Team-Invite-UI fehlt (DB-Struktur vorhanden)~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt (Backend + Auth + UI):**

**Backend (`app/api/account/members/route.ts`):**
- `POST /api/account/members`: Einladen per E-Mail + Rolle (admin/member/viewer, nicht owner).
  - Rate-limit: strict (20/min).
  - Bestehender Auth-User → direkt zu `account_members` hinzufügen (Service-Role-Insert) + Benachrichtigungs-Email via Resend.
  - Neuer User → `supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { invited_account_id, invited_role } })` → Supabase sendet Invite-Email.
- `DELETE /api/account/members`: Mitglied entfernen (Owner/Admin only). Guards: kein Selbst-Entfernen, kein Owner-Entfernen ohne Owner-Rolle, letzter Owner bleibt bestehen.
- `buildInviteEmail()`: HTML-Email (Deutsch) für beide Szenarien (hinzugefügt vs. eingeladen).

**Auth Callback (`app/auth/callback/route.ts`):**
- Nach `exchangeCodeForSession`: prüft `session.user.user_metadata.invited_account_id` + `invited_role`.
- Wenn vorhanden: fügt User via Service-Role in `account_members` ein (idempotent: kein Doppel-Insert).
- Fehler werden geloggt, blockieren den Auth-Flow nicht.
- Damit funktioniert der vollständige Invite-Flow: Invite-Email → Signup → automatisch Mitglied des einladenden Accounts.

**Settings UI (`app/app/settings/page.tsx`):**
- Invite-Formular (E-Mail + Rollen-Select + Einladen-Button) im Team-Akkordeon — nur für Owner/Admin sichtbar.
- Remove-Button (🗑️) auf jedem Member-Item — respektiert Berechtigungsregeln (kein Selbst-Entfernen, kein Owner-Entfernen durch Admins).
- States: `inviteEmail`, `inviteRole`, `inviting`, `inviteNotice`, `inviteError`, `teamRemovingId`.
- Enter-Key in E-Mail-Input triggert Einladung.

**Bekannte Einschränkung:** Eingeladene neue User bekommen vom Signup-Trigger automatisch auch einen eigenen Account erstellt. Ohne Account-Switcher-UI haben sie in der aktuellen App-Version nur Zugriff auf ihren eigenen Account. Die Mitgliedschaft im einladenden Account ist korrekt gespeichert und wird bei einer zukünftigen Account-Switcher-Implementierung sofort funktionieren.

**Dateien:** `app/api/account/members/route.ts`, `app/auth/callback/route.ts`, `app/app/settings/page.tsx`

---

#### ~~20. Flow Export/Import UI fehlt (API vorhanden)~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt (`components/app/FlowBuilderClient.tsx`):**
- **Export:** Button "⬇ Export" in der Toolbar → ruft `GET /api/flows/[id]/export` auf → Download als `flow-[id].json`. `exporting` State verhindert Doppelklick. `handleExport` war bereits implementiert, fehlte nur der UI-Button.
- **Import:** Button "⬆ Import" in der Toolbar → öffnet Hidden-File-Input (`.json`-Filter) → liest Datei, validiert Mindeststruktur (`nodes`/`edges` müssen Arrays sein) → `POST /api/flows` mit importierten Daten + Name als `"[Originalname] (Import)"` → Redirect auf neuen Flow.
- `importInputRef` (useRef) + Hidden `<input type="file" accept=".json">` — `e.target.value = ""` nach Import-Start damit dieselbe Datei erneut gewählt werden kann.
- Fehlerbehandlung: ungültige JSON → `setErrorMessage("Ungültige Flow-Datei...")`, API-Fehler → Fehlermeldung aus Response.
- F5-Eintrag ebenfalls als erledigt markiert.

**Dateien:** `components/app/FlowBuilderClient.tsx`

---

#### ~~21. Output-Config nicht editierbar im Builder~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt (`components/app/FlowBuilderClient.tsx`):**

**Bereits vorhanden (vor dieser Session):**
- "Flow-Einstellungen"-Button im Header öffnet Settings-Panel via `showFlowSettings` State.
- Panel zeigt: Flow-Typ-Toggle (Buchungs-Flow / Freier Flow) + Pflichtfelder-Checkboxen (name, date, time, guestCount, phone, email).
- Cockpit-Leiste zeigt gesammelte Felder (grün = Pflichtfeld, grau = optional).

**Diese Session — Fixes für korrekte `defaults`-Verwaltung:**

**`handleToggleFlowType`:**
- Wenn auf "reservation" für non-Gastro-Verticals (fitness, beauty) gewechselt wird: `guestCount` nicht in requiredFields → `defaults: { guestCount: 1 }` wird jetzt explizit gesetzt.
- Vorher: defaults fehlte → Webhook-Fallback hat guestCount=1 zur Laufzeit hinzugefügt. Jetzt ist die gespeicherte Config semantisch vollständig.

**`handleToggleRequiredField`:**
- `guestCount` aus requiredFields entfernt → `defaults.guestCount = 1` wird gesetzt.
- `guestCount` wieder hinzugefügt → `defaults.guestCount` wird gelöscht.

**UI-Hint:**
- `guestCount`-Button zeigt `· Standard: 1` wenn nicht als Pflichtfeld markiert → Betreiber sieht sofort den verwendeten Standardwert.

**Use Cases jetzt vollständig unterstützt:**
- Fitness-Studio: `guestCount` abwählen → `defaults.guestCount = 1` gesetzt → Buchung mit 1 Person.
- Beauty-Salon: `date` abwählen → Flow benötigt kein Datum → Buchung ohne Datum.
- Gastro: `guestCount` bleibt Pflichtfeld → Gast muss Personenzahl angeben.

**Datei:** `components/app/FlowBuilderClient.tsx`

---

#### ~~22. Supabase SMTP nicht konfiguriert~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt — Supabase Auth Hook statt SMTP-Konfiguration:**

**Ansatz:** Statt Supabase's SMTP-Einstellungen zu konfigurieren (die Supabase-Templates verwenden würden), wurde ein **Supabase Auth Hook** implementiert. Supabase ruft die eigene Next.js API auf, die alle Auth-Emails über Resend sendet — mit vollständigem Wesponde-Branding und maximaler Kontrolle über Templates.

**Neue Datei `app/api/auth/email-hook/route.ts`:**
- `POST /api/auth/email-hook` — empfängt Supabase-Webhook bei jedem Auth-Email-Event.
- Bearer-Auth via `AUTH_EMAIL_HOOK_SECRET` (neues Env-Var, auch in `.env.local.example` ergänzt).
- Verarbeitet alle 6 Email-Typen: `signup`, `recovery`, `invite`, `magic_link`, `email_change_new/current`, `reauthentication`.
- Mappt `email_action_type` → `verifyOtp` Type für `/auth/callback?token_hash=...&type=...`.
- Ruft `sendEmail()` aus `lib/email/resend.ts` auf (bereits vorhanden).
- Gibt immer HTTP 200 zurück — auch bei Resend-Fehler (Grund: Non-200 würde Supabase veranlassen, seinen Default-Sender als Fallback zu nutzen → Doppel-Email).

**Branded HTML-Templates (Deutsch, inline CSS):**
- Alle 5 Template-Funktionen (signup, recovery, invite, magic_link, email_change) mit Wesponde Light Theme.
- Design: `#121624` Header, `#f6f9ff` Hintergrund, `#2450b2` Links, `#171923`/`#3d4255` Text.
- Fallback-Link unter jedem Button (für Email-Clients die Buttons blockieren).
- `baseLayout()` und `ctaButton()` als wiederverwendbare Hilfsfunktionen.

**Manueller Setup-Schritt (Supabase Dashboard):**
1. `Authentication → Hooks → send_email` Hook aktivieren.
2. URL: `https://wesponde.com/api/auth/email-hook`
3. Secret: Neues zufälliges Secret generieren → in Supabase Dashboard eintragen + als `AUTH_EMAIL_HOOK_SECRET` in Vercel-Env-Vars setzen.

**Datei:** `app/api/auth/email-hook/route.ts` (neu), `.env.local.example`

---

#### ~~23. `conversations.instagram_sender_id NOT NULL` blockiert Channel-Erweiterung~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt (Code + Migration):**

**DB-Migration (`supabase/migration_conversations_channel_sender.sql`):**
- Backfill: `UPDATE conversations SET channel_sender_id = instagram_sender_id WHERE channel_sender_id IS NULL`.
- `ALTER TABLE conversations ALTER COLUMN instagram_sender_id DROP NOT NULL`.
- `DROP INDEX conversations_integration_sender_idx` (alter Unique-Index auf `instagram_sender_id`).
- `CREATE UNIQUE INDEX conversations_integration_channel_sender_idx ON (integration_id, channel, channel_sender_id) WHERE channel_sender_id IS NOT NULL`.

⚠️ **Migration muss manuell im Supabase SQL-Editor ausgeführt werden** — Datei: `supabase/migration_conversations_channel_sender.sql`

**Webhook (`app/api/webhooks/instagram/route.ts`):**
- Conversation-Lookup: `.eq("instagram_sender_id", ...)` → `.eq("channel_sender_id", ...)` (2 Stellen).
- Upsert `onConflict`: `"integration_id,instagram_sender_id"` → `"integration_id,channel,channel_sender_id"`.
- `instagram_sender_id` wird für Instagram weiterhin gesetzt (backward compat), `channel_sender_id` ist der primäre Key.

**Schema + Interface:**
- `supabase/schema.sql`: `instagram_sender_id` als nullable mit Kommentar, neuer Index.
- `components/app/ConversationsClient.tsx`: `instagram_sender_id: string | null`, `channel_sender_id: string | null`.

**Resultat:** Instagram-DMs laufen wie bisher. WhatsApp/Facebook-Channels können `channel_sender_id` setzen ohne `instagram_sender_id` — kein NOT NULL Crash mehr.

---

#### ~~24. Token-Auto-Refresh Status unklar~~ ✅ ERLEDIGT 2026-03-26

**Analyse:**
- Der TODO referenzierte `app/api/cron/refresh-tokens/route.ts` — diese Datei existiert nicht. Die korrekte Datei ist `app/api/cron/meta/refresh/route.ts`.
- Der Cron ist korrekt in `vercel.json` eingetragen: `{ "path": "/api/cron/meta/refresh", "schedule": "0 3 * * *" }` — läuft täglich um 3:00 Uhr UTC.
- Token-Encryption-Integration war bereits korrekt: nutzt `decryptToken()`, `encryptToken()`, `isEncryptedToken()` aus `lib/security/tokenEncryption.ts`. Migriert Klartext-Tokens automatisch zu `enc:v1:`-Format wenn `TOKEN_ENCRYPTION_KEY` gesetzt ist.

**Problem:** Bei einem erfolgreichen Lauf (alle Tokens refreshed, keine Fehler) wurde **nichts in die `logs`-Tabelle** geschrieben — nur Warnings/Errors. Dadurch war nicht unterscheidbar ob der Cron nie lief oder erfolgreich lief.

**Fix (`app/api/cron/meta/refresh/route.ts`):**
- `reqLogger.info()` nach dem Env-Check: "Meta token refresh cron started" — jeder Lauf hinterlässt einen Eintrag.
- `reqLogger.info()` am Ende: "Meta token refresh cron completed" mit `{ total, refreshed, failed, skipped, alertsSent }` — vollständige Lauf-Statistik im Log.

**Monitoring-Query (Supabase SQL Editor):**
```sql
SELECT created_at, message, metadata
FROM logs
WHERE message ILIKE 'Meta token refresh cron%'
ORDER BY created_at DESC
LIMIT 20;
```

**Datei:** `app/api/cron/meta/refresh/route.ts`

---

## Frontend

> Die Frontend-TODOs sind weniger kritisch für den Launch, aber wichtig für die User Experience des Betreibers.

---

#### ~~F1. 🔴 Cross-Flow Trigger-Konflikt Warnung im Builder~~ ✅ ERLEDIGT 2026-03-26

**War bereits größtenteils umgesetzt (TODO #9, 2026-03-25):**
- `findCrossFlowConflicts(accountId, flowId, triggers)` in `lib/webhook/flowMatcher.ts` — vergleicht Keywords normalisiert gegen alle anderen aktiven Flows.
- PUT-Handler (`app/api/flows/[id]/route.ts`): Konflikt-Check nach Aktivierung, `conflict_warnings` in Response.
- `FlowBuilderClient.tsx`: `conflictWarnings` State + dismissibles Orange-Warning-Panel unterhalb des Cockpits. Autoclearing beim nächsten Save ohne Konflikte.

**Diese Session — Verbleibende Lücke geschlossen:**
Beim initialen Seitenaufruf eines bereits aktiven Flows mit bestehenden Konflikten wurden die Warnungen erst nach dem ersten Speichern angezeigt (`conflictWarnings` startet als `[]`).

**Fix (`app/api/flows/[id]/route.ts` GET-Handler):**
- Nach dem Flow-Laden: wenn `data.status === "Aktiv"` → `findCrossFlowConflicts()` ausführen.
- Bei Konflikten: `conflict_warnings` im GET-Response mitgeben (`{ ...data, conflict_warnings }`).
- Kein Extra-Response wenn keine Konflikte (minimaler Overhead).

**Fix (`components/app/FlowBuilderClient.tsx` `fetchFlow`):**
- Nach dem Laden: wenn `data.conflict_warnings` vorhanden → `setConflictWarnings()`.
- Warnungen sind damit sofort beim Öffnen des Builders sichtbar, ohne warten auf Save.

**Dateien:** `app/api/flows/[id]/route.ts`, `components/app/FlowBuilderClient.tsx`

---

#### F2. ✅ ERLEDIGT 2026-03-26 — Flow-Priorität / Reihenfolge sichtbar und steuerbar machen

**Implementierung:**
- `flows.metadata.priority` (integer) als Prioritätswert — kein DB-Migration nötig (JSONB)
- `lib/webhook/flowMatcher.ts`: Tiebreaker in `findMatchingFlow` Sort erweitert: erst `metadata.priority` (niedrig = hohe Priorität), dann `updated_at`
- `components/app/FlowListClient.tsx`:
  - `activeFlowsSortedByPriority` useMemo: alle aktiven Flows nach Priority sortiert
  - `priorityRankOf(flowId)`: gibt 1-basierten Rang zurück
  - `movePriority(flowId, direction)`: swappt Priority mit Nachbar-Flow via zwei parallele PUT `/api/flows/[id]` Calls; optimistisches Update + Rollback bei Fehler
  - `filteredFlows` Sort: Favoriten → Priority → updated_at (statt nur Favoriten)
  - Grid-View: `#N` Badge neben Status-Badge + ↑↓ Buttons neben Favorit-Star (nur bei ≥2 aktiven Flows)
  - Table-View: neue "Priorität"-Spalte mit `#N` Badge + ↑↓ Buttons (nur bei ≥2 aktiven Flows)

---

#### F3. ✅ ERLEDIGT 2026-03-26 — `collects`-Feld Pflicht für Freitext-Nodes im Builder

**Implementierung:**
- `lib/flowLint.ts`: Im `else`-Block (free_text-Zweig) der Node-Checks, nach der Weiterleitungs-Prüfung: wenn genau eine free_text-Edge vorhanden ist (gültiger Freitext-Node) aber `collects` leer oder `"__custom_empty__"` → Warning `"[Name] sammelt keine Variable"` mit Suggestion "Öffne den Schritt und wähle unter 'Speichern als' aus, welche Variable gesetzt werden soll".
- Trifft auf alle Freitext-Nodes zu — unabhängig vom Vertical. Bereits bestehende Warnungs-Anzeige im Builder (Cockpit-Panel, Warning-Pill) zeigt den Hinweis automatisch.

---

#### ~~F4. 🟡 Output-Config Editor im Inspector~~ ✅ ERLEDIGT 2026-03-26

**Umgesetzt:**

Die Buchungskonfiguration wurde in den **Variablen-Tab des InspectorSlideOver** integriert — dort wo der Betreiber bereits sieht welche Felder gesammelt werden. Das ist der natürlichste Kontext: "was wird gesammelt" + "was ist Pflichtfeld" gehört zusammen.

**`components/app/InspectorSlideOver.tsx`:**
- 4 neue Props: `outputType`, `requiredFields`, `onToggleFlowType`, `onToggleRequiredField`.
- `VariablesTab` um Abschnitt "Buchungskonfiguration" am Ende erweitert.
- Flow-Typ-Toggle (Buchungs-Flow / Freier Flow) + Pflichtfelder-Checkboxen — identisches Design wie Header-Panel inkl. `· Standard: 1` Hint für guestCount.

**`components/app/FlowBuilderClient.tsx`:**
- 4 neue Props an `<InspectorSlideOver>` übergeben: nutzt bestehende `outputType`, `requiredFields`, `handleToggleFlowType`, `handleToggleRequiredField` — kein doppelter State.

**Ergebnis:** Output-Config an 2 Stellen editierbar (beide teilen denselben State):
1. Header-Panel "Flow-Einstellungen" (schneller Zugriff, immer sichtbar)
2. Inspector → Tab "Variablen" (kontextuell, während man den Flow aufbaut)

**Dateien:** `components/app/InspectorSlideOver.tsx`, `components/app/FlowBuilderClient.tsx`

---

#### ~~F5. 🟡 Flow Export/Import UI~~ ✅ ERLEDIGT 2026-03-26 (siehe #20)

---

#### ~~F6. 🟡 Aktivierungscheck gegen Server-Lint~~ ✅ ERLEDIGT 2026-03-26

**Problem:** Der Server gibt bei Aktivierungs-Blockierung `422 LINT_FAILED` mit einem `warnings`-Array zurück. Der Client hat diesen Status-Code bisher nicht separat behandelt — er fiel in den generischen `else`-Branch und zeigte nur "Speichern fehlgeschlagen" an. Die konkreten Warnungen wurden ignoriert. Status wurde nicht auf "Entwurf" zurückgesetzt.

**Umgesetzt (`components/app/FlowBuilderClient.tsx`):**

**Neuer State:** `serverLintErrors: FlowLintWarning[]` (initial `[]`).

**Neuer `422`-Branch in `handleSave`:**
- `error.code === "LINT_FAILED"` → `setStatus("Entwurf")` (Aktivierung zurückgesetzt).
- `error.warnings` → `setServerLintErrors(warnings)` (konkrete Fehlerliste).
- `setCockpitIssuesExpanded(true)` → Cockpit-Warnungen klappen sich auf.
- `setSaveState("error")` mit 4s Timeout.

**Neues Modal "Server Lint Error Modal":**
- Erscheint wenn `serverLintErrors.length > 0`.
- Roter Akzent (Rose) statt Amber — visuell von Client-Warnungen unterscheidbar: das hier ist eine harte Server-Ablehnung.
- Titel: "Flow kann nicht aktiviert werden" + Erklärung.
- Jede Warning als eigene Kachel mit `w.message` + `w.suggestion`.
- Ein Button: "Verstanden — Flow bearbeiten" → leert `serverLintErrors`.
- Kein "Trotzdem aktivieren" — Server ist autoritativ.

**Datei:** `components/app/FlowBuilderClient.tsx`

---

#### F7. ✅ ERLEDIGT 2026-03-26 — Multi-Select im Canvas (Pro-Modus)

**Implementierung:**
- Canvas-Modus war deaktiviert (toggle entfernt). Wieder aktiviert via "Liste / Canvas" Toggle-Button in der Toolbar (zwischen Import und Flow Preview).
- `builderMode === "pro"`: rendert `FlowBuilderCanvas` (React Flow); `builderMode === "simple"`: rendert `FlowListBuilder` (bisheriges Verhalten)
- React Flow hatte Multi-Select bereits konfiguriert (`selectionOnDrag`, `multiSelectionKeyCode="Meta"`, `selectionKeyCode="Shift"`) — fehlte nur die UI-Integration.
- Floating Action Bar: erscheint wenn `selection.nodes.length > 1` — zeigt "N Schritte ausgewählt" + "Kopieren" Button + "Löschen" Button (roter Rand) + Hinweis "oder ⌫ Delete"
- `onSelectionChange={handleSelectionChange}` jetzt tatsächlich an Canvas verdrahtet
- Batch-Move funktioniert nativ über React Flow (Shift+Drag oder Box-Select → Drag)
- Canvas-Props: `onNodeClick` → `setSelectedNodeId`, `onNodeDoubleClick` → Inspector öffnen, `onEdgeClick` → `setSelectedEdgeId`, `onInit` → `setReactFlowInstance`

---

#### ~~F8. 🟢 Team-Invite UI~~ ✅ ERLEDIGT 2026-03-26 (siehe #19)

---

## Reihenfolge — Empfohlene Abarbeitung

```
Sprint 1 (Launch-kritisch, reine Backend-Fixes):
  #1  nodeIsConfirmation Bug → 30 min Fix
  #2  Escape-Keywords → 2h
  #3  Fallback-Nachricht bei kein Match → 1h
  #4  Slot-Injection via collects statt node.id → 1h
  #5  Conversation Timeout (Cron + Webhook-Check) → 3h
  #8  Reservierungs-Email via Resend → 2h

Sprint 2 (Qualität + Edge Cases):
  #6  forceNewReservation Fix → 1h
  #7  Server-seitige Lint-Validierung vor Aktivierung → 2h
  #10 Doppelten Flow-DB-Query entfernen → 1h
  #12 Datum-Filter bei Reservierungscheck → 30min
  #16 Plan-Limit für aktive Flows → 2h
  F1  Cross-Flow Konflikt Warnung UI → 3h
  F3  collects-Pflicht-Warnung im Builder → 1h

Sprint 3 (Wachstum):
  #18 Retry-Mechanismus für fehlgeschlagene Nachrichten
  #21 Output-Config Editor
  F2  Flow-Priorität sichtbar machen
  F5  Export/Import UI
  F8  Team-Invite UI
```
