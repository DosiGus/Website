-- =============================================================================
-- Wesponde Database Schema
-- Multi-tenant SaaS for automating customer conversations
-- =============================================================================

-- =============================================================================
-- 1. ACCOUNTS & TEAM MODEL
-- =============================================================================

-- Tenant entity (Restaurant, Salon, Praxis)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  vertical text,  -- 'restaurant', 'salon', 'praxis'
  settings jsonb not null default '{}'::jsonb,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists accounts_slug_idx on public.accounts(slug);
alter table public.accounts enable row level security;

-- Team memberships with roles
create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz default now(),
  created_at timestamptz default now()
);

create unique index if not exists account_members_unique_idx on public.account_members(account_id, user_id);
create index if not exists account_members_user_id_idx on public.account_members(user_id);
create index if not exists account_members_account_id_idx on public.account_members(account_id);
alter table public.account_members enable row level security;

-- Helper function for RLS: returns all account_ids the current user belongs to
create or replace function public.user_account_ids()
returns setof uuid language sql security definer stable
set search_path = ''
as $$
  select account_id from public.account_members where user_id = auth.uid();
$$;

-- RLS: accounts
create policy "Mitglieder sehen ihren Account"
  on public.accounts for select
  using (id in (select public.user_account_ids()));

create policy "Owner duerfen Account bearbeiten"
  on public.accounts for update
  using (exists (
    select 1 from public.account_members
    where account_id = id and user_id = auth.uid() and role = 'owner'
  ));

create policy "Authentifizierte User erstellen Accounts"
  on public.accounts for insert
  with check (auth.uid() is not null);

-- RLS: account_members
create policy "Mitglieder sehen Mitglieder"
  on public.account_members for select
  using (account_id in (select public.user_account_ids()));

