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

- Browser auth: `createBrowserClient` from `@supabase/ssr` (`lib/supabaseBrowserClient.ts`) — singleton, cookie-based sessions
- Server-side middleware (`middleware.ts`) refreshes auth tokens on every request and protects `/app/*` routes
- SSR server client (`lib/supabaseSSRClient.ts`) for cookie-based auth in Server Components/Route Handlers
- Auth callback route (`app/auth/callback/route.ts`) handles email confirmation (token_hash) and PKCE code exchange
- API routes: Bearer token auth via `lib/apiAuth.ts` → `requireAccountMember()` resolves user + account membership. Legacy `requireUser()` still available.
- Server-side operations use a service-role client (`lib/supabaseServerClient.ts`) for admin access (bypasses RLS)
- Client-side auth gate (`components/AppAuthGate.tsx`) as secondary protection using `getUser()` (server-validated)

### Database (Supabase PostgreSQL)

Schema in `supabase/schema.sql`. Multi-tenant model: all data scoped to `account_id` via `accounts` table. RLS uses `user_account_ids()` helper function. Legacy `user_id` policies remain for backward compatibility.

**Auto-provisioning:** A database trigger (`on_auth_user_created`) calls `create_account_for_user()` on signup, which creates an `accounts` row + `account_members` (owner) entry automatically.

**OAuth flow:** `oauth_states` carries `account_id` from the start route so the callback can associate the integration with the correct account.

| Table | Purpose |
|-------|---------|
| `accounts` | Tenant entity (restaurant, salon, praxis) |
| `account_members` | User-to-account membership with roles (owner/admin/member/viewer) |
| `contacts` | End-customers/guests, trackable across conversations |
| `contact_channels` | Channel identities per contact, with `account_id` + unique `(account_id, channel, channel_identifier)` |
| `flows` | Conversation flows (nodes/edges/triggers as JSONB), scoped to `account_id` |
| `flow_templates` | Pre-built templates (restaurant, salon, medical) |
| `integrations` | Meta/Instagram OAuth tokens, connection status, `channel` field |
| `review_requests` | Review follow-up tracking (rating, feedback, sent status) |
| `oauth_states` | CSRF protection for OAuth flow, carries `account_id` for callback |
| `messages` | Incoming/outgoing messages, `channel_message_id` for channel-agnostic lookup |
| `conversations` | Conversation threads with `contact_id`, `channel`, `channel_sender_id` |
| `reservations` | Bookings/appointments with `contact_id` for guest tracking |
| `logs` | Webhook/system logs (`account_id` nullable for system logs) |

### Flow Builder

The core feature. Key files:

- `components/app/FlowBuilderClient.tsx` — Main orchestrator (~63KB). Manages all state: node editing, drag-drop, triggers, autosave (2s debounce on inactivity), publish/draft toggle, real-time linting warnings
- `components/app/FlowBuilderCanvas.tsx` — React Flow canvas wrapper, controlled by FlowBuilderClient
- `components/app/FlowListBuilder.tsx` — Simplified list-based flow builder for quick editing
- `components/app/FlowSetupWizard.tsx` — Step-by-step wizard for creating flows from templates
- `components/app/FlowNode.tsx` — Custom node renderer
- `components/app/FlowSimulator.tsx` — Test mode to simulate conversations in the browser
- `lib/flowTypes.ts` — TypeScript types for flows, triggers, quick replies
- `lib/flowLint.ts` — Validates node connectivity, triggers, warns on disconnected nodes
- `lib/defaultFlow.ts` — Default nodes/edges for new flows
- `lib/flowTemplates.ts` — In-memory fallback templates if Supabase is unavailable

Flow API routes: `app/api/flows/route.ts` (list/create), `app/api/flows/[id]/route.ts` (get/update/delete), `app/api/flows/[id]/export/route.ts`

### Flow domain model

