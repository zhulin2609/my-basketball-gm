-- 历史记录无法证明原始内容，保留 null；重试时必须明确拒绝清理未经确认的数据。
alter table guest_imports add column request_payload jsonb;
