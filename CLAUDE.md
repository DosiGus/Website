# CLAUDE.md

## Commands

```bash
npm run dev      # Start local dev server (Next.js)
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

B2B SaaS for German service businesses (restaurants, salons, fitness). Instagram DM automation: reservations, bookings, FAQ, Google Reviews. Next.js 14 (App Router), TypeScript strict, Tailwind CSS, Supabase, React Flow, Vercel.

### Two-zone layout

- **Public site** (`app/page.tsx`, `/about`, `/blog`, `/contact`, `/login`, `/pricing`, legal) — light theme, `bg-[#f6f9ff]`, accent `#2450b2`
- **App** (`app/app/`) — guarded by `AppAuthGate.tsx` + `middleware.ts`

### Auth & API

- `@supabase/ssr` cookie sessions, `middleware.ts` protects `/app/*` only
- API: `requireAccountMember(request)` → `{ user, accountId, role, supabase, token }`
- Service-role client (`lib/supabaseServerClient.ts`) only for webhooks/cron
- NEVER use `getSession()` server-side — always `getUser()`

### Database

Schema: `supabase/schema.sql` (source of truth). Multi-tenant via `accounts` + `account_members`, RLS via `user_account_ids()`.

Key tables: `accounts`, `account_members`, `flows`, `integrations`, `conversations`, `messages`, `contacts`, `contact_channels`, `reservations`, `review_requests`, `oauth_states`, `flow_templates`, `logs`

### Flow Builder

- `FlowBuilderClient.tsx` — main orchestrator, autosave 1.5s debounce
- `FlowListBuilder.tsx` — simple list mode
- `FlowBuilderCanvas.tsx` — React Flow canvas (pro mode)
- `FlowSimulator.tsx`, `InspectorSlideOver.tsx`, `FlowNode.tsx`, `FlowSetupWizard.tsx`
- Status: `"Entwurf"` / `"Aktiv"`, triggers keyword-based (EXACT/CONTAINS)
- API: `app/api/flows/route.ts`, `app/api/flows/[id]/route.ts`

### Webhook Pipeline

`app/api/webhooks/instagram/route.ts` → verify signature → idempotency → find/create conversation → match flow → execute nodes → extract variables → create reservation at confirmation → send reply via Instagram API

Key files: `lib/webhook/` (flowMatcher, flowExecutor, variableExtractor, variableSubstitutor, reservationCreator)

### Meta Integration

- App ID: `2003432446768451` ("TableDm"), Live, Standard Access
- OAuth: Facebook Login for Business (FLB) with config_id
- Google OAuth approved (calendar.events + calendar.readonly)

## Conventions

- German-first: UI text, DB values (`"Entwurf"`, `"Aktiv"`), RLS policy names
- `'use client'` for client components, `*Client.tsx` naming for stateful ones
- Icons: `lucide-react`
- No ORM — direct Supabase JS client
- Public site: light theme only, no dark colors, no blur filters

## Deployment

Vercel via GitHub (`DosiGus/Website`). Push to `main` → auto-deploy.
- Production: `https://wesponde.com`
- App: `https://wesponde.com/app`

## Environment Variables

See `.env.local.example`. Required: Supabase (URL, anon key, service role), Meta OAuth (app ID/secret), Google OAuth, TOKEN_ENCRYPTION_KEY, QStash, Redis, Resend, META_WEBHOOK_VERIFY_TOKEN.

## Common Issues

- **Token refresh**: Ensure QStash/Redis/Resend env vars are set
- **Webhook not receiving**: Check webhook subscription in Meta Developer Portal
- **Reservation not created**: Needs name, date, time (+ guestCount for gastro)
- **Duplicate reservations**: System checks `metadata.reservationId`
