# Debug: Instagram OAuth & Webhook Setup

**Datum:** 15.-16. Februar 2026
**Letztes Update:** 16. Februar 2026, ~17:00 UTC
**Status:** 🔧 FIX DEPLOYED - OAuth auf FLB (config_id) umgestellt, Nutzer muss Instagram neu verbinden

---

## Aktuelle Situation (Stand 16. Feb 15:50 UTC)

### Was funktioniert
- ✅ OAuth-Flow komplett (Token, Page-Erkennung, Integration gespeichert)
- ✅ Webhook-Endpoint erreichbar und verifiziert (GET 200)
- ✅ App-Level Webhook-Subscription aktiv (instagram object, messages field)
- ✅ Page-Level Subscription aktiv (messages, messaging_postbacks)
- ✅ Token valid (debug_token: `is_valid: true`, `expires_at: 0`)
- ✅ Instagram Business Account korrekt mit Page verlinkt
- ✅ Messaging API erreichbar (beide Tokens koennen /me/messages aufrufen)
- ✅ `instagram_manage_messages` hat **erweiterten Zugriff** (Advanced Access)
- ✅ Webhook fuer vastfolio-Account funktioniert (Flow matched, Response sent)

### Was NICHT funktioniert
- ❌ Meta liefert **KEINE Webhook-Events** fuer aboobot3 (instagram_id: `17841469606012222`)
- ❌ Echte DMs an @aboobot3 erzeugen keinen POST an unseren Webhook
- ❌ Weder in Vercel-Logs noch in Supabase-Logs tauchen Events auf

### Betroffene Accounts

| Account | Instagram ID | Page ID | Facebook User | App-Rolle | Webhook |
|---------|-------------|---------|---------------|-----------|---------|
| **vastfolio** (funktioniert) | `17841459469197397` | `112865808474256` | `437118299386770` | **Administrator** | ✅ Events kommen an |
| **aboobot3** (kaputt) | `17841469606012222` | `1004769802718735` | `122205237428551455` | **Keine Rolle** | ❌ Keine Events |
| (dritter Account) | `17841480179552071` | `1039376219248446` | `8af7fd07-...` | unbekannt | nicht getestet |

---

## Komplette Diagnose-Ergebnisse

### 1. Token-Validitaet (via debug_token mit App-Token)

**aboobot3 Token:**
```json
{
  "type": "PAGE",
  "is_valid": true,
  "expires_at": 0,
  "profile_id": "1004769802718735",
  "scopes": ["pages_show_list", "pages_messaging", "instagram_basic",
             "instagram_manage_messages", "pages_read_engagement",
             "pages_manage_metadata", "public_profile"],
  "user_id": "122205237428551455"
}
```

**vastfolio Token (zum Vergleich):**
```json
{
  "type": "PAGE",
  "is_valid": true,
  "expires_at": 0,
  "profile_id": "112865808474256",
  "scopes": ["pages_show_list", "business_management", "pages_messaging",
             "instagram_basic", "instagram_manage_messages", "pages_read_engagement",
             "pages_manage_metadata", "public_profile"],
  "user_id": "437118299386770"
}
```

**Unterschiede:**
- vastfolio hat `business_management` scope → aboobot3 nicht
- vastfolio `pages_messaging` hat KEINE target_ids (global) → aboobot3 hat spezifische target_ids
- vastfolio-User ist App-Administrator → aboobot3-User hat keine Rolle

### 2. App-Level Webhook Subscription (bestaetigt via API)
```
Object: instagram
Callback URL: https://wesponde.com/api/webhooks/instagram
Active: true
Fields: messages (v21.0), messaging_postbacks (v21.0), messaging_seen (v21.0),
        messaging_referral (v21.0), message_reactions (v21.0),
        messaging_handover (v21.0), messaging_optins (v21.0),
        comments (v20.0), live_comments (v20.0), standby (v20.0),
        message_edit (v24.0), story_insights (v24.0)
```

Webhook wurde um 15:40 UTC neu abonniert (`success: true`, Verifikation 200 OK).

### 3. Page-Level Subscriptions (via GET /{page_id}/subscribed_apps)

**aboobot3 Page (1004769802718735):**
```json
{"data":[{"id":"2003432446768451","name":"TableDm","subscribed_fields":["messages","messaging_postbacks"]}]}
```

**vastfolio Page (112865808474256) - WICHTIG:**
```json
{"data":[{"id":"2003432446768451","name":"TableDm","subscribed_fields":["name"]}]}
```

