-- Table for storing Wesponde flows
create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
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

alter table if exists public.flows
  add column if not exists triggers jsonb not null default '[]'::jsonb;

alter table if exists public.flows
  add column if not exists metadata jsonb not null default jsonb_build_object('version', '1.0');

alter table public.flows enable row level security;

create policy "Flows sind nur für Besitzer sichtbar"
  on public.flows
  for select using (auth.uid() = user_id);

create policy "Besitzer dürfen Flows bearbeiten"
  on public.flows
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Besitzer dürfen Flows erstellen"
  on public.flows
  for insert with check (auth.uid() = user_id);

-- Helpful index for ordering
create index if not exists flows_user_id_idx on public.flows(user_id);

-- Templates available for new flows
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

alter table if exists public.flow_templates
  add column if not exists triggers jsonb not null default '[]'::jsonb;

alter table if exists public.flow_templates
  add column if not exists metadata jsonb not null default jsonb_build_object('version', '1.0');

insert into public.flow_templates (slug, name, vertical, description, nodes, edges, triggers)
values
  (
    'restaurant-reservation',
    'Restaurant — Reservierung',
    'Restaurant & Bar',
    'Begrüßung → Datum/Uhrzeit → Personenanzahl → Bestätigung',
    '[{"id":"start","type":"input","position":{"x":100,"y":60},"data":{"label":"Ciao! Möchtest du einen Tisch reservieren?","text":"Ciao! Möchtest du einen Tisch reservieren?","variant":"message","quickReplies":[]}},{"id":"ask-date","position":{"x":380,"y":20},"data":{"label":"An welchem Datum möchtest du kommen?","text":"An welchem Datum möchtest du kommen?","variant":"message","quickReplies":[]}},{"id":"ask-size","position":{"x":380,"y":120},"data":{"label":"Für wie viele Personen planst du?","text":"Für wie viele Personen planst du?","variant":"message","quickReplies":[]}},{"id":"confirm","position":{"x":640,"y":70},"data":{"label":"Danke! Wir bestätigen dir die Reservierung gleich.","text":"Danke! Wir bestätigen dir die Reservierung gleich.","variant":"message","quickReplies":[]}}]',
    '[{"id":"e1","source":"start","target":"ask-date"},{"id":"e2","source":"ask-date","target":"ask-size"},{"id":"e3","source":"ask-size","target":"confirm"}]',
    '[{"id":"trigger-restaurant","type":"KEYWORD","config":{"keywords":["reservierung","tisch","essen"],"matchType":"CONTAINS"},"startNodeId":"start"}]'
  ),
  (
    'salon-appointment',
    'Salon — Terminbuchung',
    'Friseur & Beauty',
    'Behandlung wählen → Stylist → Terminoption → Kontakt',
    '[{"id":"start","type":"input","position":{"x":80,"y":60},"data":{"label":"Hallo! Für welche Behandlung interessierst du dich?","text":"Hallo! Für welche Behandlung interessierst du dich?","variant":"message","quickReplies":[]}},{"id":"stylist","position":{"x":340,"y":40},"data":{"label":"Hast du eine bevorzugte Stylistin?","text":"Hast du eine bevorzugte Stylistin?","variant":"choice","quickReplies":[]}},{"id":"slot","position":{"x":340,"y":150},"data":{"label":"Wir hätten Dienstag 15 Uhr oder Donnerstag 11 Uhr frei.","text":"Wir hätten Dienstag 15 Uhr oder Donnerstag 11 Uhr frei.","variant":"message","quickReplies":[]}},{"id":"contact","position":{"x":620,"y":90},"data":{"label":"Danke! Wie erreichen wir dich für die Bestätigung?","text":"Danke! Wie erreichen wir dich für die Bestätigung?","variant":"message","quickReplies":[]}}]',
    '[{"id":"e1","source":"start","target":"stylist"},{"id":"e2","source":"stylist","target":"slot"},{"id":"e3","source":"slot","target":"contact"}]',
    '[{"id":"trigger-salon","type":"KEYWORD","config":{"keywords":["termin","friseur","styling"],"matchType":"CONTAINS"},"startNodeId":"start"}]'
  ),
  (
    'medical-intake',
    'Praxis — Intake',
    'Medizin & Praxis',
    'Anliegen → Dringlichkeit → Terminoption → Kontakt',
    '[{"id":"start","type":"input","position":{"x":90,"y":70},"data":{"label":"Willkommen in unserer Praxis! Worum geht es bei dir?","text":"Willkommen in unserer Praxis! Worum geht es bei dir?","variant":"message","quickReplies":[]}},{"id":"urgency","position":{"x":360,"y":30},"data":{"label":"Wie dringend ist dein Anliegen?","text":"Wie dringend ist dein Anliegen?","variant":"choice","quickReplies":[]}},{"id":"availability","position":{"x":360,"y":140},"data":{"label":"Wir melden uns mit dem nächsten freien Termin.","text":"Wir melden uns mit dem nächsten freien Termin.","variant":"message","quickReplies":[]}},{"id":"contact","position":{"x":600,"y":80},"data":{"label":"Bitte gib uns deine Telefonnummer oder E-Mail.","text":"Bitte gib uns deine Telefonnummer oder E-Mail.","variant":"message","quickReplies":[]}}]',
    '[{"id":"e1","source":"start","target":"urgency"},{"id":"e2","source":"urgency","target":"availability"},{"id":"e3","source":"availability","target":"contact"}]',
    '[{"id":"trigger-medical","type":"KEYWORD","config":{"keywords":["termin","arzt","sprechstunde"],"matchType":"CONTAINS"},"startNodeId":"start"}]'
  )
