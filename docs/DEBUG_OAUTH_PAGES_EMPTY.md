# Debug: Instagram OAuth & Webhook Setup

**Datum:** 15.-16. Februar 2026
**Letztes Update:** 16. Februar 2026, ~16:30 UTC
**Status:** ✅ GELOEST - Webhooks funktionieren fuer alle Accounts (aboobot3 + vastfolio)

---

## Loesung (16. Feb 2026)

### Problem
Nutzer konnten sich mit Instagram verbinden (OAuth erfolgreich), aber der Bot antwortete nicht auf DMs. Webhooks wurden von Meta nicht an unseren Endpoint geliefert fuer Non-Admin-Accounts.

### Root Cause
Zwei zusammenhaengende Probleme:

1. **OAuth-Methode:** Die scope-basierte OAuth (`dialog/oauth` mit `scope=...`) registrierte die App nicht korrekt auf Instagram-Ebene. Umstellung auf **Facebook Login for Business (FLB)** mit `config_id` loeste dies.

2. **Page-Subscription Timing:** Die Page-Level Webhook-Subscription (`/{page_id}/subscribed_apps`) muss bei jeder Neu-Verbindung aktiv sein, BEVOR DMs gesendet werden. Webhooks sind nicht rueckwirkend - nur neue DMs nach aktiver Subscription werden geliefert.

### Angewandte Fixes

| Fix | Datei | Commit |
|-----|-------|--------|
| Read Receipts frueh filtern (kein message + kein postback → skip) | `webhooks/instagram/route.ts` | `7f5cd144` |
| `instagram_business_manage_messages` zum OAuth-Scope | `lib/meta/types.ts` | `7f5cd144` |
| DB-Index auf `integrations.instagram_id` | Migration + `schema.sql` | `7f5cd144` |
| Page-Subscription-Logging verbessert (pageSource, Verify-Readback) | `oauth/callback/route.ts` | `7f5cd144` |
| OAuth auf FLB mit `config_id` umgestellt | `oauth/start/route.ts` | `79857bb9` |

### Beweis dass es funktioniert (16. Feb 16:28-16:30 UTC)

Komplette Flow-Konversation auf aboobot3 (`17841469606012222`):
- 2 verschiedene Sender (IDs: `1443326010783991` und `668807706283950`)
- Flow "Neuer Flow" gematched via Trigger-Keywords
- Variablen extrahiert: Name, Datum, Uhrzeit, Telefon, Sonderwuensche
- Alle Nodes durchlaufen: welcome → ask-name → ask-phone → ask-notes → summary → confirmed
- Alle Antworten erfolgreich gesendet via Instagram Send API

---

## Technische Details

### OAuth-Flow (aktuell)

```
User klickt "Connect Instagram"
        ↓
POST /api/meta/oauth/start
        ↓
Redirect zu Facebook Login Dialog
  → MIT config_id (FLB) wenn META_LOGIN_CONFIG_ID gesetzt
  → OHNE config_id (scope-basiert) als Fallback
        ↓
User autorisiert Permissions (inkl. Instagram-Schritt bei FLB)
        ↓
GET /api/meta/oauth/callback?code=xxx
        ↓
Token-Exchange: short-lived → long-lived (60 Tage)
        ↓
Page finden (4 Approaches):
  1. /me/accounts (standard)
  2. User IS Page (FLB/NPE)
  3. Embedded accounts
  4. debug_token target_ids ← WIRD MEISTENS GENUTZT bei FLB
        ↓
Instagram Business Account von Page holen
        ↓
Integration in DB speichern
        ↓
Page-Subscription: POST /{page_id}/subscribed_apps
  → fields: ["messages", "messaging_postbacks"]
        ↓
Redirect zu /app/integrations?success=true
```

### Webhook-Pipeline (aktuell)

```
Instagram DM empfangen
        ↓
Meta sendet POST an https://wesponde.com/api/webhooks/instagram
        ↓
verifyWebhookSignature() mit META_APP_SECRET + META_INSTAGRAM_APP_SECRET
        ↓
Filter: sender === self → skip (Echo)
Filter: !message && !postback → skip (Read/Delivery Receipts)
        ↓
Integration lookup via instagram_id
        ↓
findOrCreateContact() + Get/Create Conversation
        ↓
findMatchingFlow() (account_id, status="Aktiv", Trigger-Keywords)
        ↓
executeFlowNode() → Response + Quick Replies
        ↓
sendInstagramMessage() via POST /me/messages
```

