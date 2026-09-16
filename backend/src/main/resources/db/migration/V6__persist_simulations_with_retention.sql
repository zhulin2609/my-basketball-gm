-- Cloud reports belong to one user, retain display snapshots, and expire after at most 30 days.
alter table simulations add column owner_id uuid references users(id) on delete cascade;
alter table simulations add column home_lineup_name text;
alter table simulations add column away_lineup_name text;
alter table simulations add column expires_at timestamptz;

update simulations simulation
set owner_id = home.owner_id,
    home_lineup_name = home.name,
    away_lineup_name = away.name,
    expires_at = simulation.created_at + interval '30 days'
from lineups home, lineups away
where home.id = simulation.home_lineup_id
  and away.id = simulation.away_lineup_id;

-- Legacy rows without an owner cannot be exposed safely and have no useful ownership boundary.
delete from simulations where owner_id is null;

alter table simulations alter column owner_id set not null;
alter table simulations alter column home_lineup_name set not null;
alter table simulations alter column away_lineup_name set not null;
alter table simulations alter column expires_at set not null;
alter table simulations add constraint simulations_retention_window_check
  check (expires_at > created_at and expires_at <= created_at + interval '30 days');

create index simulations_owner_created_idx on simulations(owner_id, created_at desc);
create index simulations_expires_at_idx on simulations(expires_at);

-- One historical game may use the same player on both sides, so side is part of the key.
alter table simulation_player_stats drop constraint simulation_player_stats_pkey;
alter table simulation_player_stats add column player_name text;
alter table simulation_player_stats add column player_initials varchar(4);
alter table simulation_player_stats add column player_accent varchar(16);

update simulation_player_stats stat
set player_name = player.name,
    player_initials = player.initials,
    player_accent = coalesce(player.accent, '#777')
from players player
where player.id = stat.player_id;

alter table simulation_player_stats alter column player_name set not null;
alter table simulation_player_stats alter column player_initials set not null;
alter table simulation_player_stats alter column player_accent set not null;
alter table simulation_player_stats
  add primary key (simulation_id, side, player_id);
