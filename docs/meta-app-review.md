# Meta App Review Checklist (Wesponde)

## Ziel
App Review fuer Instagram Messaging vorbereiten. Fokus: klares Demo-Szenario, minimale Permissions, Data Deletion.

## Permissions (aktuell in Code)
- instagram_basic
- instagram_manage_messages
- pages_show_list
- pages_read_engagement
- pages_manage_metadata
- business_management

Empfehlung: Jede Permission mit 1-2 Saetzen begruenden. Wenn etwas nicht gebraucht wird, entfernen.

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
2) Integrationen oeffnen, Instagram verbinden (OAuth).
3) Bestands-Flow aktivieren (oder Template erstellen).
4) Instagram DM senden ("Reservieren").
5) Bot antwortet, Fragen werden gestellt (Datum/Uhrzeit/Name).
6) Bestaetigung, Reservierung wird im Dashboard sichtbar.

## Evidence/Notes
- Zeige in der Aufnahme den kompletten DM-Dialog.
- Zeige die Reservierung im Dashboard nach Abschluss.
- Falls benoetigt: zeige die Data Deletion Seite kurz.

## Data Deletion (intern)
- Callback validiert signed_request.
- Antwort enthaelt confirmation_code + status URL.
- Seite /data-deletion zeigt Code und Prozesshinweis.
