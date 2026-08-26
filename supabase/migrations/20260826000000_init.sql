-- Initial schema for the Real Estate Agent Marketing Kit Generator.
-- See PLAN.md for the product context these tables support.

create extension if not exists pgcrypto;

create table agents (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  name text,
  brokerage text,
  phone text,
  email text,
  logo_url text,
  headshot_url text,
  brand_primary_color text default '#1a2b4c',
  brand_secondary_color text default '#c9a86a',
  font_choice text default 'inter',
  stripe_customer_id text,
  subscription_tier text default 'free',
  created_at timestamptz default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  address text not null,
  city text,
  state text,
  zip text,
  price numeric,
  beds int,
  baths numeric,
  sqft int,
  status text default 'active', -- active | just_listed | pending | sold
  description text,
  mls_number text,
  created_at timestamptz default now()
);

create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  photo_url text not null,
  sort_order int default 0,
  is_hero boolean default false
);

create table generated_assets (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  asset_type text not null, -- flyer_pdf | ig_post | ig_story | fb_post
  file_url text,
  template_variant text,
  created_at timestamptz default now()
);

create index listings_agent_id_idx on listings(agent_id);
create index listing_photos_listing_id_idx on listing_photos(listing_id);
create index generated_assets_listing_id_idx on generated_assets(listing_id);

alter table agents enable row level security;
alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table generated_assets enable row level security;

-- RLS policies are intentionally left unwritten here: the app talks to
-- Supabase with the service-role key from trusted server-side code (API
-- routes / server actions) and enforces per-agent ownership there, since
-- auth identity lives in Clerk rather than Supabase Auth. Add policies
-- once a decision is made on passing Clerk JWTs through to Postgres.