on conflict (slug) do nothing;

-- Meta/Instagram integrations
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,
  status text not null default 'disconnected',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  page_id text,
  instagram_id text,
  account_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.integrations
  add constraint integrations_user_fk
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

alter table public.integrations enable row level security;

create policy "Integrationen nur für Besitzer sichtbar"
  on public.integrations
  for select using (auth.uid() = user_id);

create policy "Besitzer dürfen Integrationen bearbeiten"
  on public.integrations
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Besitzer dürfen Integrationen erstellen"
  on public.integrations
  for insert with check (auth.uid() = user_id);

create index if not exists integrations_user_id_idx on public.integrations(user_id);
create unique index if not exists integrations_user_provider_idx
  on public.integrations(user_id, provider);

-- OAuth state store (server-only usage)
create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  state text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists oauth_states_state_idx on public.oauth_states(state);

-- Logging table for debugging and monitoring
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  source text not null,
  message text not null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  request_id text,
  duration_ms integer
);

create index if not exists logs_created_at_idx on public.logs(created_at desc);
create index if not exists logs_level_idx on public.logs(level);
create index if not exists logs_source_idx on public.logs(source);
create index if not exists logs_user_id_idx on public.logs(user_id);
create index if not exists logs_request_id_idx on public.logs(request_id);

alter table public.logs enable row level security;

-- Conversations table for tracking customer conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  instagram_sender_id text not null,
  current_flow_id uuid references public.flows(id) on delete set null,
  current_node_id text,
  status text not null default 'active' check (status in ('active', 'closed', 'paused')),
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversations_integration_id_idx on public.conversations(integration_id);
create index if not exists conversations_instagram_sender_id_idx on public.conversations(instagram_sender_id);
create unique index if not exists conversations_integration_sender_idx
  on public.conversations(integration_id, instagram_sender_id);

alter table public.conversations enable row level security;

create policy "Conversations sind nur für Besitzer sichtbar"
  on public.conversations
  for select using (auth.uid() = user_id);

create policy "Besitzer dürfen Conversations bearbeiten"
  on public.conversations
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Besitzer dürfen Conversations erstellen"
  on public.conversations
  for insert with check (auth.uid() = user_id);

-- Messages table for storing incoming/outgoing messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('incoming', 'outgoing')),
  message_type text not null default 'text' check (message_type in ('text', 'quick_reply', 'image')),
  content text,
  quick_reply_payload text,
  instagram_message_id text,
  flow_id uuid references public.flows(id) on delete set null,
  node_id text,
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_instagram_message_id_idx on public.messages(instagram_message_id);
create index if not exists messages_sent_at_idx on public.messages(sent_at desc);

alter table public.messages enable row level security;

create policy "Messages sind nur für Conversation-Besitzer sichtbar"
  on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Messages dürfen nur von Conversation-Besitzern erstellt werden"
  on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
