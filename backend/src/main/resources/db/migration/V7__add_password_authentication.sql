alter table users
  add column username varchar(32),
  add column password_hash varchar(100);

create unique index users_username_lower_unique
  on users (lower(username))
  where username is not null;

alter table users
  add constraint users_username_format_check
  check (username is null or username ~ '^[[:alnum:]_-]{3,32}$');
