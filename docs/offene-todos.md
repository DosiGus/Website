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

#### 8. Keine Benachrichtigung für Account-Owner bei neuer Reservierung

**Datei:** `lib/webhook/reservationCreator.ts` / kein Email-Service dafür vorhanden

**Problem:** Das Kernversprechen ist passive Automatisierung. Eine Reservierung wird erstellt während der Betreiber nicht am Computer ist. Aber es gibt **keine Email**, **kein Push**, **kein Dashboard-Badge** wenn eine neue Reservierung eintrifft. Der Betreiber muss aktiv das Dashboard öffnen.

Konsequenz: Betreiber merkten beim Pilottest nicht, dass Reservierungen ankamen → sie glaubten der Bot funktioniere nicht → Churn.

**Fix:** Nach erfolgreichem `createReservationFromVariables()` → Email über Resend an den Account-Owner senden. Template: Gast-Name, Datum, Uhrzeit, Personenanzahl, Link zum Dashboard. Resend ist bereits im Stack (für Token-Expiry-Alerts).

---

### 🟡 P1 — Qualitätskritisch

---

#### 9. Cross-Flow Trigger-Konflikte: keine Warnung, kein UI, kein Schutz

**Datei:** `lib/flowLint.ts` / `lib/webhook/flowMatcher.ts`

**Problem:** Ein Betreiber hat Flow A ("Reservierung") mit Trigger `"reservieren"` (CONTAINS) und Flow B ("FAQ") mit Trigger `"reservieren"` (CONTAINS). Beim Webhook-Eingang: beide matchen mit gleichem Score. `matches.sort((a, b) => b.score - a.score)` → die Reihenfolge nach dem Sort bei Gleichstand ist **nicht deterministisch** (abhängig von DB-Fetch-Reihenfolge).

`flowLint.ts` prüft nur einen Flow isoliert — keine cross-Flow Prüfung. Im Flow Builder sieht der Betreiber keinerlei Warnung.

**Fix (Backend):** Im `findMatchingFlow`: bei Score-Gleichstand nach `updated_at` (neuerer Flow gewinnt) als deterministischen Tiebreaker sortieren. Im `lintFlow` (oder als separater API-Endpoint): alle aktiven Flows des Accounts laden und Keyword-Überschneidungen melden.

**Fix (API):** Bei Flow-Aktivierung (`status: "Aktiv"`) alle anderen aktiven Flows des Accounts laden und prüfen ob Keyword-Konflikte existieren → als `warning` in der Response zurückgeben (kein Blocker, aber sichtbar).

---

#### 10. Extra DB-Query für `collects`-Feld in jedem Freitext-Message-Processing

**Datei:** `app/api/webhooks/instagram/route.ts` (Zeile ~973)

```typescript
const { data: flowForCollects } = await supabase
  .from("flows")
  .select("nodes")
  .eq("id", conversation.current_flow_id)
  .single();
```

**Problem:** Für jede eingehende Nachricht wenn eine aktive Konversation besteht: 1 extra DB-Roundtrip um die Nodes des aktuellen Flows zu laden (nur um `node.data.collects` zu lesen). Der Flow wird kurz danach für die Freitext-Verarbeitung nochmals geladen (Zeile ~1224). Das ist **2 redundante DB-Queries für denselben Flow** pro Nachricht.

**Fix:** Die beiden Flow-Loads zusammenführen. Den Flow einmal laden, dann für beide Zwecke (collects + freeTextResult) nutzen.

---

#### 11. `reservations.user_id NOT NULL` kann bei neuen Accounts scheitern

**Datei:** `app/api/webhooks/instagram/route.ts` (Zeile ~600)

**Problem:** `integration.user_id` kann null sein (nach Multi-Tenant-Migration). Der Fallback lädt den Account-Owner aus `account_members`. Wenn der Owner-Query fehlschlägt oder kein Owner existiert → `userId = null` → die Reservierungs-Insert schlägt mit NOT NULL constraint fehl (Fehler wird nur geloggt, User bekommt ggf. keine Bestätigung oder eine falsche Fehlermeldung).

**Fix:** Wenn `userId` null ist nach Fallback → Error loggen + dem Gast mitteilen: *"Es gab ein technisches Problem. Bitte versuche es erneut oder kontaktiere uns direkt."* Statt einfach fortzufahren und auf DB-Ebene zu crashen.

---

#### 12. Veraltete Reservierung blockiert neuen Flow (Zeitfenster zu weit)

**Datei:** `app/api/webhooks/instagram/route.ts` (Zeile ~1295)

```typescript
.in("status", ["pending", "confirmed"])
// kein Datum-Filter
```

**Problem:** Die Abfrage für "hat der Gast eine aktive Reservierung?" sucht nach Status `pending` oder `confirmed` — ohne Datum-Einschränkung. Eine Reservierung von vor 6 Monaten die nie auf "completed" gesetzt wurde (z.B. Betreiber vergessen), blockiert den Gast daran eine neue Reservierung zu machen. Er bekommt immer: *"Du hast bereits eine aktive Reservierung"*.

