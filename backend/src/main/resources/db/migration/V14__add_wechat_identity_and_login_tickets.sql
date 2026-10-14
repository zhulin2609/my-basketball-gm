-- Stage 4: WeChat identity binding, one-time identity confirmation credentials and
-- Web scan-code login tickets. Usernames now allow Han characters alongside ASCII.

-- V7 used the POSIX alnum class, which in a UTF-8 database also accepts non-Han scripts
-- (Korean, accented Latin). The confirmed rule is Han, ASCII letters, digits, underscore
-- and hyphen, 3-32 characters.
alter table users drop constraint users_username_format_check;
alter table users add constraint users_username_format_check
  check (username is null or username ~ '^[一-龥A-Za-z0-9_-]{3,32}$');

-- One row per external identity. Both uniqueness directions are enforced by constraints:
-- one (provider, appid, openid) belongs to exactly one user, and a user binds at most one
-- identity per (provider, appid).
create table user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  appid text not null,
  openid text not null,
  unionid text,
  created_at timestamptz not null default now(),
  constraint user_identities_provider_appid_openid_unique unique (provider, appid, openid),
  constraint user_identities_user_provider_appid_unique unique (user_id, provider, appid)
);

create index user_identities_user_idx on user_identities(user_id);

-- Short-lived, single-use confirmation credential issued after a successful WeChat code
-- exchange for an unbound identity. Only the SHA-256 digest of the random token is stored.
-- consumed_by_user_id makes a retry of a succeeded bind/register recognizable.
create table wechat_auth_credentials (
  id uuid primary key default gen_random_uuid(),
  token_digest text not null unique,
  provider text not null,
  appid text not null,
  openid text not null,
  unionid text,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by_user_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index wechat_auth_credentials_identity_idx
  on wechat_auth_credentials(provider, appid, openid, created_at desc);

-- Web scan-code login ticket. The raw ticket travels in the mini program code scene and is
-- only stored as a digest; claiming additionally requires the browser binding value, which
-- is also stored as a digest. Expiry is evaluated lazily at read time.
create table web_login_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_digest text not null unique,
  browser_binding_digest text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'consumed')),
  approved_user_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  resolved_at timestamptz,
  consumed_at timestamptz
);

create index web_login_tickets_binding_idx on web_login_tickets(browser_binding_digest, created_at desc);
create index web_login_tickets_expires_idx on web_login_tickets(expires_at);
