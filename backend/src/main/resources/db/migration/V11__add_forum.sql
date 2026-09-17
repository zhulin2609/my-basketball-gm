create table shared_lineups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  source_lineup_id uuid references lineups(id) on delete set null,
  name text not null,
  description text not null default '',
  members jsonb not null,
  comment_count integer not null default 0,
  copy_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index shared_lineups_source_key on shared_lineups(source_lineup_id) where source_lineup_id is not null;
create index shared_lineups_created_idx on shared_lineups(created_at desc);

create table lineup_comments (
  id uuid primary key default gen_random_uuid(),
  shared_lineup_id uuid not null references shared_lineups(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  parent_id uuid references lineup_comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index lineup_comments_post_idx on lineup_comments(shared_lineup_id, created_at);
