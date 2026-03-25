# Wesponde Roadmap

**Stand:** 20. März 2026
**Timeline:** Marketing Site live, Pilot aktiv

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
| Google Calendar Integration | Erledigt |
| Multi-Tenant DB (accounts + RLS) | Erledigt |
| Kontakte & Kanaele | Erledigt |
| Auth Security Overhaul | Erledigt |
| Logging | Erledigt |
| Token Auto-Refresh (Meta) | Erledigt |
| Messages Team-Zugriff (account-based RLS) | Erledigt |
| Marketing Site Light Theme | Erledigt (März 2026) |
| Blog-Seite mit Kategorie-Filter | Erledigt (März 2026) |
| 9 Blog-Artikel (Playbook/Best Practice/Guide) | Erledigt (März 2026) |
| Pricing-Seite (3 Tiers + FAQ + Subgrid) | Erledigt (März 2026) |

### Geplant

| Feature | Status |
|---------|--------|
| Email-Benachrichtigungen (Reservierung/Storno) | Geplant |
| Team-Invite UI | Geplant — DB fertig, UI offen |
| Billing/Stripe | Geplant |
| WhatsApp Integration | Geplant — DB channel-agnostisch vorbereitet |
| Kalender-View (Reservierungen als Kalender) | Geplant |
| Analytics Dashboard | Geplant |
| Flow Export/Import UI | Geplant — API-Route vorhanden, UI fehlt |

---

## Bekannte Einschraenkungen

- **60-Tage Token:** Meta Access Token wird automatisch via Cron erneuert (Resend + QStash ENV müssen gesetzt sein)
- **Team-Invite-UI:** DB-Struktur (account_members) vorhanden, Invite-UI und -Flow noch nicht gebaut
- **`conversations.instagram_sender_id` NOT NULL:** Blockiert channel-agnostische Konversationen
- **Multi-Select Canvas:** Kein Batch-Delete/Move im Flow Builder Canvas
