# Wesponde

B2B SaaS platform for automating customer conversations via Instagram DM, WhatsApp, and Facebook Messenger - targeting German service businesses (restaurants, salons, medical practices).

## Features

- **Visual Flow Builder** - Drag-and-drop conversation flows with React Flow
- **Instagram DM Integration** - Receive and respond to messages automatically
- **Reservation System** - Automatically extract and store bookings
- **Google Review Flow** - Ask for ratings after completed visits
- **Templates** - Pre-built flows for common use cases (Restaurant, Salon, etc.)
- **Flow Simulator** - Test conversations in the browser before going live

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Flow Editor:** React Flow
- **Deployment:** Vercel
- **Messaging:** Meta Graph API (Instagram, Messenger)

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Meta Developer account (for Instagram integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/DosiGus/Website.git
cd Website

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://your-domain.com

# Meta OAuth
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URI=https://your-domain.com/api/meta/oauth/callback
NEXT_PUBLIC_META_APP_ID=your_app_id

# Facebook Login for Business (FLB)
META_LOGIN_CONFIG_ID=your_config_id

# Instagram Webhook Signature (second secret for instagram object)
META_INSTAGRAM_APP_SECRET=your_instagram_app_secret

# Webhooks
META_WEBHOOK_VERIFY_TOKEN=your_random_string

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google/oauth/callback
```

### Database Setup

Run the SQL from `supabase/schema.sql` in your Supabase SQL Editor to create the required tables:
- `accounts` - Tenant entities (restaurant, salon, practice)
- `account_members` - Team memberships with roles (owner/admin/member/viewer)
- `contacts` - End-customers/guests trackable across conversations
- `contact_channels` - Channel identities (Instagram PSID, WhatsApp, etc.)
- `flows` - Conversation flows (scoped to account)
- `flow_templates` - Pre-built templates
- `integrations` - Meta/Instagram connections (scoped to account)
- `conversations` - Chat threads with contact + channel support
- `messages` - Individual messages
- `reservations` - Bookings with contact linking
- `review_requests` - Review follow-ups (rating/feedback tracking)
- `oauth_states` - OAuth CSRF protection
- `logs` - System logs

A signup trigger (`on_auth_user_created`) auto-creates an account and owner membership for new users.

## Project Structure

```
app/
  page.tsx                  # Landing page
  app/                      # Protected app area
    dashboard/              # Overview
    flows/                  # Flow management
    integrations/           # Instagram/Meta connection
    reservations/           # Booking management
  api/
    webhooks/instagram/     # Instagram webhook (main logic)
    flows/                  # Flow CRUD
    meta/oauth/             # OAuth flow (FLB with config_id)

lib/
  webhook/                  # Message processing
    flowExecutor.ts         # Execute flow nodes
    flowMatcher.ts          # Match triggers
    variableExtractor.ts    # Extract user data
    reservationCreator.ts   # Create bookings
  meta/                     # Meta/Instagram API
    instagramApi.ts         # Send messages (POST /me/messages)
    webhookVerify.ts        # HMAC-SHA256 signature verification
    types.ts                # Meta API types + permissions
  reviews/                  # Review flow sending
    reviewSender.ts         # Send Google review follow-ups

components/
  app/
    FlowBuilderClient.tsx   # Main flow editor
    FlowSimulator.tsx       # Test mode
    ReservationsClient.tsx  # Booking dashboard
```

## How It Works

### Instagram OAuth (Facebook Login for Business)
1. User clicks "Connect Instagram"
2. Redirects to Facebook Login Dialog with `config_id` (FLB)
3. User authorizes permissions including Instagram-specific step
4. Callback exchanges code for long-lived token (60 days)
5. Page discovery via `debug_token` `target_ids` (Approach 4)
6. Page-level webhook subscription activated
7. Integration saved to database

### Message Processing
1. User sends DM to your Instagram
2. Webhook receives the message (signature verified)
3. Echo and read receipt events filtered out
4. System matches against active flow triggers
5. Executes flow, extracts variables (date, time, name, etc.)
6. Sends response via `POST /me/messages` with page access token
7. At confirmation: creates reservation in database

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

The app is deployed on Vercel with automatic deployments from the `main` branch.

- **Production:** https://wesponde.com
- **App:** https://wesponde.com/app

## Documentation

- `CLAUDE.md` - Technical documentation for Claude Code
- `LAST_UPDATES.md` - Changelog and session notes
- `ROADMAP.md` - Feature roadmap and timeline
- `DEBUG_OAUTH_PAGES_EMPTY.md` - Instagram OAuth/Webhook debugging reference

## License

Proprietary - All rights reserved
