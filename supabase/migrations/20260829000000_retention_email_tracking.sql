-- Tracks whether the 2-week free-tier retention email (with a
-- WELCOME10-style bonus-listings code) has already been sent to an agent,
-- so the daily cron job never sends it twice.
alter table agents add column if not exists retention_code_sent_at timestamptz;
