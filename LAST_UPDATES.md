# Wesponde - Letzte Updates

**Letzte Session:** 30. Januar 2026
**Status:** Reservierungsflow stabil (Variablen, Summary, Speicherung), Webhook-Logging verbessert

---

## Was wurde gemacht (30. Januar 2026)

### 1. Variable-System + Zusammenfassung (Erledigt)
- User-Eingaben werden in `conversations.metadata.variables` gespeichert.
- Platzhalter `{{date}}`, `{{time}}`, `{{guestCount}}`, `{{name}}`, `{{phone}}`, `{{email}}`, `{{specialRequests}}` werden beim Senden ersetzt.
- Summary-Node bekommt automatisch echte Daten, auch wenn im Template keine Platzhalter stehen.
- Restaurant-Template Summary wurde auf Platzhalter umgestellt.

### 2. Reservierungen in DB (Erledigt)
- Reservierung wird jetzt bei Bestätigung (`confirmed`) erstellt, nicht nur am Flow-Ende.
- `reservationId` wird in Conversation-Metadata gespeichert.
- Fehlende Felder werden geloggt, falls Daten unvollständig sind.

### 3. Webhook/Flow Stabilisierung (Erledigt)
- Conversation speichert den *aktuellen* Node (nicht den nächsten).
- Free-Text-Weiterführung funktioniert zuverlässig.
- Zusätzliche Logs für Debugging (z.B. `expectsFreeText`, `storedNodeId`).

### 4. FlowBuilder Test Mode (Erledigt)
- Chat-Simulation im FlowBuilder vorhanden (`FlowSimulator`).

---

## Status der offenen Punkte aus der letzten Session

- Priorität 1: User-Daten in Zusammenfassung anzeigen -> **Erledigt**
- Priorität 2: Reservierungen in DB speichern -> **Erledigt**
- Priorität 3: Flow im FlowBuilder testen -> **Erledigt**

---

## Was funktioniert jetzt

1. Instagram DM startet Flow (Trigger)
2. Quick Replies + Freitext laufen stabil durch
3. Variablen werden korrekt überschrieben (z.B. Name, Datum, Uhrzeit)
4. Zusammenfassung zeigt echte Daten
5. Bestätigung erzeugt Reservierung in `reservations`

---

## Gelöste Probleme dieser Session

### Problem 1: Zusammenfassung zeigt keine echten Daten
**Lösung:** Variable-Substitution + Summary-Fallback in `flowExecutor.ts`, Template-Update

### Problem 2: Reservierungen wurden nicht gespeichert
**Lösung:** Reservierung wird bei `confirmed` erzeugt, Logging ergänzt

### Problem 3: Freitext-Flow blieb hängen (Datum/Time etc.)
**Lösung:** Aktueller Node wird gespeichert, Free-Text-Weiterführung zuverlässig

---

## Was noch offen ist / Nächste Schritte

### Priorität 1: Dashboard/Ansicht für Reservierungen
- UI-Seite im App-Bereich, Filtern, Status ändern

### Priorität 2: Logs von leeren Webhook-Events reduzieren
- "seen/typing" Events filtern, um Log-Noise zu verringern

### Nice-to-have
- WhatsApp Integration
- Benachrichtigungen bei neuen Reservierungen
- Kalender-Integration

---

## Webhook Info

- **Webhook URL:** `https://wesponde.com/api/webhooks/instagram`
- **Verify Token:** In `.env.local` als `META_WEBHOOK_VERIFY_TOKEN`

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `app/api/webhooks/instagram/route.ts` | Webhook-Endpoint + Flow-Logik |
| `lib/webhook/flowExecutor.ts` | Flow-Ausführung + Summary-Fallback |
| `lib/webhook/variableExtractor.ts` | Variablen erkennen (Name, Datum, Uhrzeit, etc.) |
| `lib/webhook/variableSubstitutor.ts` | Platzhalter ersetzen |
| `lib/webhook/reservationCreator.ts` | Reservierung erstellen |
| `lib/flowTemplates.ts` | Templates (Summary-Platzhalter) |
| `components/app/FlowBuilderClient.tsx` | Flow-Editor UI |
| `components/app/FlowSimulator.tsx` | Testmodus im FlowBuilder |

---

## Zum Testen

1. Neuen Flow anlegen und auf "Aktiv" setzen
2. Instagram DM senden (z.B. "Hallo" oder "reservieren")
3. Flow bis Summary und Bestätigung durchspielen
4. In Supabase prüfen:
   - `conversations.metadata.variables`
   - `reservations` (neuer Eintrag)

---

## Aktueller Stand des Flows

**Letzter erfolgreicher Test:** 30. Januar 2026
**Flow-Name:** "kevin 1.0"
**Ergebnis:** Summary zeigte Daten, Reservierung wurde erstellt

---

## Commits dieser Session

```
504efbba Fix webhook state tracking for free-text flows
2a5e2a70 Show reservation summary data and create booking on confirm
```