create policy "Admins verwalten Mitglieder"
  on public.account_members for insert
  with check (
    account_id in (
      select account_id from public.account_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Admins entfernen Mitglieder"
  on public.account_members for delete
  using (account_id in (
    select account_id from public.account_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- =============================================================================
-- 1.1 ACCOUNT BOOTSTRAP (AUTO-CREATE ON SIGNUP)
-- =============================================================================

create or replace function public.create_account_for_user(
  target_user_id uuid,
  target_email text,
  target_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_account_id uuid;
  account_name text;
  account_slug text;
begin
  select account_id into existing_account_id
  from public.account_members
  where user_id = target_user_id
  limit 1;

  if existing_account_id is not null then
    return existing_account_id;
  end if;

  account_slug := replace(target_user_id::text, '-', '');

  select id into existing_account_id
  from public.accounts
  where slug = account_slug
  limit 1;

  if existing_account_id is null then
    account_name := coalesce(
      nullif(target_meta->>'full_name', ''),
      nullif(target_meta->>'name', ''),
      nullif(split_part(target_email, '@', 1), ''),
      'Mein Betrieb'
    );

    insert into public.accounts (name, slug)
    values (account_name, account_slug)
    returning id into existing_account_id;
  end if;

  insert into public.account_members (account_id, user_id, role)
  values (existing_account_id, target_user_id, 'owner')
  on conflict (account_id, user_id) do nothing;

  return existing_account_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_account_for_user(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =============================================================================
-- 2. CONTACTS & CHANNELS
-- =============================================================================

-- End-customers / guests, trackable across conversations
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  display_name text,
  email text,
  phone text,
  notes text,
  tags text[] default '{}',
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists contacts_account_id_idx on public.contacts(account_id);
create index if not exists contacts_account_name_idx on public.contacts(account_id, display_name);
create index if not exists contacts_account_email_idx on public.contacts(account_id, email);
create index if not exists contacts_account_phone_idx on public.contacts(account_id, phone);
alter table public.contacts enable row level security;

create policy "Account-Mitglieder sehen Kontakte" on public.contacts
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Kontakte" on public.contacts
  for insert with check (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Kontakte" on public.contacts
  for update using (account_id in (select public.user_account_ids()))
  with check (account_id in (select public.user_account_ids()));

-- Channel identities (Instagram PSID, WhatsApp number, etc.)
create table if not exists public.contact_channels (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  channel text not null check (channel in ('instagram_dm', 'whatsapp', 'messenger', 'email', 'sms')),
  channel_identifier text not null,
  channel_username text,
  channel_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Unique per account + channel identifier (prevents duplicate contacts in same account)
create unique index if not exists contact_channels_account_identifier_idx
  on public.contact_channels(account_id, channel, channel_identifier);

alter table public.contact_channels enable row level security;

create policy "Account-Mitglieder sehen Kontakt-Kanaele" on public.contact_channels
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Kontakt-Kanaele" on public.contact_channels
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 3. FLOWS
-- =============================================================================

create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  status text not null default 'Entwurf',
  nodes jsonb not null,
  edges jsonb not null,
  triggers jsonb not null default '[]'::jsonb,
  metadata jsonb not null default jsonb_build_object('version', '1.0'),
  channels text[] not null default array['Instagram DM'],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.flows
  add constraint flows_user_fk
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

create index if not exists flows_user_id_idx on public.flows(user_id);
create index if not exists flows_account_id_idx on public.flows(account_id);

alter table public.flows enable row level security;

-- Legacy user_id policies
create policy "Flows sind nur fuer Besitzer sichtbar"
  on public.flows for select using (auth.uid() = user_id);
create policy "Besitzer duerfen Flows bearbeiten"
  on public.flows for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Besitzer duerfen Flows erstellen"
  on public.flows for insert with check (auth.uid() = user_id);

-- Account-based policies
create policy "Account-Mitglieder sehen Flows" on public.flows
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Flows" on public.flows
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Flows" on public.flows
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 4. FLOW TEMPLATES (system-wide, read-only)
-- =============================================================================

create table if not exists public.flow_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  vertical text not null,
  description text,
  nodes jsonb not null,
  edges jsonb not null,
  triggers jsonb not null default '[]'::jsonb,
  metadata jsonb not null default jsonb_build_object('version', '1.0'),
  created_at timestamptz default now()
);

alter table public.flow_templates enable row level security;

insert into public.flow_templates (slug, name, vertical, description, nodes, edges, triggers)
values
  (
    'restaurant-reservation',
    'Restaurant — Reservierung',
    'Restaurant & Bar',
    'Begruessung -> Datum/Uhrzeit -> Personenanzahl -> Bestaetigung',
    '[{"id":"start","type":"input","position":{"x":100,"y":60},"data":{"label":"Ciao! Moechtest du einen Tisch reservieren?","text":"Ciao! Moechtest du einen Tisch reservieren?","variant":"message","quickReplies":[]}},{"id":"ask-date","position":{"x":380,"y":20},"data":{"label":"An welchem Datum moechtest du kommen?","text":"An welchem Datum moechtest du kommen?","variant":"message","quickReplies":[]}},{"id":"ask-size","position":{"x":380,"y":120},"data":{"label":"Fuer wie viele Personen planst du?","text":"Fuer wie viele Personen planst du?","variant":"message","quickReplies":[]}},{"id":"confirm","position":{"x":640,"y":70},"data":{"label":"Danke! Wir bestaetigen dir die Reservierung gleich.","text":"Danke! Wir bestaetigen dir die Reservierung gleich.","variant":"message","quickReplies":[]}}]',
    '[{"id":"e1","source":"start","target":"ask-date"},{"id":"e2","source":"ask-date","target":"ask-size"},{"id":"e3","source":"ask-size","target":"confirm"}]',
    '[{"id":"trigger-restaurant","type":"KEYWORD","config":{"keywords":["reservierung","tisch","essen"],"matchType":"CONTAINS"},"startNodeId":"start"}]'
  ),
  (
    'salon-appointment',
    'Salon — Terminbuchung',
    'Friseur & Beauty',
    'Behandlung waehlen -> Stylist -> Terminoption -> Kontakt',
    '[{"id":"start","type":"input","position":{"x":80,"y":60},"data":{"label":"Hallo! Fuer welche Behandlung interessierst du dich?","text":"Hallo! Fuer welche Behandlung interessierst du dich?","variant":"message","quickReplies":[]}},{"id":"stylist","position":{"x":340,"y":40},"data":{"label":"Hast du eine bevorzugte Stylistin?","text":"Hast du eine bevorzugte Stylistin?","variant":"choice","quickReplies":[]}},{"id":"slot","position":{"x":340,"y":150},"data":{"label":"Wir haetten Dienstag 15 Uhr oder Donnerstag 11 Uhr frei.","text":"Wir haetten Dienstag 15 Uhr oder Donnerstag 11 Uhr frei.","variant":"message","quickReplies":[]}},{"id":"contact","position":{"x":620,"y":90},"data":{"label":"Danke! Wie erreichen wir dich fuer die Bestaetigung?","text":"Danke! Wie erreichen wir dich fuer die Bestaetigung?","variant":"message","quickReplies":[]}}]',
    '[{"id":"e1","source":"start","target":"stylist"},{"id":"e2","source":"stylist","target":"slot"},{"id":"e3","source":"slot","target":"contact"}]',
    '[{"id":"trigger-salon","type":"KEYWORD","config":{"keywords":["termin","friseur","styling"],"matchType":"CONTAINS"},"startNodeId":"start"}]'
  ),
  (
    'medical-intake',
    'Praxis — Intake',
    'Medizin & Praxis',
    'Anliegen -> Dringlichkeit -> Terminoption -> Kontakt',
    '[{"id":"start","type":"input","position":{"x":90,"y":70},"data":{"label":"Willkommen in unserer Praxis! Worum geht es bei dir?","text":"Willkommen in unserer Praxis! Worum geht es bei dir?","variant":"message","quickReplies":[]}},{"id":"urgency","position":{"x":360,"y":30},"data":{"label":"Wie dringend ist dein Anliegen?","text":"Wie dringend ist dein Anliegen?","variant":"choice","quickReplies":[]}},{"id":"availability","position":{"x":360,"y":140},"data":{"label":"Wir melden uns mit dem naechsten freien Termin.","text":"Wir melden uns mit dem naechsten freien Termin.","variant":"message","quickReplies":[]}},{"id":"contact","position":{"x":600,"y":80},"data":{"label":"Bitte gib uns deine Telefonnummer oder E-Mail.","text":"Bitte gib uns deine Telefonnummer oder E-Mail.","variant":"message","quickReplies":[]}}]',
    '[{"id":"e1","source":"start","target":"urgency"},{"id":"e2","source":"urgency","target":"availability"},{"id":"e3","source":"availability","target":"contact"}]',
    '[{"id":"trigger-medical","type":"KEYWORD","config":{"keywords":["termin","arzt","sprechstunde"],"matchType":"CONTAINS"},"startNodeId":"start"}]'
  )
on conflict (slug) do nothing;

-- =============================================================================
-- 5. INTEGRATIONS (Meta/Instagram, WhatsApp, etc.)
-- =============================================================================

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  provider text not null,
  channel text default 'instagram_dm',
  status text not null default 'disconnected',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  page_id text,
  instagram_id text,
  instagram_username text,
  account_name text,
  google_review_url text,
  calendar_id text,
  calendar_time_zone text,
  facebook_user_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.integrations
  add constraint integrations_user_fk
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

create index if not exists integrations_user_id_idx on public.integrations(user_id);
create index if not exists integrations_account_id_idx on public.integrations(account_id);
create index if not exists integrations_facebook_user_id_idx on public.integrations(facebook_user_id);
create index if not exists integrations_instagram_id_idx on public.integrations(instagram_id);
create unique index if not exists integrations_user_provider_idx
  on public.integrations(user_id, provider);

alter table public.integrations enable row level security;

-- Legacy user_id policies
create policy "Integrationen nur fuer Besitzer sichtbar"
  on public.integrations for select using (auth.uid() = user_id);
create policy "Besitzer duerfen Integrationen bearbeiten"
  on public.integrations for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Besitzer duerfen Integrationen erstellen"
  on public.integrations for insert with check (auth.uid() = user_id);

-- Account-based policies
create policy "Account-Mitglieder sehen Integrationen" on public.integrations
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Integrationen" on public.integrations
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Integrationen" on public.integrations
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 6. OAUTH STATES (server-only, temporary)
-- =============================================================================

create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid references public.accounts(id) on delete cascade,
  state text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists oauth_states_state_idx on public.oauth_states(state);
alter table public.oauth_states enable row level security;

-- =============================================================================
-- 7. CONVERSATIONS
-- =============================================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  instagram_sender_id text not null,
  channel text default 'instagram_dm',
  channel_sender_id text,
  current_flow_id uuid references public.flows(id) on delete set null,
  current_node_id text,
  status text not null default 'active' check (status in ('active', 'closed', 'paused')),
  metadata jsonb default '{}'::jsonb,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversations_account_id_idx on public.conversations(account_id);
create index if not exists conversations_integration_id_idx on public.conversations(integration_id);
create index if not exists conversations_instagram_sender_id_idx on public.conversations(instagram_sender_id);
create index if not exists conversations_contact_id_idx on public.conversations(contact_id);
create index if not exists conversations_channel_idx on public.conversations(channel);
create unique index if not exists conversations_integration_sender_idx
  on public.conversations(integration_id, instagram_sender_id);
create index if not exists conversations_metadata_idx
  on public.conversations using gin(metadata);

alter table public.conversations enable row level security;

-- Legacy user_id policies
create policy "Conversations sind nur fuer Besitzer sichtbar"
  on public.conversations for select using (auth.uid() = user_id);
create policy "Besitzer duerfen Conversations bearbeiten"
  on public.conversations for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Besitzer duerfen Conversations erstellen"
  on public.conversations for insert with check (auth.uid() = user_id);

-- Account-based policies
create policy "Account-Mitglieder sehen Conversations" on public.conversations
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Conversations" on public.conversations
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Conversations" on public.conversations
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 8. MESSAGES
-- =============================================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('incoming', 'outgoing')),
  message_type text not null default 'text' check (message_type in ('text', 'quick_reply', 'image')),
  content text,
  quick_reply_payload text,
  instagram_message_id text,
  channel_message_id text,
  flow_id uuid references public.flows(id) on delete set null,
  node_id text,
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_instagram_message_id_idx on public.messages(instagram_message_id);
create unique index if not exists messages_instagram_message_id_unique
  on public.messages(instagram_message_id)
  where instagram_message_id is not null;
create index if not exists messages_channel_message_id_idx on public.messages(channel_message_id);
create index if not exists messages_sent_at_idx on public.messages(sent_at desc);

alter table public.messages enable row level security;

create policy "Messages sind nur fuer Conversation-Besitzer sichtbar"
  on public.messages for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Messages duerfen nur von Conversation-Besitzern erstellt werden"
  on public.messages for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8b. MESSAGE FAILURES (Dead-letter)
-- =============================================================================

create table if not exists public.message_failures (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  provider text not null default 'meta',
  direction text not null default 'outgoing',
  message_type text not null default 'text',
  recipient_id text,
  content text,
  quick_replies jsonb,
  error_code integer,
  error_message text not null,
  retryable boolean default false,
  attempts integer,
  flow_id uuid references public.flows(id) on delete set null,
  node_id text,
  created_at timestamptz default now()
);

create index if not exists message_failures_integration_id_idx on public.message_failures(integration_id);
create index if not exists message_failures_conversation_id_idx on public.message_failures(conversation_id);
create index if not exists message_failures_created_at_idx on public.message_failures(created_at desc);

-- =============================================================================
-- 8c. INTEGRATION ALERTS (Email throttle)
-- =============================================================================

create table if not exists public.integration_alerts (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  alert_type text not null,
  message text,
  sent_at timestamptz default now()
);

create index if not exists integration_alerts_integration_id_idx on public.integration_alerts(integration_id);
create index if not exists integration_alerts_account_id_idx on public.integration_alerts(account_id);
create index if not exists integration_alerts_sent_at_idx on public.integration_alerts(sent_at desc);

-- =============================================================================
-- 9. RESERVATIONS
-- =============================================================================

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  flow_id uuid references public.flows(id) on delete set null,

  -- Guest data
  guest_name text not null,
  reservation_date date not null,
  reservation_time time not null,
  guest_count integer not null default 2 check (guest_count > 0),
  phone_number text,
  email text,
  special_requests text,
  google_calendar_id text,
  google_event_id text,
  google_event_link text,
  google_time_zone text,

  -- Status management
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confirmed_at timestamptz,

  -- Source tracking
  source text default 'instagram_dm',
  instagram_sender_id text
);

create index if not exists reservations_user_id_idx on public.reservations(user_id);
create index if not exists reservations_account_id_idx on public.reservations(account_id);
create index if not exists reservations_date_idx on public.reservations(reservation_date);
create index if not exists reservations_status_idx on public.reservations(status);
create index if not exists reservations_conversation_idx on public.reservations(conversation_id);
create index if not exists reservations_contact_id_idx on public.reservations(contact_id);
create index if not exists reservations_user_date_idx on public.reservations(user_id, reservation_date);

alter table public.reservations enable row level security;

-- Legacy user_id policies
create policy "Reservations sind nur fuer Besitzer sichtbar"
  on public.reservations for select using (auth.uid() = user_id);
create policy "Besitzer duerfen Reservations bearbeiten"
  on public.reservations for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Besitzer duerfen Reservations erstellen"
  on public.reservations for insert with check (auth.uid() = user_id);
create policy "Besitzer duerfen Reservations loeschen"
  on public.reservations for delete using (auth.uid() = user_id);

-- Account-based policies
create policy "Account-Mitglieder sehen Reservations" on public.reservations
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Reservations" on public.reservations
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Reservations" on public.reservations
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 9. FLOW SUBMISSIONS (universal flow outputs)
-- =============================================================================

-- =============================================================================
-- 8.1 CALENDAR AVAILABILITY CACHE
-- =============================================================================

create table if not exists public.calendar_availability_cache (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  calendar_id text not null,
  time_min timestamptz not null,
  time_max timestamptz not null,
  time_zone text not null,
  busy jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists calendar_availability_cache_unique_idx
  on public.calendar_availability_cache(account_id, calendar_id, time_min, time_max, time_zone);
create index if not exists calendar_availability_cache_account_idx
  on public.calendar_availability_cache(account_id);
create index if not exists calendar_availability_cache_expires_idx
  on public.calendar_availability_cache(expires_at);

alter table public.calendar_availability_cache enable row level security;

create policy "Account-Mitglieder sehen Calendar Cache" on public.calendar_availability_cache
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Calendar Cache" on public.calendar_availability_cache
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Calendar Cache" on public.calendar_availability_cache
  for insert with check (account_id in (select public.user_account_ids()));


create table if not exists public.flow_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  flow_id uuid references public.flows(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  integration_id uuid references public.integrations(id) on delete set null,

  status text not null default 'completed'
    check (status in ('pending', 'completed', 'incomplete')),
  data jsonb not null default '{}'::jsonb,
  missing_fields text[] default '{}'::text[],

  source text default 'instagram_dm',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists flow_submissions_user_id_idx on public.flow_submissions(user_id);
create index if not exists flow_submissions_account_id_idx on public.flow_submissions(account_id);
create index if not exists flow_submissions_flow_id_idx on public.flow_submissions(flow_id);
create index if not exists flow_submissions_conversation_id_idx on public.flow_submissions(conversation_id);
create index if not exists flow_submissions_contact_id_idx on public.flow_submissions(contact_id);

alter table public.flow_submissions enable row level security;

-- Legacy user_id policies
create policy "Flow Submissions sind nur fuer Besitzer sichtbar"
  on public.flow_submissions for select using (auth.uid() = user_id);
create policy "Besitzer duerfen Flow Submissions bearbeiten"
  on public.flow_submissions for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Besitzer duerfen Flow Submissions erstellen"
  on public.flow_submissions for insert with check (auth.uid() = user_id);
create policy "Besitzer duerfen Flow Submissions loeschen"
  on public.flow_submissions for delete using (auth.uid() = user_id);

-- Account-based policies
create policy "Account-Mitglieder sehen Flow Submissions" on public.flow_submissions
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Flow Submissions" on public.flow_submissions
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Flow Submissions" on public.flow_submissions
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 10. REVIEW REQUESTS
-- =============================================================================

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  integration_id uuid references public.integrations(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  flow_id uuid references public.flows(id) on delete set null,

  status text not null default 'pending'
    check (status in ('pending', 'sent', 'rated', 'completed', 'skipped', 'failed')),
  rating smallint check (rating between 1 and 5),
  feedback_text text,

  sent_at timestamptz,
  rated_at timestamptz,
  feedback_at timestamptz,
  source text default 'instagram_dm',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists review_requests_reservation_idx on public.review_requests(reservation_id);
create index if not exists review_requests_user_id_idx on public.review_requests(user_id);
create index if not exists review_requests_account_id_idx on public.review_requests(account_id);
create index if not exists review_requests_status_idx on public.review_requests(status);
create index if not exists review_requests_sent_at_idx on public.review_requests(sent_at);

alter table public.review_requests enable row level security;

-- Legacy user_id policies
create policy "Review Requests sind nur fuer Besitzer sichtbar"
  on public.review_requests for select using (auth.uid() = user_id);
create policy "Besitzer duerfen Review Requests erstellen"
  on public.review_requests for insert with check (auth.uid() = user_id);
create policy "Besitzer duerfen Review Requests bearbeiten"
  on public.review_requests for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Account-based policies
create policy "Account-Mitglieder sehen Review Requests" on public.review_requests
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Review Requests" on public.review_requests
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Review Requests" on public.review_requests
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 11. LOGS
-- =============================================================================

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  source text not null,
  message text not null,
  user_id uuid references auth.users(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,  -- nullable for system logs
  metadata jsonb default '{}'::jsonb,
  request_id text,
  duration_ms integer
);

create index if not exists logs_created_at_idx on public.logs(created_at desc);
create index if not exists logs_level_idx on public.logs(level);
create index if not exists logs_source_idx on public.logs(source);
create index if not exists logs_user_id_idx on public.logs(user_id);
create index if not exists logs_account_id_idx on public.logs(account_id);
create index if not exists logs_request_id_idx on public.logs(request_id);

alter table public.logs enable row level security;

-- Account-based policies
create policy "Account-Mitglieder sehen Logs" on public.logs
  for select using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder bearbeiten Logs" on public.logs
  for update using (account_id in (select public.user_account_ids()));
create policy "Account-Mitglieder erstellen Logs" on public.logs
  for insert with check (account_id in (select public.user_account_ids()));

-- =============================================================================
-- 12. CLEANUP FUNCTIONS
-- =============================================================================

-- Remove expired OAuth states (run periodically)
create or replace function public.cleanup_expired_oauth_states()
returns void language sql
set search_path = ''
as $$
  delete from public.oauth_states where expires_at < now() - interval '1 hour';
$$;

-- Remove old logs (90-day retention, run periodically)
create or replace function public.cleanup_old_logs()
returns void language sql
set search_path = ''
as $$
  delete from public.logs where created_at < now() - interval '90 days';
$$;
