-- Run this in your Supabase SQL editor to set up the database.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists expansions (
  code             text primary key,
  name             text not null,
  symbol_url       text,
  regulation_mark  text
);

create table if not exists cards (
  id               serial primary key,
  card_id          text unique not null,
  expansion_code   text references expansions(code),
  collector_number text,
  name             text not null,
  stage            text,          -- 基礎 | 1進化 | 2進化 | null (trainer/energy)
  evolves_from     text,          -- pre-evolution name, nullable
  dex_number       int,
  species          text,
  hp               int,
  type             text,
  attacks          jsonb,
  weakness         jsonb,
  resistance       jsonb,
  retreat_cost     int,
  image_url        text,
  height           text,
  weight           text,
  flavor_text      text,
  illustrator      text,
  regulation_mark  text
);

create index if not exists cards_dex_number_idx on cards(dex_number);
create index if not exists cards_expansion_code_idx on cards(expansion_code);

create table if not exists user_collections (
  id              serial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  card_id         text not null references cards(card_id) on delete cascade,
  quantity_owned  int not null default 0,
  want            boolean not null default false,
  unique(user_id, card_id)
);

create index if not exists user_collections_user_id_idx on user_collections(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table expansions enable row level security;
alter table cards enable row level security;
alter table user_collections enable row level security;

-- Public read for cards and expansions
create policy "Public read expansions" on expansions
  for select using (true);

create policy "Public read cards" on cards
  for select using (true);

-- user_collections: each user owns their own rows
create policy "Users manage own collection" on user_collections
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