Flow status values are German: `"Entwurf"` (Draft) and `"Aktiv"` (Active). Triggers are keyword-based with `EXACT` or `CONTAINS` match types. Nodes store `text`, optional `imageUrl`, `quickReplies` array, and a `variant` field.

### Webhook & Message Processing

The core message processing happens in `app/api/webhooks/instagram/route.ts`. Key logic:

```
Instagram DM received
        ↓
Verify signature (X-Hub-Signature-256)
        ↓
Find/create conversation for Instagram sender
        ↓
Extract variables from message (name, date, time, phone, etc.)
        ↓
Check for existing active reservation
  → If exists: Show options (Cancel/Keep/New)
        ↓
Match message against flow triggers OR continue existing flow
        ↓
Execute flow node, generate response
        ↓
At confirmation: Create reservation in DB
        ↓
Send reply via Instagram API
```

Key webhook files:
- `lib/webhook/flowMatcher.ts` — Matches messages against flow triggers
- `lib/webhook/flowExecutor.ts` — Executes flow nodes, handles quick replies and free text
- `lib/webhook/variableExtractor.ts` — Extracts user data (name, date, time, phone, email, specialRequests)
- `lib/webhook/variableSubstitutor.ts` — Replaces `{{placeholders}}` in messages
- `lib/webhook/reservationCreator.ts` — Creates reservations from extracted variables

### Reservation System

Reservations are created automatically when users complete a reservation flow:

1. **Variable Collection**: During the flow, variables are stored in `conversations.metadata.variables`
2. **Existing Reservation Check**: Before starting a new flow, checks if user has active reservation
3. **Reservation Creation**: Only at `confirmed` node or explicit confirmation
4. **Duplicate Prevention**: `reservationId` in metadata prevents duplicate creation

Required reservation fields: `name`, `date`, `time`, `guestCount`
Optional fields: `phone`, `email`, `specialRequests`

Reservations UI: `app/app/reservations/page.tsx` with `components/app/ReservationsClient.tsx`

### Review Flow (Google Reviews)
- Triggered when a reservation status is set to **completed** in the dashboard
- Uses a system template (`template-google-review`) with rating quick replies and optional feedback
- Sends the Google review link stored in `integrations.google_review_url`
- Tracking stored in `review_requests`

## Meta/Instagram Integration

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
| `instagram_basic` | Standard access | Works in dev mode |
| `instagram_manage_messages` | Standard access | Works in dev mode |
| `instagram_business_manage_messages` | Standard access | Works in dev mode |
| `pages_manage_metadata` | Standard access ✅ | Ready |
| `pages_read_engagement` | Standard access ✅ | Ready |
| `business_management` | Standard access ✅ | Ready |
| `pages_messaging` | Standard access ✅ | Ready |
| `pages_show_list` | Standard access ✅ | Ready |

### OAuth Flow Architecture
```
User clicks "Connect Instagram"
        ↓
GET /api/meta/oauth/start
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
Check for existing reservation
  → Show options if active reservation exists
        ↓
Match against active flows (triggers)
        ↓
Execute flow, extract variables
        ↓
Send reply via Instagram API
        ↓
Create reservation at confirmation
        ↓
Log to messages/conversations/logs tables
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
- GitHub Repo: `DosiGus/Website`

Auto-deployment: Push to `main` triggers Vercel build.

## File Structure

```
middleware.ts                # Server-side auth (session refresh + /app/* protection)

app/
  auth/
    callback/route.ts       # Email confirmation + PKCE code exchange
  api/
    flows/
      route.ts              # List/create flows
      [id]/
        route.ts            # Get/update/delete flow
        export/route.ts     # Export flow as JSON
    meta/
      oauth/
        start/route.ts      # Initiates OAuth flow
        callback/route.ts   # Handles OAuth callback
    webhooks/
      instagram/route.ts    # Receives Instagram DM webhooks (MAIN WEBHOOK LOGIC)
    integrations/route.ts   # Integration management
    reservations/route.ts   # Reservation API
    logs/route.ts           # Logs API
    templates/route.ts      # Flow templates
  app/
    dashboard/page.tsx      # Dashboard
    flows/
      page.tsx              # Flow list
      new/page.tsx          # Create new flow
      [id]/page.tsx         # Edit flow
    integrations/page.tsx   # Connect Instagram/Meta
    reservations/page.tsx   # Reservation management
    settings/page.tsx       # User settings

