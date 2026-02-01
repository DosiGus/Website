# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start local dev server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint with Next.js core-web-vitals rules
```

No test framework is configured. No Makefile.

## Architecture

Wesponde is a B2B SaaS platform for automating customer conversations (Instagram DM, WhatsApp, Facebook Messenger) targeting German service businesses. Built with Next.js 14 (App Router), TypeScript (strict mode), Tailwind CSS, Supabase, and React Flow.

### Two-zone layout

- **Public marketing site** (`app/page.tsx`, `app/about/`, `app/blog/`, `app/contact/`, legal pages) — server-rendered, dark theme (slate-950)
- **Protected app** (`app/app/`) — client-heavy, light theme (slate-50), guarded by `components/AppAuthGate.tsx` which checks Supabase sessions and redirects to `/login`

### Authentication & API

- Browser auth: Supabase client (`lib/supabaseBrowserClient.ts`) with email/password + Meta OAuth
- API routes: Bearer token auth via `lib/apiAuth.ts` → `requireUser()` validates JWT against Supabase
- Server-side operations use a service-role client (`lib/supabaseServerClient.ts`) for admin access

### Database (Supabase PostgreSQL)

Schema in `supabase/schema.sql`. All tables use RLS (Row-Level Security) scoped to `auth.uid() = user_id`.

| Table | Purpose |
|-------|---------|
| `flows` | User conversation flows (nodes/edges/triggers stored as JSONB) |
| `flow_templates` | Pre-built templates (restaurant, salon, medical) |
| `integrations` | Meta/Instagram OAuth tokens and connection status |
| `oauth_states` | CSRF protection for OAuth flow |
| `messages` | Incoming/outgoing messages from Instagram/WhatsApp |
| `conversations` | Conversation threads with customers |
| `reservations` | Bookings/appointments extracted from conversations |

### Flow Builder

The core feature. Key files:

- `components/app/FlowBuilderClient.tsx` — Main orchestrator (~55KB). Manages all state: node editing, drag-drop, triggers, autosave (2s debounce on inactivity), publish/draft toggle, real-time linting warnings
- `components/app/FlowBuilderCanvas.tsx` — React Flow canvas wrapper, controlled by FlowBuilderClient
- `components/app/FlowNode.tsx` — Custom node renderer
- `lib/flowTypes.ts` — TypeScript types for flows, triggers, quick replies
- `lib/flowLint.ts` — Validates node connectivity, triggers, warns on disconnected nodes
- `lib/defaultFlow.ts` — Default nodes/edges for new flows
- `lib/flowTemplates.ts` — In-memory fallback templates if Supabase is unavailable

Flow API routes: `app/api/flows/route.ts` (list/create), `app/api/flows/[id]/route.ts` (get/update/delete), `app/api/flows/[id]/export/route.ts`

### Flow domain model

Flow status values are German: `"Entwurf"` (Draft) and `"Aktiv"` (Active). Triggers are keyword-based with `EXACT` or `CONTAINS` match types. Nodes store `text`, optional `imageUrl`, `quickReplies` array, and a `variant` field.

## Meta/Instagram Integration (PRIORITY)

### Current Status
- Meta App ID: `2003432446768451`
- App Name: TableDm
- Business: vastfolio (verified)
- Tech Provider: Verified ✅
- App Mode: Live

### Meta Products Enabled
- ✅ Messenger
- ✅ Instagram
- ✅ WhatsApp
- ✅ Webhooks
- ✅ Facebook Login for Business

### OAuth Configuration
- Redirect URI: `https://wesponde.com/api/meta/oauth/callback`
- App Domain: `wesponde.com`

