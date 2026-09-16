alter table players add column catalog_key text unique;

create unique index players_catalog_key_idx
  on players(catalog_key)
  where catalog_key is not null;
