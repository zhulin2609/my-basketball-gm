-- Unify the username character set across the database constraint, the Java API rule and
-- the shared client rule: Han U+4E00–U+9FFF, ASCII letters, digits, underscore, hyphen.
-- V14 used 一-龥 (ending at U+9FA5), which the other two layers did not share.
alter table users drop constraint users_username_format_check;
alter table users add constraint users_username_format_check
  check (username is null or username ~ '^[一-鿿A-Za-z0-9_-]{3,32}$');
