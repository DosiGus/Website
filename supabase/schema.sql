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

-- Templates available for new flows
create table if not exists public.flow_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  vertical text not null,
  description text,
  nodes jsonb not null,
  edges jsonb not null,
  created_at timestamptz default now()
);

insert into public.flow_templates (slug, name, vertical, description, nodes, edges)
values
  (
    'restaurant-reservation',
    'Restaurant — Reservierung',
    'Restaurant & Bar',
    'Begrüßung → Datum/Uhrzeit → Personenanzahl → Bestätigung',
    '[{"id":"start","type":"input","position":{"x":100,"y":60},"data":{"label":"Ciao! Möchtest du einen Tisch reservieren?","variant":"message"}},{"id":"ask-date","position":{"x":380,"y":20},"data":{"label":"An welchem Datum möchtest du kommen?","variant":"message"}},{"id":"ask-size","position":{"x":380,"y":120},"data":{"label":"Für wie viele Personen planst du?","variant":"message"}},{"id":"confirm","position":{"x":640,"y":70},"data":{"label":"Danke! Wir bestätigen dir die Reservierung gleich.","variant":"message"}}]',
    '[{"id":"e1","source":"start","target":"ask-date"},{"id":"e2","source":"ask-date","target":"ask-size"},{"id":"e3","source":"ask-size","target":"confirm"}]'
  ),
  (
    'salon-appointment',
    'Salon — Terminbuchung',
    'Friseur & Beauty',
    'Behandlung wählen → Stylist → Terminoption → Kontakt',
    '[{"id":"start","type":"input","position":{"x":80,"y":60},"data":{"label":"Hallo! Für welche Behandlung interessierst du dich?","variant":"message"}},{"id":"stylist","position":{"x":340,"y":40},"data":{"label":"Hast du eine bevorzugte Stylistin?","variant":"choice"}},{"id":"slot","position":{"x":340,"y":150},"data":{"label":"Wir hätten Dienstag 15 Uhr oder Donnerstag 11 Uhr frei.","variant":"message"}},{"id":"contact","position":{"x":620,"y":90},"data":{"label":"Danke! Wie erreichen wir dich für die Bestätigung?","variant":"message"}}]',
    '[{"id":"e1","source":"start","target":"stylist"},{"id":"e2","source":"stylist","target":"slot"},{"id":"e3","source":"slot","target":"contact"}]'
  ),
  (
    'medical-intake',
    'Praxis — Intake',
    'Medizin & Praxis',
    'Anliegen → Dringlichkeit → Terminoption → Kontakt',
    '[{"id":"start","type":"input","position":{"x":90,"y":70},"data":{"label":"Willkommen in unserer Praxis! Worum geht es bei dir?","variant":"message"}},{"id":"urgency","position":{"x":360,"y":30},"data":{"label":"Wie dringend ist dein Anliegen?","variant":"choice"}},{"id":"availability","position":{"x":360,"y":140},"data":{"label":"Wir melden uns mit dem nächsten freien Termin.","variant":"message"}},{"id":"contact","position":{"x":600,"y":80},"data":{"label":"Bitte gib uns deine Telefonnummer oder E-Mail.","variant":"message"}}]',
    '[{"id":"e1","source":"start","target":"urgency"},{"id":"e2","source":"urgency","target":"availability"},{"id":"e3","source":"availability","target":"contact"}]'
  )
on conflict (slug) do nothing;
