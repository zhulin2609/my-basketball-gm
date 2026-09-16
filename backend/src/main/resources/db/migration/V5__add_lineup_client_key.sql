-- The browser retains its own stable IDs, including legacy values such as "classic-five".
alter table lineups add column client_key text;

update lineups
set client_key = id::text
where client_key is null;

alter table lineups alter column client_key set not null;
alter table lineups add constraint lineups_owner_client_key_unique unique (owner_id, client_key);
create index lineups_owner_updated_idx on lineups(owner_id, updated_at desc);