lib/
  webhook/
    flowMatcher.ts          # Match messages to flows (by account_id)
    flowExecutor.ts         # Execute flow nodes
    variableExtractor.ts    # Extract user data from messages
    variableSubstitutor.ts  # Replace {{placeholders}}
    reservationCreator.ts   # Create reservations (with account_id + contact_id)
  meta/
    instagramApi.ts         # Send Instagram messages
    types.ts                # Meta API types
    webhookVerify.ts        # Webhook signature verification
  reviews/
    reviewSender.ts         # Send Google review requests after reservations
  contacts.ts               # findOrCreateContact(), updateContactDisplayName()
  apiAuth.ts                # requireUser() + requireAccountMember() -> { user, accountId, role }
  supabaseBrowserClient.ts  # Browser Supabase client (singleton via @supabase/ssr)
  supabaseServerClient.ts   # Service-role client for admin/webhook operations
  supabaseSSRClient.ts      # Cookie-based SSR client for Server Components
  flowTypes.ts              # Flow type definitions
  flowLint.ts               # Flow validation
  flowTemplates.ts          # Template definitions
  logger.ts                 # Logging utility
  reservationTypes.ts       # Reservation types

components/
  app/
    FlowBuilderClient.tsx   # Main flow editor
    FlowBuilderCanvas.tsx   # React Flow canvas
    FlowListBuilder.tsx     # Simple list editor
    FlowSetupWizard.tsx     # Template wizard
    FlowSimulator.tsx       # Test mode
    FlowNode.tsx            # Custom node component
    ReservationsClient.tsx  # Reservation dashboard
    IntegrationsClient.tsx  # Integration management
    AppSidebar.tsx          # App navigation
    AppTopbar.tsx           # App header

supabase/
  schema.sql                # Database schema
```

## Testing

### Testing Instagram Integration
1. Add yourself as a test user in Meta Developer Portal → App Roles
2. Make sure you have a Facebook Page connected to an Instagram Business/Creator account
3. Use the OAuth flow to connect your account
4. Test with your own Instagram DMs

### Testing Reservation Flow
1. Create a new flow and set it to "Aktiv"
2. Add trigger keywords (e.g., "reservieren", "tisch")
3. Send a DM to your connected Instagram account
4. Complete the flow (date, time, guests, name, phone, special requests)
5. Verify in Supabase:
   - `conversations.metadata.variables` — collected data
   - `reservations` — new entry created

### Debugging
- Check `logs` table in Supabase for webhook events
- Use Vercel logs for server-side errors
- Check browser console for client-side issues

## Common Issues

- **"Invalid redirect_uri"**: Check that the exact URL is in Meta's "Valid OAuth Redirect URIs"
- **"User is not a test user"**: Add the Facebook account to App Roles → Test Users
- **Permission denied**: Some permissions require App Review for production; use test users in dev mode
- **Webhook not receiving**: Verify the webhook is subscribed to `messages` field in Meta Developer Portal
- **Reservation not created**: Check that all required fields (name, date, time, guestCount) are present
- **Duplicate reservations**: The system checks `metadata.reservationId` to prevent duplicates
- **Old reservation blocking new one**: Metadata is reset when a new flow starts

## MCP Integration

This project can be managed via Claude Code with MCP servers:
- **Supabase MCP**: Direct database access, execute SQL, manage tables
- **Vercel MCP**: Deployment management, logs, project settings

To connect:
```bash
claude mcp add --transport http supabase https://mcp.supabase.com
claude mcp add --transport http vercel https://mcp.vercel.com
```
