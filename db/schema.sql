-- PostgreSQL schema for the hosted service. All ratings are original user-entered values on a 0–99 scale.
create extension if not exists pgcrypto;
create type court_position as enum ('PG', 'SG', 'SF', 'PF', 'C');
create type lineup_role as enum ('starter', 'bench', 'inactive');

create table users (id uuid primary key default gen_random_uuid(), email text unique, display_name text, created_at timestamptz not null default now());
create table salary_caps (season text primary key, amount_usd integer not null check (amount_usd > 0), created_at timestamptz not null default now());
create table players (
  id uuid primary key default gen_random_uuid(), name text not null, initials varchar(4) not null, peak_season text not null, peak_team text,
  default_position court_position not null, salary_usd integer check (salary_usd >= 0), archetype text, bio text, accent varchar(16),
  three_point smallint not null check (three_point between 0 and 99), two_point smallint not null check (two_point between 0 and 99), rebounding smallint not null check (rebounding between 0 and 99), handling smallint not null check (handling between 0 and 99), passing smallint not null check (passing between 0 and 99), defense smallint not null check (defense between 0 and 99), defensive_iq smallint not null check (defensive_iq between 0 and 99), offensive_iq smallint not null check (offensive_iq between 0 and 99), speed smallint not null check (speed between 0 and 99), vertical smallint not null check (vertical between 0 and 99), strength smallint not null check (strength between 0 and 99), free_throw smallint not null check (free_throw between 0 and 99), steal smallint not null check (steal between 0 and 99), block smallint not null check (block between 0 and 99), stamina smallint not null check (stamina between 0 and 99), shot_tendency smallint not null check (shot_tendency between 0 and 99),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table lineups (id uuid primary key default gen_random_uuid(), owner_id uuid references users(id) on delete cascade, name text not null, description text not null default '', is_preset boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table lineup_players (lineup_id uuid references lineups(id) on delete cascade, player_id uuid references players(id), position court_position not null, role lineup_role not null default 'bench', sort_order smallint not null default 0, primary key (lineup_id, player_id));
create index lineup_players_lineup_idx on lineup_players(lineup_id);
create table simulations (id uuid primary key default gen_random_uuid(), home_lineup_id uuid not null references lineups(id), away_lineup_id uuid not null references lineups(id), random_seed bigint not null, home_score smallint not null, away_score smallint not null, engine_version text not null default 'v1', created_at timestamptz not null default now());
create table simulation_player_stats (simulation_id uuid references simulations(id) on delete cascade, player_id uuid references players(id), side varchar(4) not null check (side in ('home','away')), minutes smallint not null, points smallint not null, rebounds smallint not null, assists smallint not null, steals smallint not null, blocks smallint not null, fg_made smallint not null, fg_attempted smallint not null, three_made smallint not null, three_attempted smallint not null, primary key (simulation_id, player_id));

-- Enforce 5–15 members, unique starter positions, and 13 active players in the service layer or a deferred trigger.
