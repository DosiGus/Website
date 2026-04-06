# Wesponde Roadmap

**Stand:** April 2026
**Status:** Produkt fast fertig, letzte Schritte

---

## Erledigt

- Instagram OAuth + Webhooks (FLB, config_id)
- Flow Builder (Visual + List + Templates + Simulator + Lint)
- Webhook-Pipeline (DM → Flow → Reservierung)
- Google Calendar + Review Integration
- Multi-Tenant DB + RLS + Auth Security
- Marketing Site (Homepage, Blog, Pricing, About, Contact)
- App Frontend Redesign
- Token Auto-Refresh (Meta)
- Kontakte & Kanäle

## Offen

| Feature | Aufwand | Notiz |
|---------|---------|-------|
| Email-Benachrichtigungen (Reservierung/Storno) | 1-2 Wo | — |
| Team-Invite UI | 1 Wo | DB fertig, UI offen |
| Billing/Stripe | 2 Wo | — |
| WhatsApp Integration | 2 Wo | DB channel-agnostisch vorbereitet |
| Kalender-View (Reservierungen) | 1-2 Wo | — |
| Flow Export/Import UI | 1 Wo | API-Route vorhanden |

## Bekannte Einschränkungen

- `conversations.instagram_sender_id` NOT NULL — blockiert channel-agnostische Konversationen
- Team-Invite-UI fehlt (DB-Struktur vorhanden)
- Multi-Select Canvas: kein Batch-Delete/Move
