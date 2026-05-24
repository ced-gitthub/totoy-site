-- Run this in your Supabase project → SQL Editor
-- Creates the 3 tables needed for the Marketplace CRM

create table listings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  buy_price   numeric default 0,
  ask_price   numeric default 0,
  status      text default 'active',   -- active | paused | sold
  source_seller text,
  notes       text
);

create table leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  buyer_name  text not null,
  item_name   text,
  status      text default 'new',      -- new | negotiating | closed | lost
  final_price numeric default 0,
  notes       text
);

create table sellers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  rating      integer default 5,
  specialty   text,
  contact     text,
  notes       text
);

-- Allow public read/write (fine for a personal app, no login needed)
alter table listings enable row level security;
alter table leads    enable row level security;
alter table sellers  enable row level security;

create policy "Public access" on listings for all using (true) with check (true);
create policy "Public access" on leads    for all using (true) with check (true);
create policy "Public access" on sellers  for all using (true) with check (true);