**Erkenntnis:** Der funktionierende Account hat nur `["name"]` als subscribed_fields, NICHT `messages`! Das bedeutet: **Page-Level subscribed_apps ist NICHT relevant fuer Instagram DM Webhooks.** Die Instagram-Webhook-Delivery basiert rein auf der App-Level Subscription + User-Autorisierung.

### 4. Page/Instagram-Verknuepfung (via GET /me mit Page-Token)

**aboobot3:**
```json
{
  "id": "1004769802718735",
  "name": "Wespondtestaboo",
  "category": "Restaurant",
  "connected_instagram_account": {"id": "17841469606012222"},
  "instagram_business_account": {"id": "17841469606012222", "username": "aboobot3"}
}
```

**vastfolio:**
```json
{
  "id": "112865808474256",
  "name": "Vastfolio",
  "category": "Product/service",
  "connected_instagram_account": {"id": "17841459469197397"},
  "instagram_business_account": {"id": "17841459469197397", "username": "vastfolio"}
}
```

Beide korrekt verlinkt.

### 5. App-Rollen (via GET /{app_id}/roles)
```json
{
  "data": [
    {"user": "437118299386770", "role": "administrators"},
    {"user": "122100051105249944", "role": "testers"}
  ]
}
```

**User `122205237428551455` (Abo Bot / aboobot3) hat KEINE Rolle in der App.**

### 6. Messaging API Test

Beide Tokens koennen die Messaging API aufrufen (gleicher Error `#100: You cannot send messages to this id` bei Fake-Recipient → Auth funktioniert, nur Recipient ist ungueltig).

---

## Moegliche Ursachen (noch zu pruefen)

### Hypothese 1: App-Rolle fehlt (WAHRSCHEINLICHSTE)
Obwohl `instagram_manage_messages` auf Advanced Access steht, benoetigt Meta moeglicherweise eine **App-Rolle** fuer den Instagram-Account-Owner, damit Webhooks geliefert werden. Der funktionierende Account gehoert dem App-Admin.

**Test:** User `122205237428551455` als Tester hinzufuegen → Einladung annehmen → Instagram neu verbinden → DM testen.

### Hypothese 2: Instagram "Allow Access to Messages" nicht aktiviert
In der Instagram-App unter Einstellungen > Datenschutz > Nachrichten gibt es "Verbundene Tools" / "Allow Access to Messages". Diese Einstellung muss fuer die App aktiviert sein. Bei scope-basiertem OAuth (ohne config_id) wird dieser Schritt moeglicherweise uebersprungen.

**Test:** In der Instagram-App pruefen ob TableDm unter verbundenen Tools erscheint und Messaging aktiviert ist.

### Hypothese 3: Instagram Account-Status
Der aboobot3-Account hat 1 Follower, 0 Posts, und ist relativ neu. Meta koennte Webhooks fuer inaktive/neue Accounts verzoegern oder blockieren.

**Test:** Ein Post auf dem Account veroeffentlichen, etwas warten, erneut testen.

### Hypothese 4: Meta-Propagation-Delay
Die Webhook-Re-Subscription um 15:40 UTC braucht moeglicherweise Zeit zum Propagieren. Meta-Doku sagt bis zu 15 Minuten.

**Test:** Einfach spaeter nochmal testen (bereits getestet nach ~5min → kein Ergebnis).

---

## Was wurde heute geaendert (16. Feb 2026)

### Code-Aenderungen (Commit `7f5cd144`)

| Aenderung | Datei | Zeile |
|-----------|-------|-------|
| Read Receipts frueh filtern (kein message + kein postback → skip) | `webhooks/instagram/route.ts` | 312-316 |
| `instagram_business_manage_messages` zum OAuth-Scope | `lib/meta/types.ts` | 8 |
| DB-Index auf `integrations.instagram_id` | Migration + `schema.sql` | 345 |
| Page-Subscription-Logging verbessert (pageSource, tokenPrefix, Verify-Readback) | `oauth/callback/route.ts` | 768-840 |

### Manuelle Aenderungen
- Instagram Webhook per API re-subscribed um 15:40 UTC (verify_token = META_APP_SECRET)
- Webhook-Verifikation bestätigt: GET 200 OK

### OAuth-Log (aboobot3 Neu-Verbindung 15:12 UTC)
```
15:12:51 - OAuth start (scope inkl. instagram_business_manage_messages)
15:12:55 - Short-lived + Long-lived Token erhalten
15:12:56 - Permissions: instagram_manage_messages GRANTED, instagram_business_manage_messages NICHT GRANTED
15:12:57 - debug_token: target_ids korrekt, is_valid: true
15:12:57 - /me/accounts: {"data":[]} (LEER - normal fuer diesen App-Typ)
15:12:58 - Approach 4: Page via debug_token target_ids gefunden
15:13:00 - Integration gespeichert
15:13:01 - Page subscribed (success: true, Readback bestaetigt)
15:13:02 - OAuth abgeschlossen
```

