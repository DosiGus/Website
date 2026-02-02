# Wesponde - Letzte Updates

**Letzte Session:** 1. Februar 2026
**Status:** Reservierungsflow komplett überarbeitet - Telefon & Sonderwünsche werden jetzt korrekt gespeichert

---

## Was wurde gemacht (1. Februar 2026)

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

### In Arbeit 🔄

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Reservierungs-Benachrichtigungen | 🔄 | Email/Push bei neuer Reservierung |

### Geplant 📋

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| WhatsApp Integration | 📋 | Zusätzlicher Kanal |
| Kalender-Integration | 📋 | Google Calendar, iCal |
| Multi-Language | 📋 | Englisch, weitere Sprachen |
| Analytics Dashboard | 📋 | Statistiken zu Flows/Reservierungen |

---

## Commits dieser Session (1. Februar 2026)

```
7349472f Fix: existingMetadata wird korrekt aktualisiert bei neuem Flow
a7466e16 Fix: Reservierung wird jetzt korrekt erstellt
157bf611 Fix: Reservierung wird nicht mehr zu früh erstellt
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
| `lib/webhook/flowExecutor.ts` | Flow-Ausführung + Summary-Fallback |
| `lib/webhook/variableExtractor.ts` | Variablen erkennen (Name, Datum, Uhrzeit, etc.) |
| `lib/webhook/variableSubstitutor.ts` | Platzhalter ersetzen |
| `lib/webhook/reservationCreator.ts` | Reservierung erstellen |
| `lib/flowTemplates.ts` | Templates (Summary-Platzhalter) |
| `components/app/FlowBuilderClient.tsx` | Flow-Editor UI |
| `components/app/FlowSimulator.tsx` | Testmodus im FlowBuilder |
| `components/app/ReservationsClient.tsx` | Reservierungs-Dashboard |

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

---

## Bekannte Einschränkungen

- **Test-Modus:** Instagram-Permissions erfordern Test-User in Meta Developer Portal
- **60-Tage Token:** Access Token muss alle 60 Tage erneuert werden
- **Webhook-Delay:** Instagram kann 1-2 Sekunden Verzögerung haben

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
