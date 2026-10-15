-- Username minimum length is now 2 characters (Han given names are commonly two
-- characters). Decision recorded as D-007; the character set is unchanged.
alter table users drop constraint users_username_format_check;
alter table users add constraint users_username_format_check
  check (username is null or username ~ '^[一-鿿A-Za-z0-9_-]{2,32}$');