**Wichtig:** `instagram_business_manage_messages` wurde angefragt aber NICHT von Meta gewaehrt. Nur `instagram_manage_messages` ist in den Scopes. Dies koennte relevant sein, muss aber nicht, da der funktionierende Account diesen Scope ebenfalls nicht hat.

---

## Bereits ausgeschlossene Ursachen

| Hypothese | Ergebnis | Beweis |
|-----------|----------|--------|
| Token ungueltig | ❌ Ausgeschlossen | debug_token: is_valid=true, API-Calls funktionieren |
| App-Level Subscription fehlt | ❌ Ausgeschlossen | GET /{app_id}/subscriptions zeigt active=true |
| Page nicht mit Instagram verlinkt | ❌ Ausgeschlossen | /me returns connected_instagram_account + instagram_business_account |
| Webhook-Endpoint nicht erreichbar | ❌ Ausgeschlossen | Verifikation 200 OK, andere Accounts funktionieren |
| Signatur-Verifikation schlaegt fehl | ❌ Ausgeschlossen | Beide Secrets werden geprueft, vastfolio-Events kommen durch |
| Token-Encoding-Problem | ❌ Ausgeschlossen | Token funktioniert mit --data-urlencode in curl |
| Flow nicht aktiv | ❌ Ausgeschlossen | Flow "Neuer Flow" status="Aktiv" fuer account_id fb61be9e-... |
| Page-Level Subscription fehlt | ❌ Irrelevant | Funktionierender Account hat subscribed_fields: ["name"], nicht "messages" |

---

## Angewandter Fix (16. Feb ~17:00 UTC)

### Root Cause
Die scope-basierte OAuth (`dialog/oauth` mit `scope=instagram_manage_messages,...`) zeigt NICHT den
Instagram-spezifischen Consent-Schritt ("Zugriff auf Nachrichten erlauben"). Dadurch wird die App
nicht auf Instagram-Ebene registriert → sie erscheint nicht in Instagram > Einstellungen > Apps und
Websites → Meta liefert keine DM-Webhooks.

### Fix: Umstellung auf Facebook Login for Business (FLB)
- `app/api/meta/oauth/start/route.ts` verwendet jetzt `config_id` statt `scope`
- FLB zeigt den vollstaendigen Consent-Dialog mit Instagram-Permissions-Schritt
- Dieser Schritt registriert die App auf Instagram-Ebene
- `/me/accounts` gibt bei FLB-Tokens oft leer zurueck → wird durch Approach 4
  (debug_token target_ids) im Callback abgefangen
- `META_LOGIN_CONFIG_ID=4272932059615532` muss als Env-Var auf Vercel gesetzt sein

### Naechste Schritte nach Deploy

1. **WICHTIG: `META_LOGIN_CONFIG_ID` auf Vercel pruefen**
   - Vercel Dashboard > website > Settings > Environment Variables
   - `META_LOGIN_CONFIG_ID` = `4272932059615532` muss gesetzt sein
   - Falls nicht gesetzt: hinzufuegen und redeployen

2. **FLB-Konfiguration im Meta Developer Portal pruefen**
   - Meta Developer Portal > Facebook Login for Business > Configurations
   - Config `4272932059615532` muss folgende Permissions enthalten:
     - `instagram_basic`
     - `instagram_manage_messages`
     - `pages_show_list`
     - `pages_read_engagement`
     - `pages_manage_metadata`
     - `pages_messaging`
   - Redirect URI muss `https://wesponde.com/api/meta/oauth/callback` enthalten

3. **Nutzer muss Instagram neu verbinden**
   - In Wesponde: Integration trennen
   - Neu verbinden → FLB-Dialog sollte Instagram-Permission-Step zeigen
   - Nach Verbindung: Instagram > Einstellungen > Apps und Websites pruefen
   - App "TableDm" sollte jetzt dort erscheinen

4. **DM testen**
   - DM an @aboobot3 senden mit Trigger-Keyword
   - Vercel-Logs und Supabase-Logs pruefen
   - Webhook-Events sollten jetzt ankommen

### Falls FLB immer noch nicht hilft
- App-Rolle als Tester hinzufuegen (temporaerer Workaround)
- Meta Support kontaktieren mit allen Diagnose-Daten

---

## Relevante API-Calls zum Debuggen

