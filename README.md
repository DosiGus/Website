# Wesponde Website

Next.js 14 + Tailwind-Projekt für die Wesponde-Landingpage inkl. Beta-Warteliste, Login- und Info-Seiten.

## Quick Start
1. Upload all files to your GitHub repository.
2. Ensure Vercel is connected to this repo.
3. Vercel will automatically build and deploy.

## Edit Content
- Pages are in the `app/` folder:
  - `/` → `app/page.tsx`
  - `/contact` → `app/contact/page.tsx`
  - `/impressum` → `app/impressum/page.tsx`
  - `/privacy` → `app/privacy/page.tsx`
  - `/terms` → `app/terms/page.tsx`
- Navbar/Footer in `components/`.
- Global styles in `app/globals.css`.
- Tailwind config in `tailwind.config.ts`.

## Scripts
- `npm run dev` — Local development (optional)
- `npm run build` — Build
- `npm start` — Start production server

## Notes
- All content is placeholder. Replace with real info before launch.
- For German legal compliance, ensure the Impressum & Privacy are correct.
- Supabase Auth:  
  1. Projekt in Supabase anlegen und URL + Keys kopieren.  
  2. `.env.local` anhand `.env.local.example` ausfüllen (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_REDIRECT_URL`).  
  3. Lokal `npm install` ausführen (neu: `lucide-react`, `reactflow`, `@supabase/supabase-js`).  
  4. `npm run dev` starten und `/login` testen. Email-/Passwort-Login läuft über `components/PartnerLoginForm.tsx` (nutzt `lib/supabaseBrowserClient.ts`).  
  5. Für serverseitige Logik (z. B. spätere Chatflow-APIs) steht `lib/supabaseServerClient.ts` bereit.

## App-Bereich (Beta)
- Geschützter Bereich unter `/app` mit Sidebar + Topbar (`app/app/layout.tsx`).
- Seiten:
  - `/app/dashboard`: Übersicht & Kennzahlen
  - `/app/flows`: Flow-Liste + `/app/flows/[id]` mit React Flow Canvas & Editor
  - `/app/integrations`: Integrationskarten (Meta, WhatsApp etc.)
  - `/app/settings`: Profil-, API- und Benachrichtigungs-Formulare
- Auth-Gate: `components/AppAuthGate.tsx` prüft Supabase-Sessions und leitet sonst nach `/login`.
- Flow Builder:
  - API-Routen: `app/api/flows` & `app/api/flows/[id]` (CRUD via Supabase Service Client)
  - Client-Komponenten: `components/app/FlowBuilderClient.tsx` & `components/app/FlowListClient.tsx`
  - Flow-Daten werden als JSON (`nodes`, `edges`) in der Tabelle `flows` gespeichert.
  - Standard-Setup: siehe `supabase/schema.sql` – bitte im Supabase SQL-Editor ausführen und Policies aktivieren.
- React Flow Canvas: `components/app/FlowBuilderCanvas.tsx` wird von `FlowBuilderClient` kontrolliert (Nodes hinzufügen, Eigenschaften bearbeiten, Speichern).