### Required Permissions for Instagram DM
| Permission | Status | Notes |
|------------|--------|-------|
| `instagram_basic` | Standard access (rejected for advanced) | Works in dev mode |
| `instagram_manage_messages` | Standard access (rejected for advanced) | Works in dev mode |
| `instagram_business_manage_messages` | Standard access | Works in dev mode |
| `pages_manage_metadata` | Standard access ✅ | Ready |
| `pages_read_engagement` | Standard access ✅ | Ready |
| `business_management` | Standard access ✅ | Ready |
| `pages_messaging` | Standard access ✅ | Ready |
| `pages_show_list` | Needs activation | Click "Standardzugriff erhalten" |

### OAuth Flow Architecture
```
User clicks "Connect Instagram"
        ↓
GET /api/meta/oauth
        ↓
Redirect to Facebook Login Dialog
(https://www.facebook.com/v21.0/dialog/oauth)
        ↓
User authorizes permissions
        ↓
GET /api/meta/oauth/callback?code=xxx
        ↓
Exchange code for access_token
        ↓
Get long-lived token (60 days)
        ↓
Fetch user's Pages & Instagram accounts
        ↓
Save to `integrations` table
        ↓
Redirect to /app/integrations?success=true
```

### Webhook Architecture (for receiving messages)
```
Instagram DM received
        ↓
Meta sends POST to /api/webhooks/instagram
        ↓
Verify signature (X-Hub-Signature-256)
        ↓
Parse message payload
        ↓
Match against active flows (triggers)
        ↓
Execute flow, generate response
        ↓
Send reply via Instagram API
        ↓
Log to messages/conversations tables
```

## Conventions

- German-first: all user-facing copy, database values (`"Entwurf"`, `"Aktiv"`), and RLS policy names are in German
- Client components use `'use client'` directive; server components are the default
- Icons from `lucide-react`
- Brand primary color: `#3769FF` (configured in `tailwind.config.ts`)
- Component naming: `*Client.tsx` suffix for state-heavy client components
- No ORM — direct Supabase JS client calls throughout
- API routes use Next.js 14 Route Handlers (not pages/api)

## Environment Variables

Required in `.env.local` (see `.env.local.example`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://wesponde.com

# Meta OAuth
META_APP_ID=2003432446768451
META_APP_SECRET=<from Meta Developer Portal>
META_REDIRECT_URI=https://wesponde.com/api/meta/oauth/callback
NEXT_PUBLIC_META_APP_ID=2003432446768451

# Webhooks
META_WEBHOOK_VERIFY_TOKEN=<random string you define>
```

## Deployment

Vercel via GitHub. Environment variables set in Vercel dashboard. 
- Production URL: `https://wesponde.com`
- App URL: `https://wesponde.com/app`

## File Structure for Meta Integration

```
app/
  api/
    meta/
      oauth/
        route.ts              # Initiates OAuth flow
        callback/
          route.ts            # Handles OAuth callback
    webhooks/
      instagram/
        route.ts              # Receives Instagram DM webhooks
      messenger/
        route.ts              # Receives Messenger webhooks
lib/
  meta/
    client.ts                 # Meta Graph API client
    types.ts                  # TypeScript types for Meta API
    permissions.ts            # Permission scopes
    webhookVerify.ts          # Webhook signature verification
components/
  app/
    IntegrationsClient.tsx    # Integrations page with connect buttons
    InstagramConnectButton.tsx
supabase/
  schema.sql                  # Database schema including integrations table
```

## Testing Meta Integration

1. Add yourself as a test user in Meta Developer Portal → App Roles
2. Make sure you have a Facebook Page connected to an Instagram Business/Creator account
3. Use the OAuth flow to connect
4. Test with your own Instagram DMs

## Common Issues

- **"Invalid redirect_uri"**: Check that the exact URL is in Meta's "Valid OAuth Redirect URIs"
- **"User is not a test user"**: Add the Facebook account to App Roles → Test Users
- **Permission denied**: Some permissions require App Review for production; use test users in dev mode
- **Webhook not receiving**: Verify the webhook is subscribed to `messages` field in Meta Developer Portal1