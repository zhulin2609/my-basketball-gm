create table user_llm_credentials (
  user_id uuid primary key references users(id) on delete cascade,
  base_url text not null,
  model varchar(128) not null,
  api_key_ciphertext bytea not null,
  api_key_iv bytea not null,
  api_key_hint varchar(12) not null,
  key_version smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_llm_credentials_iv_length_check check (octet_length(api_key_iv) = 12),
  constraint user_llm_credentials_key_version_check check (key_version > 0)
);
