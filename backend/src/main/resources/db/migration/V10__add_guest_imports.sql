create table guest_imports (
  guest_workspace_id uuid primary key,
  owner_id uuid not null references users(id) on delete cascade,
  player_count integer not null default 0 check (player_count >= 0),
  lineup_count integer not null default 0 check (lineup_count >= 0),
  simulation_count integer not null default 0 check (simulation_count >= 0),
  imported_at timestamptz not null default now()
);

create index guest_imports_owner_idx on guest_imports(owner_id);