```bash
# App-Level Webhook Subscriptions pruefen
curl -s 'https://graph.facebook.com/v21.0/2003432446768451/subscriptions?access_token=2003432446768451|<APP_SECRET>' | python3 -m json.tool

# App-Rollen pruefen
curl -s 'https://graph.facebook.com/v21.0/2003432446768451/roles?access_token=2003432446768451|<APP_SECRET>' | python3 -m json.tool

# Token debuggen (TOKEN = gespeichertes access_token aus integrations-Tabelle)
curl -s -G 'https://graph.facebook.com/v21.0/debug_token' \
  --data-urlencode 'input_token=<TOKEN>' \
  --data-urlencode 'access_token=2003432446768451|<APP_SECRET>' | python3 -m json.tool

# Page Subscriptions pruefen (TOKEN = Page Access Token)
curl -s -G 'https://graph.facebook.com/v21.0/<PAGE_ID>/subscribed_apps' \
  --data-urlencode 'access_token=<TOKEN>' | python3 -m json.tool

# Instagram Account Details
curl -s -G 'https://graph.facebook.com/v21.0/<INSTAGRAM_ID>' \
  --data-urlencode 'fields=id,username,name,biography,followers_count' \
  --data-urlencode 'access_token=<TOKEN>' | python3 -m json.tool

# Page + Instagram Verknuepfung pruefen
curl -s -G 'https://graph.facebook.com/v21.0/me' \
  --data-urlencode 'fields=id,name,category,connected_instagram_account,instagram_business_account{id,username}' \
  --data-urlencode 'access_token=<TOKEN>' | python3 -m json.tool

# Webhook manuell re-subscriben
curl -s -X POST 'https://graph.facebook.com/v21.0/2003432446768451/subscriptions?access_token=2003432446768451|<APP_SECRET>' \
  -F 'object=instagram' \
  -F 'callback_url=https://wesponde.com/api/webhooks/instagram' \
  -F 'verify_token=<APP_SECRET>' \
  -F 'fields=messages,messaging_postbacks,messaging_seen,messaging_referral,message_reactions,messaging_handover,messaging_optins'

# Letzte Webhook-Logs in Supabase
SELECT level, message, metadata, created_at FROM logs WHERE source='webhook' ORDER BY created_at DESC LIMIT 20;

# Letzte OAuth-Logs
SELECT level, message, metadata, created_at FROM logs WHERE source='oauth' ORDER BY created_at DESC LIMIT 20;

# Alle Integrationen
SELECT id, instagram_id, instagram_username, page_id, account_id, status, updated_at
FROM integrations WHERE provider='meta' ORDER BY updated_at DESC;
```

---

## Architektur-Ueberblick

```
Instagram DM gesendet
        ↓
Meta prueft: Hat der Instagram-Account ein autorisiertes App?
        ↓ (HIER BLOCKIERT ES FUER aboobot3)
Meta sendet POST an https://wesponde.com/api/webhooks/instagram
        ↓
Vercel empfaengt Request
        ↓
verifyWebhookSignature() prueft X-Hub-Signature-256
        ↓
Parse Payload (entry.messaging[] oder entry.changes[])
        ↓
processMessagingEvent(): Integration lookup via instagram_id
        ↓
findOrCreateContact() + Get/Create Conversation
        ↓
findMatchingFlow() gegen aktive Flows (status="Aktiv")
        ↓
executeFlowNode() → Response generieren
        ↓
sendInstagramMessage() via POST /me/messages
```

---

## Bekannte technische Schulden

- `integrations` Unique Index ist `(user_id, provider)` → sollte `(account_id, provider)` werden
- `conversations.instagram_sender_id` ist NOT NULL → blockiert channel-agnostische Conversations
- Messages RLS ist noch user-basiert (kein Team-Zugriff)
- `app/api/meta/diagnose/route.ts` kann spaeter entfernt werden
- `instagram_business_manage_messages` wird angefragt aber nicht gewaehrt → unklar ob relevant
- `META_WEBHOOK_VERIFY_TOKEN` existiert nicht als Env-Var → Code faellt auf META_APP_SECRET zurueck

---

## Meta App Details

- **App-ID:** 2003432446768451
- **App-Name:** TableDm
- **Business:** vastfolio (verifiziert)
- **App-Modus:** Live
- **App-Typ:** Business (erzwingt FLB-Verhalten bei /me/accounts)
- **Instagram-App-ID:** 8525769127482181
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
| `lib/meta/instagramApi.ts` | Send-API (POST /me/messages) |
| `lib/webhook/flowMatcher.ts` | Flow-Trigger-Matching (by account_id, status="Aktiv") |
| `lib/webhook/flowExecutor.ts` | Flow-Node-Ausfuehrung |
| `app/api/meta/diagnose/route.ts` | Diagnose-Endpoint (braucht Auth) |