### Betroffene Accounts (Stand 16. Feb)

| Account | Instagram ID | Page ID | Facebook User | Status |
|---------|-------------|---------|---------------|--------|
| **vastfolio** | `17841459469197397` | `112865808474256` | `437118299386770` (Admin) | ✅ Funktioniert |
| **aboobot3** | `17841469606012222` | `1004769802718735` | `122205237428551455` | ✅ Funktioniert |
| (dritter) | `17841480179552071` | `1039376219248446` | unbekannt | Nicht getestet |

---

## Diagnose-Erkenntnisse (fuer zukuenftige Debugging-Sessions)

### Was NICHT die Ursache war

| Hypothese | Ergebnis | Beweis |
|-----------|----------|--------|
| Token ungueltig | ❌ Ausgeschlossen | debug_token: is_valid=true |
| App-Level Subscription fehlt | ❌ Ausgeschlossen | GET /{app_id}/subscriptions: active=true |
| Page nicht mit Instagram verlinkt | ❌ Ausgeschlossen | /me: connected_instagram_account korrekt |
| Webhook-Endpoint nicht erreichbar | ❌ Ausgeschlossen | GET-Verifikation 200 OK |
| Signatur-Verifikation fehlerhaft | ❌ Ausgeschlossen | Beide Secrets funktionieren |
| Flow nicht aktiv | ❌ Ausgeschlossen | Flow "Neuer Flow" status="Aktiv" |
| App-Rolle noetig fuer Webhooks | ❌ Ausgeschlossen | aboobot3 hat keine Rolle, funktioniert trotzdem |
| Send API blockiert | ❌ Ausgeschlossen | POST /me/messages funktioniert fuer beide Tokens |
| Page-Level Subscription noetig | ⚠️ JA, aber nicht wie gedacht | Page-Sub wird im Callback gesetzt, muss VOR DMs aktiv sein |

### Wichtige Erkenntnisse

1. **`POST /{ig-user-id}/messages` ≠ `POST /me/messages`**: Der Endpunkt `/{ig-user-id}/messages` gibt Error Code 3 ("Application does not have the capability") fuer BEIDE Accounts. Der korrekte Endpunkt ist `POST /me/messages` mit Page Access Token.

2. **Conversations API funktioniert unabhaengig von Webhooks**: `GET /{page_id}/conversations?platform=instagram` zeigt alle DMs, auch wenn Webhooks nicht geliefert werden.

3. **Webhooks sind nicht rueckwirkend**: DMs die VOR einer aktiven Subscription gesendet werden, loesen KEINE Webhook-Events aus. Nur neue DMs nach Subscription-Aktivierung.

4. **FLB vs Scope-basiert**: Bei App-Typ "Business" gibt `/me/accounts` mit FLB-Tokens oft leere Ergebnisse. Approach 4 (debug_token target_ids) handhabt das zuverlaessig.

5. **Echo-Filter wichtig**: Ausgehende API-Nachrichten erzeugen Echo-Webhook-Events. Filter: `senderId === instagramAccountId` → skip.

6. **Read Receipts filtern**: Events ohne `message` und ohne `postback` sind Read/Delivery-Receipts und muessen frueh gefiltert werden.

---

## Nuetzliche SQL-Queries

```sql
-- Webhook-Logs der letzten Stunde
SELECT level, message,
  metadata->>'instagramAccountId' AS ig_account,
  metadata->>'senderId' AS sender_id,
  metadata->>'flowId' AS flow_id,
  metadata->>'nodeId' AS node_id,
  metadata->>'responseText' AS response_text,
  metadata->'variables' AS variables,
  created_at
FROM logs
WHERE source = 'webhook'
  AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 50;

-- OAuth-Logs der letzten Stunde
SELECT level, message,
  metadata->>'configId' AS config_id,
  metadata->>'pageSource' AS page_source,
  metadata->>'instagramUsername' AS ig_username,
  created_at
FROM logs
WHERE source = 'oauth'
  AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 30;

-- Alle aktiven Integrationen
SELECT id, instagram_id, instagram_username, page_id, account_name,
  facebook_user_id, status, updated_at
FROM integrations
WHERE provider = 'meta'
ORDER BY updated_at DESC;

-- Aktive Flows mit Triggern
SELECT f.name, f.status, f.triggers, a.name AS account_name
FROM flows f
JOIN accounts a ON a.id = f.account_id
WHERE f.status = 'Aktiv'
ORDER BY f.updated_at DESC;
```

