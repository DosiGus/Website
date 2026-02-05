# Wesponde Roadmap

**Stand:** 5. Februar 2026
**Timeline:** Pilot in 2 Wochen, Finales Produkt in 2 Monaten

---

## Geschäftsmodell

- **Zielgruppe:** Restaurants, Salons, Praxen (Service-Betriebe)
- **Wert:** Marketing über Instagram Stories → direkte Reservierung via DM
- **Vergleich:** Wie ManyChat, aber spezialisiert auf Reservierungen

---

## Phase 1: Pilot-Ready (2 Wochen)

**Ziel:** Stabil genug für 5-10 Test-Restaurants

| # | Task | Aufwand | Status |
|---|------|---------|--------|
| 1 | Error Handling im Webhook | 2-3 Tage | ✅ |
| 2 | Dashboard echte Daten | 1 Tag | ✅ |
| 3 | Token Expiry Warning | 1 Tag | ✅ |
| 4 | Input Validation (Reservierungen) | 1 Tag | ✅ |
| 5 | Rate Limiting | 1 Tag | ✅ |
| 6 | Error Responses anonymisieren | 0.5 Tage | ✅ |
| 7 | Conversation History UI | 2-3 Tage | ✅ |

**Total: ~10-12 Arbeitstage** - **PHASE 1 ABGESCHLOSSEN!**

---

## Phase 2: Finales Produkt (6-8 Wochen nach Pilot)

### Priorität 1: Core Features

| # | Feature | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 1 | Email-Benachrichtigungen | 2 Wochen | Emails bei neuer Reservierung, Stornierung, Token-Ablauf |
| 2 | Token Auto-Refresh | 1 Woche | Instagram-Token automatisch vor Ablauf erneuern |
| 3 | Conversation History UI | 1 Woche | Nachrichtenverlauf im Dashboard anzeigen |

### Priorität 2: Business Features

| # | Feature | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 4 | Multi-Tenancy (Teams) | 3 Wochen | DB + API fertig, UI/Invite-Flow offen |
| 5 | Billing/Stripe | 2 Wochen | Subscription-Modell mit Stripe |
| 6 | Kalender-View | 1-2 Wochen | Reservierungen als Kalender statt Tabelle |
| 7 | Manuelles Messaging | 1 Woche | Restaurant kann Kunden direkt anschreiben |

### Priorität 3: Nice-to-Have

| # | Feature | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 8 | WhatsApp Integration | 2 Wochen | DB vorbereitet (channel-agnostik), API-Anbindung offen |
| 9 | Analytics Dashboard | 2 Wochen | Statistiken zu Flows/Reservierungen |
| 10 | Export (CSV/PDF) | 1 Woche | Reservierungen exportieren |
| 11 | Kalender-Integration | 1 Woche | Google Calendar, iCal Sync |

---

## Technische Verbesserungen

### Code-Qualität
- [ ] Error Handling in allen Supabase-Operationen
- [ ] TypeScript `any` Types ersetzen
- [ ] Input Validation mit Zod
- [ ] Rate Limiting auf API-Routes

### Performance
- [ ] Flow-Matching Query optimieren (nur aktive Flows laden)
- [ ] Lazy Loading für Flow-Nodes/Edges
- [ ] Database Indexes prüfen

### Security
- [ ] Generische Error Responses (keine DB-Details)
- [ ] CORS konfigurieren
- [ ] Request Size Limits

---

## Aktueller Feature-Stand

### Erledigt ✅

| Feature | Status |
|---------|--------|
| Instagram OAuth | ✅ |
| Flow Builder (Visual + List) | ✅ |
| Flow Templates | ✅ |
| Flow Simulator | ✅ |
| Webhook-Verarbeitung | ✅ |
| Variable-Extraktion | ✅ |
| Platzhalter-Ersetzung | ✅ |
| Reservierung bei Bestätigung | ✅ |
| Reservierungs-Dashboard | ✅ |
| Logging | ✅ |

### In Arbeit 🔄

| Feature | Status |
|---------|--------|
| Error Handling Verbesserungen | 🔄 |
| Dashboard echte Daten | 🔄 |

### Geplant 📋

| Feature | Status |
|---------|--------|
| Email-Benachrichtigungen | 📋 |
| Token Auto-Refresh | 📋 |
| Multi-Tenancy (DB + API) | ✅ (UI offen) |
| Billing/Stripe | 📋 |
| WhatsApp Integration | 📋 |
| Kalender-View | 📋 |
| Analytics Dashboard | 📋 |

---

## Feature-Erklärungen

### Kalender-View
Reservierungen als Tages/Wochen-Übersicht statt Tabelle:
```
┌─────────────────────────────────────┐
│  Mo 3. Feb 2026                     │
├─────────────────────────────────────┤
│ 18:00 │ Max Müller (4 Gäste)       │
│ 19:00 │ Lisa Schmidt (2 Gäste)     │
│ 19:30 │ [FREI]                     │
│ 20:00 │ Familie Weber (6 Gäste)    │
└─────────────────────────────────────┘
```

### Email-Benachrichtigungen
Automatische Emails:
- Neue Reservierung eingegangen
- Reservierung storniert
- Instagram-Token läuft ab
- Tägliche Zusammenfassung

### Multi-Tenancy
Mehrere Mitarbeiter pro Restaurant:
- Chef = Admin
- Manager = kann Reservierungen bearbeiten
- Kellner = kann nur anzeigen

### Manuelles Messaging
Restaurant kann Kunden direkt anschreiben (außerhalb von Flows), z.B. bei abgebrochenen Reservierungen.

---

## Bekannte Einschränkungen

- **Instagram Test-Mode:** Permissions erfordern Test-User in Meta Developer Portal
- **60-Tage Token:** Access Token muss erneuert werden (aktuell manuell)
- **Multi-Tenant DB fertig:** accounts + account_members + RLS vorhanden, Team-Invite-UI fehlt noch

---

## Legende

- ✅ Erledigt
- 🔄 In Arbeit
- 📋 Geplant
