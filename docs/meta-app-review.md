# Meta App Review Checklist (Wesponde)

## Status: App Review bestanden (Standard Access)

## App Details
- **App-ID:** 2003432446768451
- **App-Name:** TableDm
- **Business:** vastfolio (verifiziert)
- **Tech Provider:** Verifiziert
- **App-Modus:** Live
- **OAuth-Methode:** Facebook Login for Business (FLB) mit config_id

## Permissions (aktuell in Code)
- `instagram_basic` - Standard Access
- `instagram_manage_messages` - Standard Access
- `instagram_business_manage_messages` - Standard Access
- `pages_show_list` - Standard Access
- `pages_read_engagement` - Standard Access
- `pages_manage_metadata` - Standard Access
- `pages_messaging` - Standard Access

## Meta Products
- Messenger
- Instagram
- WhatsApp
- Webhooks
- Facebook Login for Business

## Pflicht-URLs
- OAuth Redirect: https://wesponde.com/api/meta/oauth/callback
- Data Deletion Callback: https://wesponde.com/api/meta/data-deletion
- Data Deletion Instructions/Status: https://wesponde.com/data-deletion
- Privacy Policy: https://wesponde.com/privacy
- Terms: https://wesponde.com/terms

## Test-Setup (Meta Review)
1) Test-Facebook-User mit Zugriff auf die App.
2) Test-Instagram Business Account, verbunden mit einer Facebook Page.
3) Test-Restaurant in Wesponde (Account).
4) Demo-Flow aktiv (Reservierung).

## Screencast Script (Deutsch)
1) Login in Wesponde.
2) Integrationen oeffnen, Instagram verbinden (OAuth mit FLB).
3) Bestands-Flow aktivieren (oder Template erstellen).
4) Instagram DM senden ("Reservieren").
5) Bot antwortet, Fragen werden gestellt (Datum/Uhrzeit/Name).
6) Bestaetigung, Reservierung wird im Dashboard sichtbar.

## Data Deletion (intern)
- Callback validiert signed_request.
- Antwort enthaelt confirmation_code + status URL.
- Seite /data-deletion zeigt Code und Prozesshinweis.