---

## Nuetzliche API-Calls

```bash
# App-Level Webhook Subscriptions
curl -s 'https://graph.facebook.com/v21.0/2003432446768451/subscriptions?access_token=2003432446768451|<APP_SECRET>' | python3 -m json.tool

# Token debuggen
curl -s -G 'https://graph.facebook.com/v21.0/debug_token' \
  --data-urlencode 'input_token=<TOKEN>' \
  --data-urlencode 'access_token=2003432446768451|<APP_SECRET>' | python3 -m json.tool

# Page Subscriptions pruefen
curl -s -G 'https://graph.facebook.com/v21.0/<PAGE_ID>/subscribed_apps' \
  --data-urlencode 'access_token=<TOKEN>' | python3 -m json.tool

# Conversations lesen (zeigt DMs auch ohne Webhooks)
curl -s -G 'https://graph.facebook.com/v21.0/<PAGE_ID>/conversations' \
  --data-urlencode 'platform=instagram' \
  --data-urlencode 'fields=id,updated_time' \
  --data-urlencode 'access_token=<TOKEN>' | python3 -m json.tool

# Test-Nachricht senden (KORREKTER Endpunkt: /me/messages)
curl -s -X POST "https://graph.facebook.com/v21.0/me/messages?access_token=<TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"recipient":{"id":"<RECIPIENT_IGSID>"},"message":{"text":"Test"}}'

# Webhook manuell re-subscriben
curl -s -X POST 'https://graph.facebook.com/v21.0/2003432446768451/subscriptions?access_token=2003432446768451|<APP_SECRET>' \
  -F 'object=instagram' \
  -F 'callback_url=https://wesponde.com/api/webhooks/instagram' \
  -F 'verify_token=<APP_SECRET>' \
  -F 'fields=messages,messaging_postbacks,messaging_seen,messaging_referral,message_reactions,messaging_handover,messaging_optins'
```

---

## Bekannte technische Schulden

- `integrations` Unique Index ist `(user_id, provider)` → sollte `(account_id, provider)` werden
- `conversations.instagram_sender_id` ist NOT NULL → blockiert channel-agnostische Conversations
- Messages RLS ist noch user-basiert (kein Team-Zugriff)
- `app/api/meta/diagnose/route.ts` kann spaeter entfernt werden
- `instagram_business_manage_messages` wird angefragt aber nicht gewaehrt → nicht relevant
- `META_WEBHOOK_VERIFY_TOKEN` existiert nicht als Env-Var → Code faellt auf META_APP_SECRET zurueck

---

## Meta App Details

- **App-ID:** 2003432446768451
- **App-Name:** TableDm
- **Business:** vastfolio (verifiziert)
- **App-Modus:** Live
- **App-Typ:** Business (erzwingt FLB-Verhalten bei /me/accounts)
- **Instagram-App-ID:** 8525769127482181
- **FLB Config-ID:** 4272932059615532
- **Redirect URI:** https://wesponde.com/api/meta/oauth/callback
- **Webhook-URL:** https://wesponde.com/api/webhooks/instagram
- **Supabase Project ID:** ueemgffajlqyaccwdhfl
- **Vercel Team ID:** team_aAraWFF0hEqval7gWLIBQdIh
- **Vercel Project ID:** prj_IrSkrCYU0rADRWZq1DqZenqthT62

### Relevante Dateien

| Datei | Zweck |
|-------|-------|
| `app/api/meta/oauth/start/route.ts` | OAuth-Start, FLB mit config_id (Fallback: scope-basiert) |
| `app/api/meta/oauth/callback/route.ts` | OAuth-Callback, Approach 4 (debug_token target_ids), Page-Subscription |
| `app/api/webhooks/instagram/route.ts` | Webhook-Endpoint (GET: Verify, POST: Message Processing) |
| `lib/meta/webhookVerify.ts` | Signatur-Verifikation (beide Secrets), Subscription-Verifikation |
| `lib/meta/types.ts` | META_PERMISSIONS Array (inkl. instagram_business_manage_messages) |
| `lib/meta/instagramApi.ts` | Send-API (POST /me/messages mit Page Token) |
| `lib/webhook/flowMatcher.ts` | Flow-Trigger-Matching (by account_id, status="Aktiv") |
| `lib/webhook/flowExecutor.ts` | Flow-Node-Ausfuehrung |
| `app/api/meta/diagnose/route.ts` | Diagnose-Endpoint (braucht Auth, temporaer) |
