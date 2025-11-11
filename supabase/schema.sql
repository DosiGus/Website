-- Table for storing Wesponde flows
create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  status text not null default 'Entwurf',
  nodes jsonb not null,
  edges jsonb not null,
  channels text[] not null default array['Instagram DM'],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.flows
  add constraint flows_user_fk
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

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