**Fix:** Datum-Filter hinzufügen: nur Reservierungen in der Zukunft (ab heute) oder maximal X Tage zurück als "aktiv" betrachten. Z.B. `reservation_date >= today - 1 day`.

---

#### 13. Kein Mechanismus für Korrekturen/Neustart im laufenden Flow

**Datei:** Fehlt komplett

**Problem:** Ein Gast hat im Datum-Node versehentlich "Montag" eingegeben, meint aber Dienstag. Es gibt keine Möglichkeit zurückzugehen oder einen Wert zu korrigieren. Der einzige Weg: Flow komplett abbrechen (aber Abbruch fehlt auch, siehe TODO #2) und von vorne starten.

**Fix:** Keyword "ändern" oder "korrigieren" → zeigt die bisher gesammelten Variablen an mit Option, einzelne zu korrigieren. Oder Keyword "nochmal" → löscht die letzte Variable und wiederholt die letzte Frage.

---

#### 14. Slot-Injection überschreibt Flow-Text hart — kein Fallback bei Kalender-Fehler

**Datei:** `app/api/webhooks/instagram/route.ts` (Zeile ~1657)

```typescript
flowResponse = {
  ...flowResponse,
  text: `⏰ Für ${formattedDate} sind folgende Zeiten frei:\n\n...`,
  quickReplies: slotReplies,
};
```

**Problem:** Wenn der Betreiber keinen Google Calendar verbunden hat und `getAvailableSlotsForDate()` keinen Fehler wirft aber leere Slots zurückgibt → wird der Original-Flow-Text durch eine generische Warnung ersetzt: *"Für dieses Datum sind momentan keine freien Zeiten im Kalender verfügbar."* Das ist verwirrend wenn der Betreiber gar keinen Kalender hat — der Gast denkt alles ist ausgebucht.

**Fix:** Prüfen ob der Account überhaupt einen Google Calendar verbunden hat. Wenn nicht → keine Slot-Injection, Flow-Text unverändert lassen.

---

#### 15. Verarbeitungsfehler im Webhook werden nicht zum Gast kommuniziert

**Datei:** `app/api/webhooks/instagram/route.ts`

**Problem:** Wenn während des Flow-Processings ein unerwarteter Fehler auftritt (z.B. DB-Fehler, Calendar-API-Down), wird der Fehler geloggt aber der Gast bekommt keine Rückmeldung. Aus Gast-Sicht: Bot schweigt auf seine Nachricht.

**Fix:** Im `handleProcessingError` (der nicht-Conflict-Branch) → versuchen eine generische Fehlermeldung an den Gast zu senden: *"Es tut mir leid, es gab einen technischen Fehler. Bitte versuche es in einem Moment erneut."*

---

#### 16. Kein Schutz gegen Aktivierung von mehr als X Flows gleichzeitig

**Datei:** `app/api/flows/[id]/route.ts`

**Problem:** Es gibt keine Begrenzung wie viele Flows gleichzeitig aktiv sein können. Im Free-Tier-Plan sollte z.B. max. 1 aktiver Flow erlaubt sein, im Premium max. 5. Aktuell kann ein Free-Tier-Nutzer unbegrenzt Flows aktivieren. Das hat Konsequenzen für Performance (jede Nachricht lädt alle aktiven Flows und prüft alle Trigger).

**Fix:** Bei Aktivierung (`status: "Aktiv"`) → aktive Flows des Accounts zählen → Plan-Limit prüfen → wenn überschritten: 403 mit klarer Fehlermeldung.

---

#### 17. `NEUE_RESERVIERUNG` Quick Reply startet keinen Flow wenn `messageText` leer ist

**Datei:** `app/api/webhooks/instagram/route.ts` (Zeile ~1457)

**Problem:** Bei `forceNewReservation = true` wird `messageText = "reservieren"` gesetzt. Aber kurz davor: `if (!flowResponse && messageText)` — der messageText ist zu dem Zeitpunkt noch der originale Payload-String (kein echter Text). Wenn das Quick-Reply-Payload `"NEUE_RESERVIERUNG"` ist und `event.message.text` leer war → `messageText = ""` → die `if (!flowResponse && messageText)` Bedingung ist false → der neue Flow startet nicht.

**Fix:** Nach dem `forceNewReservation`-Block sicherstellen dass `messageText` gesetzt ist, bevor in den Flow-Matching-Zweig eingegangen wird. Die Reihenfolge der Bedingungen prüfen.

---

#### 18. Kein Retry-Mechanismus für fehlgeschlagene Instagram-Nachrichten

**Datei:** `lib/meta/messageFailures.ts` / `app/api/webhooks/instagram/route.ts`

**Problem:** `recordMessageFailure()` speichert fehlgeschlagene Nachrichten in der DB (`retryable: true/false`). Aber es gibt keinen Cron-Job oder QStash-Job der diese Failures aufgreift und retried. Die Tabelle füllt sich, aber nichts passiert damit.

**Fix:** Cron-Job der alle X Minuten `retryable = true` Failures prüft, die älter als Y Sekunden sind (um sofortige Doppel-Sends zu vermeiden) und versucht sie zu resenden. Max. 3 Retry-Attempts.

---

### 🟢 P2 — Gut zu haben

---

#### 19. Team-Invite-UI fehlt (DB-Struktur vorhanden)

`account_members` Tabelle + Rollen-System (owner/admin/member/viewer) sind vollständig implementiert. Es fehlt nur die UI zum Einladen von Teammitgliedern und ein Backend-Endpoint der eine Invite-Email verschickt.

---

#### 20. Flow Export/Import UI fehlt (API vorhanden)

`app/api/flows/[id]/export/route.ts` existiert. UI im Flow Builder fehlt. Würde es erlauben Flows zwischen Accounts zu teilen oder als Backup zu exportieren.

---

#### 21. Output-Config nicht editierbar im Builder

`FlowMetadata.output_config` (welche Felder sind Pflichtfelder für die Reservierungserstellung) wird auto-gesetzt und ist im UI nicht konfigurierbar. Ein Fitness-Studio das kein `guestCount` braucht kann das nicht abschalten. Ein Beauty-Salon der statt `date` nur `time` braucht kann das nicht einstellen.

---

#### 22. Supabase SMTP nicht konfiguriert

Auth-Emails (Password-Reset, Email-Bestätigung) gehen über den Standard-Supabase-Sender. Diese landen häufig im Spam. Eigener Resend-Sender sollte in den Supabase-Einstellungen konfiguriert werden.

---

#### 23. `conversations.instagram_sender_id NOT NULL` blockiert Channel-Erweiterung

Für zukünftige WhatsApp/Facebook-Integration muss `instagram_sender_id` nullable sein oder durch `channel_sender_id` ersetzt werden. Aktuell ist der NOT NULL Constraint ein strukturelles Hindernis.

---

#### 24. Token-Auto-Refresh Status unklar

`app/api/cron/refresh-tokens/route.ts` (QStash Cron) existiert. Unklar ob er in Produktion aktiv läuft und ob er korrekt mit dem Token-Encryption-System zusammenarbeitet. Benötigt Monitoring-Check.

---

## Frontend

> Die Frontend-TODOs sind weniger kritisch für den Launch, aber wichtig für die User Experience des Betreibers.

---

#### F1. 🔴 Cross-Flow Trigger-Konflikt Warnung im Builder

Wenn ein Betreiber einen Trigger-Keyword eingibt der bereits in einem anderen aktiven Flow verwendet wird → keine Warnung. Der Flow Builder zeigt nur intra-Flow-Lint-Warnungen. Benötigt: API-Call beim Speichern/Aktivieren um Konflikte zu melden.

---

#### F2. 🔴 Flow-Priorität / Reihenfolge sichtbar und steuerbar machen

Die Flow-Liste zeigt keine Information darüber, welcher Flow bei Keyword-Konflikten gewinnt. Ein "Priorität"-Indikator oder eine Drag-to-reorder Funktion würde Betreibern Kontrolle geben.

---

#### F3. 🟡 `collects`-Feld Pflicht für Freitext-Nodes im Builder

Aktuell kann ein Freitext-Node ohne `collects`-Feld gespeichert werden. Im Webhook wird dann kein gezieltes Variable-Matching durchgeführt. Der Builder sollte eine Warnung anzeigen: *"Dieser Schritt sammelt keine Variable — die Antwort des Gastes wird ignoriert"* wenn `inputMode = "free_text"` und `collects` leer ist.

---

#### F4. 🟡 Output-Config Editor im Inspector

Tab im InspectorSlideOver der es erlaubt `output_config.requiredFields` zu konfigurieren: welche Felder sind Pflicht für die Reservierungserstellung dieses Flows. Aktuell auto-gesetzt, nicht editierbar.

---

#### F5. 🟡 Flow Export/Import UI

Button in der Flow-Toolbar: "Exportieren" → Download als JSON. "Importieren" → Upload JSON → neuer Flow. API-Route existiert bereits.

---

#### F6. 🟡 Aktivierungscheck gegen Server-Lint

Wenn der Betreiber den Flow von "Entwurf" auf "Aktiv" setzt, sollte der Client die Server-Response auf Lint-Warnungen prüfen und diese prominent anzeigen (nicht nur im Cockpit).

---

#### F7. 🟢 Multi-Select im Canvas (Pro-Modus)

Mehrere Nodes gleichzeitig markieren → Batch-Delete, Batch-Move. React Flow unterstützt das nativ, fehlt nur die Integration.

---

#### F8. 🟢 Team-Invite UI

Einstellungsseite: Teammitglied per Email einladen, Rolle zuweisen, bestehende Mitglieder verwalten.

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
