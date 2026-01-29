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

## Gelöste Probleme dieser Session

### Problem 1: Flow bleibt bei Freitext-Eingabe hängen
**Symptom:** User tippt Namen bei "Name erfragen" → Bot antwortet nicht
**Ursache:** Webhook versuchte neuen Flow zu matchen statt im aktuellen weiterzumachen
**Lösung:** `handleFreeTextInput()` in `flowExecutor.ts` hinzugefügt, Webhook prüft jetzt ob User in aktivem Flow ist

### Problem 2: Datum-Abfrage zu ungenau
**Symptom:** Nur "Heute/Morgen/Wochenende" als Quick Replies - unpraktisch für echte Reservierung
**Lösung:** Geändert zu Freitext-Eingabe: "Für welches Datum möchtest du reservieren?"

### Problem 3: Zusammenfassung zeigt Platzhalter
**Symptom:** "[wird eingetragen]" statt echte Daten
**Ursache:** Kein Variable-System vorhanden um User-Eingaben zu speichern/anzeigen
**Workaround:** Text geändert zu "Ich habe alle Angaben für deine Reservierung" ohne falsche Versprechen
**Echte Lösung:** Variable-System implementieren (siehe Priorität 1 unten)

### Problem 4: Leere Webhook-Events
**Beobachtung:** Logs zeigen `"hasMessage": false, "messageText": ""` Events
**Ursache:** Instagram sendet "seen" und "typing" Events die keine Nachricht enthalten
**Status:** Harmlos - werden ignoriert, aber könnten gefiltert werden

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

## Aktueller Stand des Flows

**Getesteter Flow:** Restaurant-Reservierung
**Flow-ID in DB:** `09ea2c2e-8e12-4d43-9a6f-c1120c7e7289`

**Was funktioniert:**
- Trigger "hallo" → Welcome-Node
- Quick Reply Buttons klicken
- Freitext-Eingabe (Name, Telefon, Datum)
- Flow durchlaufen bis Zusammenfassung

**Was noch nicht getestet:**
- Neuer Flow mit aktualisierten Templates (Datum als Freitext)
- Sonderwünsche-Pfad (Allergien, Anlass)
- Bearbeiten-Option in Zusammenfassung

**Hinweis:** Der getestete Flow nutzt noch die ALTEN Templates. Um die neuen zu testen:
```sql
DELETE FROM flow_templates;
```
Dann neuen Flow erstellen.

---

## Commits dieser Session

```
f85c95d3 Add LAST_UPDATES.md for session continuity
422b0a05 Improve restaurant template: exact date input and realistic summary
64b15c2a Fix: Handle free text input in conversation flow
4ef58b57 Overhaul flow templates: full production-ready flows
```
