# Wesponde - Letzte Updates

**Letzte Session:** 29. Januar 2026
**Status:** Instagram Webhook funktioniert, Templates überarbeitet

---

## Was wurde gemacht

### 1. Instagram Webhook Infrastruktur (Komplett)
- `app/api/webhooks/instagram/route.ts` - Empfängt Instagram DMs
- `lib/meta/webhookVerify.ts` - HMAC-SHA256 Signatur-Verifizierung
- `lib/meta/instagramApi.ts` - Nachrichten an Instagram senden
- `lib/webhook/flowMatcher.ts` - Trigger-Keyword-Matching
- `lib/webhook/flowExecutor.ts` - Flow-Nodes ausführen

**Webhook URL:** `https://wesponde.com/api/webhooks/instagram`
**Verify Token:** In `.env.local` als `META_WEBHOOK_VERIFY_TOKEN`

### 2. Datenbank-Tabellen (In Supabase angelegt)
- `conversations` - Gespräche mit Instagram-Usern
- `messages` - Eingehende/ausgehende Nachrichten

### 3. Flow Templates komplett überarbeitet
Alle drei Templates sind jetzt vollständig mit Quick Replies:

| Template | Nodes | Features |
|----------|-------|----------|
| Restaurant | ~15 | Datum (Freitext), Uhrzeit, Gäste, Name, Telefon, Sonderwünsche |
| Salon | ~22 | Behandlung, Stylist, Datum, Uhrzeit, Kontakt, Notizen |
| Praxis | ~23 | Anliegen, Rezept, Notfall, Termin, Versicherung, Kontakt |

### 4. Bug Fixes
- **Freitext-Eingabe:** Flows bleiben nicht mehr hängen wenn User Text tippt (Name, Telefon, etc.)
- **Edge Labels:** Labels werden jetzt korrekt gespeichert
- **FlowBuilder UX:** Bessere Warnungen mit Aktions-Badges

---

## Was funktioniert jetzt

1. User schreibt Instagram DM an verbundenes Konto
2. Webhook empfängt Nachricht
3. Flow-Trigger wird gematcht (z.B. "hallo" startet Welcome-Node)
4. Bot antwortet mit Text + Quick Reply Buttons
5. User klickt Button oder tippt Freitext
6. Flow geht weiter bis zum Ende

---

## Was noch offen ist / Nächste Schritte

### Priorität 1: User-Daten in Zusammenfassung anzeigen
**Problem:** Die Zusammenfassung zeigt nicht die eingegebenen Daten (Name, Datum, etc.)
**Lösung:** Variable-System implementieren:
- User-Eingaben in `conversations.metadata` speichern
- Nodes unterstützen `{{name}}`, `{{date}}` Platzhalter
- Beim Senden werden Variablen ersetzt

### Priorität 2: Reservierungen in DB speichern
- Neue Tabelle `reservations` anlegen
- Nach Bestätigung alle Daten in DB schreiben
- Dashboard-Ansicht für Reservierungen

### Priorität 3: Flow im FlowBuilder testen
- "Vorschau" oder "Test" Modus im FlowBuilder
- Ohne echte Instagram-Verbindung durchspielen

### Nice-to-have
- WhatsApp Integration (ähnlich wie Instagram)
- Benachrichtigungen bei neuen Reservierungen
- Kalender-Integration

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `lib/flowTemplates.ts` | Flow-Templates (Restaurant, Salon, Praxis) |
| `lib/webhook/flowExecutor.ts` | Flow-Logik, Freitext-Handling |
| `app/api/webhooks/instagram/route.ts` | Webhook-Endpoint |
| `components/app/FlowBuilderClient.tsx` | Flow-Editor UI |
| `lib/flowLint.ts` | Flow-Validierung/Warnungen |

---

## Zum Testen

1. **Neuen Flow erstellen:** Supabase Templates löschen damit Fallback greift:
   ```sql
   DELETE FROM flow_templates;
   ```

2. **Flow aktivieren:** Status auf "Aktiv" setzen (nicht "Entwurf")

3. **Instagram DM senden:** "Hallo" oder "reservieren" an verbundenes Konto

4. **Logs prüfen:** In Supabase → `logs` Tabelle

---

## Commits dieser Session

```
422b0a05 Improve restaurant template: exact date input and realistic summary
64b15c2a Fix: Handle free text input in conversation flow
4ef58b57 Overhaul flow templates: full production-ready flows
```
