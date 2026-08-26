-- Free-tier trial-extension codes: redeeming one adds a one-time pool of
-- extra listings an agent can use once they've hit their monthly free-tier
-- cap, on top of (not instead of) that monthly cap.

alter table agents add column if not exists bonus_listings_remaining int not null default 0;

create table redemption_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  bonus_listings int not null default 10,
  max_redemptions int, -- null = unlimited
  times_redeemed int not null default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table agent_redemptions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade not null,
  code_id uuid references redemption_codes(id) on delete cascade not null,
  redeemed_at timestamptz default now(),
  unique (agent_id, code_id)
);

alter table redemption_codes enable row level security;
alter table agent_redemptions enable row level security;
-- Same rationale as the initial schema: service-role server code only.

-- Atomic redeem: validates the code, records the redemption, and credits
-- the bonus in one transaction so concurrent requests can't double-spend
-- or double-redeem. Returns a short status string the caller matches on
-- rather than throwing, so the UI can show a specific message.
create or replace function redeem_code(p_agent_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code redemption_codes%rowtype;
begin
  select * into v_code from redemption_codes where code = p_code for update;

  if not found then
    return 'invalid_code';
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    return 'expired';
  end if;

  if v_code.max_redemptions is not null and v_code.times_redeemed >= v_code.max_redemptions then
    return 'exhausted';
  end if;

  if exists (
    select 1 from agent_redemptions
    where agent_id = p_agent_id and code_id = v_code.id
  ) then
    return 'already_redeemed';
  end if;

  insert into agent_redemptions (agent_id, code_id) values (p_agent_id, v_code.id);
  update redemption_codes set times_redeemed = times_redeemed + 1 where id = v_code.id;
  update agents set bonus_listings_remaining = bonus_listings_remaining + v_code.bonus_listings
    where id = p_agent_id;

  return 'ok';
end;
$$;

-- Atomic "spend one bonus listing if available" — the WHERE guard makes
-- this safe under concurrent listing creation without a separate lock.
create or replace function consume_bonus_listing(p_agent_id uuid)
returns boolean
language sql
as $$
  update agents
  set bonus_listings_remaining = bonus_listings_remaining - 1
  where id = p_agent_id and bonus_listings_remaining > 0
  returning true;
$$;

-- Seed one starter code for the "still on free tier after 2 weeks" email
-- campaign. Edit/rotate the code text before sending it, or insert
-- additional one-off codes the same way.
insert into redemption_codes (code, bonus_listings)
values ('WELCOME10', 10)
on conflict (code) do nothing;
