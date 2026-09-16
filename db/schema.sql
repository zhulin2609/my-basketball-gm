-- PostgreSQL schema for the hosted service. All ratings are original user-entered values on a 0–99 scale.
create extension if not exists pgcrypto;
create type court_position as enum ('PG', 'SG', 'SF', 'PF', 'C');
create type lineup_role as enum ('starter', 'bench', 'inactive');

create table users (id uuid primary key default gen_random_uuid(), email text unique, display_name text, created_at timestamptz not null default now());
create table salary_caps (season text primary key, amount_usd integer not null check (amount_usd > 0), created_at timestamptz not null default now());
create table players (
  id uuid primary key default gen_random_uuid(), owner_id uuid references users(id) on delete cascade, is_custom boolean not null default false,
  catalog_key text unique,
  name text not null, initials varchar(4) not null, peak_season text not null, peak_team text,
  default_position court_position not null, height_feet smallint not null check (height_feet between 4 and 8), height_inches smallint not null check (height_inches between 0 and 11), weight_lbs smallint not null check (weight_lbs between 80 and 500), salary_usd integer check (salary_usd >= 0), archetype text, bio text, accent varchar(16),
  three_point smallint not null check (three_point between 0 and 99), layup smallint not null check (layup between 0 and 99), mid_range smallint not null check (mid_range between 0 and 99), inside_scoring smallint not null check (inside_scoring between 0 and 99), dunk smallint not null check (dunk between 0 and 99), offensive_rebound smallint not null check (offensive_rebound between 0 and 99), defensive_rebound smallint not null check (defensive_rebound between 0 and 99), handling smallint not null check (handling between 0 and 99), passing smallint not null check (passing between 0 and 99), defensive_iq smallint not null check (defensive_iq between 0 and 99), offensive_iq smallint not null check (offensive_iq between 0 and 99), speed smallint not null check (speed between 0 and 99), agility smallint not null check (agility between 0 and 99), vertical smallint not null check (vertical between 0 and 99), strength smallint not null check (strength between 0 and 99), free_throw smallint not null check (free_throw between 0 and 99), steal smallint not null check (steal between 0 and 99), block smallint not null check (block between 0 and 99), stamina smallint not null check (stamina between 0 and 99), shot_tendency smallint not null check (shot_tendency between 0 and 99),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint players_owner_consistency check (
    (is_custom and owner_id is not null) or (not is_custom and owner_id is null)
  )
);
create index players_owner_idx on players(owner_id) where is_custom;
create unique index players_catalog_key_idx on players(catalog_key) where catalog_key is not null;
-- 预置球员属于公共目录；用户调节其属性时写入此表，读取 /players 时按当前用户合并。
create table player_overrides (
  owner_id uuid not null references users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  name text not null, initials varchar(4) not null, peak_season text not null, peak_team text,
  default_position court_position not null, height_feet smallint not null check (height_feet between 4 and 8), height_inches smallint not null check (height_inches between 0 and 11), weight_lbs smallint not null check (weight_lbs between 80 and 500), salary_usd integer check (salary_usd >= 0), archetype text, bio text, accent varchar(16),
  three_point smallint not null check (three_point between 0 and 99), layup smallint not null check (layup between 0 and 99), mid_range smallint not null check (mid_range between 0 and 99), inside_scoring smallint not null check (inside_scoring between 0 and 99), dunk smallint not null check (dunk between 0 and 99), offensive_rebound smallint not null check (offensive_rebound between 0 and 99), defensive_rebound smallint not null check (defensive_rebound between 0 and 99), handling smallint not null check (handling between 0 and 99), passing smallint not null check (passing between 0 and 99), defensive_iq smallint not null check (defensive_iq between 0 and 99), offensive_iq smallint not null check (offensive_iq between 0 and 99), speed smallint not null check (speed between 0 and 99), agility smallint not null check (agility between 0 and 99), vertical smallint not null check (vertical between 0 and 99), strength smallint not null check (strength between 0 and 99), free_throw smallint not null check (free_throw between 0 and 99), steal smallint not null check (steal between 0 and 99), block smallint not null check (block between 0 and 99), stamina smallint not null check (stamina between 0 and 99), shot_tendency smallint not null check (shot_tendency between 0 and 99),
  updated_at timestamptz not null default now(),
  primary key (owner_id, player_id)
);
create index player_overrides_player_idx on player_overrides(player_id);
create table lineups (id uuid primary key default gen_random_uuid(), owner_id uuid references users(id) on delete cascade, client_key text not null, name text not null, description text not null default '', is_preset boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, client_key));
create index lineups_owner_updated_idx on lineups(owner_id, updated_at desc);
create table lineup_players (lineup_id uuid references lineups(id) on delete cascade, player_id uuid references players(id), position court_position not null, role lineup_role not null default 'bench', sort_order smallint not null default 0, primary key (lineup_id, player_id));
create index lineup_players_lineup_idx on lineup_players(lineup_id);
create table simulations (id uuid primary key default gen_random_uuid(), owner_id uuid not null references users(id) on delete cascade, home_lineup_id uuid not null references lineups(id), away_lineup_id uuid not null references lineups(id), home_lineup_name text not null, away_lineup_name text not null, random_seed bigint not null, home_score smallint not null, away_score smallint not null, engine_version text not null default 'v1', created_at timestamptz not null default now(), expires_at timestamptz not null default (now() + interval '30 days'), constraint simulations_retention_window_check check (expires_at > created_at and expires_at <= created_at + interval '30 days'));
create index simulations_owner_created_idx on simulations(owner_id, created_at desc);
create index simulations_expires_at_idx on simulations(expires_at);
create table simulation_player_stats (simulation_id uuid references simulations(id) on delete cascade, player_id uuid references players(id), side varchar(4) not null check (side in ('home','away')), player_name text not null, player_initials varchar(4) not null, player_accent varchar(16) not null, minutes smallint not null, points smallint not null, rebounds smallint not null, assists smallint not null, steals smallint not null, blocks smallint not null, fg_made smallint not null, fg_attempted smallint not null, three_made smallint not null, three_attempted smallint not null, primary key (simulation_id, side, player_id));

-- Enforce 5–15 members, unique starter positions, and 13 active players in the service layer or a deferred trigger.
