# Wesponde - Instagram Webhook Implementation Plan

## Status: In Planung

---

## Architektur-Übersicht

Wesponde funktioniert wie ManyChat: **Ein zentraler Webhook für alle User.**

```
Instagram User sendet DM an @restaurant_xyz
                    ↓
Meta sendet POST an wesponde.com/api/webhooks/instagram
                    ↓
Webhook findet: instagram_id 12345 gehört zu User "Restaurant XYZ"
                    ↓
Lade aktive Flows von User "Restaurant XYZ"
                    ↓
Matche Nachricht gegen Trigger → Flow ausführen
                    ↓
Antwort senden via Instagram API
```

**Für den Endnutzer:** Nur OAuth-Verbindung nötig, KEINE Webhook-Konfiguration!

---

## TODO-Liste

### Phase 1: Datenbank
- [ ] `conversations` Tabelle erstellen
- [ ] `messages` Tabelle erstellen
- [ ] RLS Policies hinzufügen
- [ ] SQL in Supabase ausführen

### Phase 2: Backend-Module
- [ ] `lib/meta/types.ts` - Webhook-Typen hinzufügen
- [ ] `lib/meta/webhookVerify.ts` - Signatur-Verifizierung
- [ ] `lib/meta/instagramApi.ts` - Nachrichten senden
- [ ] `lib/webhook/flowMatcher.ts` - Trigger-Matching
- [ ] `lib/webhook/flowExecutor.ts` - Flow-Ausführung

### Phase 3: Webhook-Endpoint
- [ ] `app/api/webhooks/instagram/route.ts` erstellen
  - [ ] GET: Meta-Verifizierung
  - [ ] POST: Nachrichten verarbeiten

### Phase 4: Konfiguration
- [ ] `META_WEBHOOK_VERIFY_TOKEN` in Vercel Environment Variables
- [ ] Im Meta Developer Portal:
  - [ ] Webhook-URL eintragen: `https://wesponde.com/api/webhooks/instagram`
  - [ ] Verify Token eingeben
  - [ ] `messages` Feld subscriben

### Phase 5: Testen
- [ ] Webhook-Verifizierung testen (curl)
- [ ] Test-Flow erstellen & aktivieren
- [ ] DM an Instagram senden → Antwort prüfen
- [ ] Logs in Supabase prüfen

---

## Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `app/api/webhooks/instagram/route.ts` | Zentraler Webhook-Endpoint |
| `lib/meta/webhookVerify.ts` | HMAC-SHA256 Signatur-Prüfung |
| `lib/meta/instagramApi.ts` | Instagram Graph API Client |
| `lib/webhook/flowMatcher.ts` | Trigger-Matching (EXACT/CONTAINS) |
| `lib/webhook/flowExecutor.ts` | Flow-Node ausführen, Antwort generieren |

---

## Neue Datenbank-Tabellen

### `conversations`
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| user_id | uuid | Wesponde User (FK) |
| integration_id | uuid | Meta-Integration (FK) |
| instagram_sender_id | text | Instagram-scoped User ID |
| current_flow_id | uuid | Aktueller Flow (nullable) |
| current_node_id | text | Aktuelle Position im Flow |
| status | text | 'active', 'closed', 'paused' |
| last_message_at | timestamptz | Letzte Nachricht |

### `messages`
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| conversation_id | uuid | Conversation (FK) |
| direction | text | 'incoming' oder 'outgoing' |
| message_type | text | 'text', 'quick_reply', 'image' |
| content | text | Nachrichtentext |
| quick_reply_payload | text | Quick Reply Payload |
| instagram_message_id | text | Instagram's Message ID (unique) |
| flow_id | uuid | Welcher Flow (nullable) |
| node_id | text | Welcher Node |

---

## Umgebungsvariablen

```env
# Bereits vorhanden:
META_APP_ID=2003432446768451
META_APP_SECRET=<secret>

# NEU hinzufügen:
META_WEBHOOK_VERIFY_TOKEN=<zufälliger-sicherer-string>
```

---

## User-Flow (aus Sicht des Endnutzers)

1. **Registrierung** bei Wesponde
2. **Instagram verbinden** (OAuth - Button klicken, bei Meta anmelden)
3. **Flow erstellen** im Flow Builder
   - Trigger setzen (z.B. "reservierung", "termin")
   - Nodes mit Antworten erstellen
   - Quick Replies hinzufügen
4. **Flow aktivieren** (Status: "Aktiv")
5. **Fertig!** - Kunden können jetzt DMs senden und bekommen automatische Antworten

**Keine technische Konfiguration nötig für den Endnutzer!**

---

## Meta Developer Portal Konfiguration (einmalig)

1. App Dashboard öffnen: https://developers.facebook.com/apps/2003432446768451
2. **Webhooks** → **Instagram** → **Edit Subscription**
3. Callback URL: `https://wesponde.com/api/webhooks/instagram`
4. Verify Token: `<META_WEBHOOK_VERIFY_TOKEN>`
5. Felder subscriben:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
6. **Verify and Save**

---

## Wichtige Hinweise

### Warum EIN zentraler Webhook für alle User?

- Meta erlaubt nur EINE Webhook-URL pro App
- Alle Nachrichten kommen an diesen Endpoint
- Der Endpoint routet anhand der `instagram_id` zum richtigen User
- Das ist Standard bei allen großen Plattformen (ManyChat, Chatfuel, etc.)

### Sicherheit

- Jede Webhook-Anfrage wird mit HMAC-SHA256 verifiziert
- Nur Anfragen von Meta werden akzeptiert
- Duplikate werden anhand der `instagram_message_id` erkannt

### Rate Limits

- Instagram API: ~200 Nachrichten/User/Tag
- Bei Rate Limit → Exponential Backoff
- Fehler werden geloggt

---

## Nächste Schritte nach Webhook-Implementierung

1. **Conversations-UI** - Übersicht aller Gespräche für User
2. **Live-Chat** - Manuelles Eingreifen in Gespräche
3. **Analytics** - Statistiken über Flows & Conversations
4. **Token-Refresh** - Automatische Erneuerung von Access Tokens
