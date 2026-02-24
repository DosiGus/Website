# Wesponde Roadmap

**Stand:** 16. Februar 2026
**Timeline:** Pilot in 2 Wochen, Finales Produkt in 2 Monaten

---

## Geschaeftsmodell

- **Zielgruppe:** Restaurants, Salons, Praxen (Service-Betriebe)
- **Wert:** Marketing ueber Instagram Stories -> direkte Reservierung via DM
- **Vergleich:** Wie ManyChat, aber spezialisiert auf Reservierungen

---

## Phase 1: Pilot-Ready (ABGESCHLOSSEN)

**Ziel:** Stabil genug fuer 5-10 Test-Restaurants

| # | Task | Status |
|---|------|--------|
| 1 | Error Handling im Webhook | Erledigt |
| 2 | Dashboard echte Daten | Erledigt |
| 3 | Token Expiry Warning | Erledigt |
| 4 | Input Validation (Reservierungen) | Erledigt |
| 5 | Rate Limiting | Erledigt |
| 6 | Error Responses anonymisieren | Erledigt |
| 7 | Conversation History UI | Erledigt |
| 8 | Multi-Tenant DB (accounts, team roles, RLS) | Erledigt |
| 9 | Auth Security Overhaul (getUser, middleware, SSR) | Erledigt |
| 10 | Instagram OAuth via FLB (config_id) | Erledigt |
| 11 | Instagram Webhooks fuer alle Accounts | Erledigt |

---

## Phase 2: Finales Produkt (6-8 Wochen nach Pilot)

### Prioritaet 1: Core Features

| # | Feature | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 1 | Email-Benachrichtigungen | 2 Wochen | Emails bei neuer Reservierung, Stornierung, Token-Ablauf |
| 2 | Token Auto-Refresh | 1 Woche | Instagram-Token automatisch vor Ablauf erneuern |
| 3 | Messages Team-Zugriff | 1 Woche | RLS + API auf account_id umstellen |

### Prioritaet 2: Business Features

| # | Feature | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 4 | Team-Invite UI | 1 Woche | DB + API fertig, UI/Invite-Flow offen |
| 5 | Billing/Stripe | 2 Wochen | Subscription-Modell mit Stripe |
| 6 | Kalender-View | 1-2 Wochen | Reservierungen als Kalender statt Tabelle |
| 7 | Manuelles Messaging | 1 Woche | Restaurant kann Kunden direkt anschreiben |

### Prioritaet 3: Nice-to-Have

| # | Feature | Aufwand | Beschreibung |
|---|---------|---------|--------------|
| 8 | WhatsApp Integration | 2 Wochen | DB vorbereitet (channel-agnostik), API-Anbindung offen |
| 9 | Analytics Dashboard | 2 Wochen | Statistiken zu Flows/Reservierungen |
| 10 | Export (CSV/PDF) | 1 Woche | Reservierungen exportieren |
| 11 | Kalender-Integration | 1 Woche | Google Calendar, iCal Sync |

---

## Aktueller Feature-Stand

### Erledigt

| Feature | Status |
|---------|--------|
| Instagram OAuth (FLB mit config_id) | Erledigt |
| Instagram Webhooks (alle Accounts) | Erledigt |
| Flow Builder (Visual + List) | Erledigt |
| Flow Templates | Erledigt |
| Flow Simulator | Erledigt |
| Webhook-Verarbeitung | Erledigt |
| Variable-Extraktion | Erledigt |
| Platzhalter-Ersetzung | Erledigt |
| Reservierung bei Bestaetigung | Erledigt |
| Reservierungs-Dashboard | Erledigt |
| Google-Review-Flow | Erledigt |
| Multi-Tenant DB (accounts + RLS) | Erledigt |
| Kontakte & Kanaele | Erledigt |
| Auth Security Overhaul | Erledigt |
| Logging | Erledigt |

### Geplant

| Feature | Status |
|---------|--------|
| Email-Benachrichtigungen | Geplant |
| Token Auto-Refresh | Geplant |
| Messages Team-Zugriff | Geplant |
| Team-Invite UI | Geplant |
| Billing/Stripe | Geplant |
| WhatsApp Integration | Geplant |
| Kalender-View | Geplant |
| Analytics Dashboard | Geplant |

---

## Bekannte Einschraenkungen

- **60-Tage Token:** Access Token muss erneuert werden (aktuell manuell)
- **Multi-Tenant DB fertig:** accounts + account_members + RLS vorhanden, Team-Invite-UI fehlt noch
- **Messages RLS:** Noch user-basiert, kein Team-Zugriff
- **integrations Index:** `(user_id, provider)` statt `(account_id, provider)`
