# Real Estate Agent Marketing Kit Generator — Build Plan

## What we're building
A SaaS tool where real estate agents input listing details and get auto-generated,
branded marketing assets: a print-ready flyer (PDF), Instagram posts, and Instagram
stories — all pulling from a saved brand kit (logo, colors, headshot).

## Stack
- Next.js (App Router)
- Supabase (Postgres + Storage + Auth data)
- Clerk (auth)
- Stripe (subscriptions)
- Puppeteer (HTML/CSS → PNG/PDF rendering) — use `@sparticuz/chromium` for
  serverless/Vercel compatibility

## Database schema

```sql
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
```

## Templates (v1 — build exactly these 3, no more)

1. **Flyer** (PDF, 8.5x11 / 2550x3300px @300dpi)
   - Hero photo, top half
   - Stat row: price / beds / baths / sqft
   - 2–3 secondary photos in a grid, middle section
   - Footer bar (brand primary color bg): agent headshot, logo, name, phone, email

2. **Instagram post** (1080x1080)
   - Hero photo, full-bleed
   - Price badge, top corner, brand secondary color
   - Bottom gradient overlay: address + stat row
   - Agent logo, small, bottom corner

3. **Instagram story** (1080x1920)
   - Hero photo, full-bleed
   - Top third: bold banner — "JUST LISTED" / "JUST SOLD" (based on listing status)
   - Bottom third: stats + agent handle/logo

## Build order

1. Scaffold Next.js project, connect Supabase, run schema migration above
2. Set up Clerk auth, create `agents` row on first sign-in
3. Brand kit onboarding page: logo/headshot upload to Supabase Storage, color
   pickers, font choice — save to `agents`
4. Listing form: manual entry (address, price, beds/baths/sqft, description,
   status dropdown) + multi-photo upload to Supabase Storage, mark one as hero
5. Build each template as a standalone HTML/CSS component (easiest to design
   and debug in isolation before wiring to Puppeteer)
6. Puppeteer render function: takes a listing + agent brand data, renders each
   template to PNG (social) or PDF (flyer), uploads result to Supabase Storage,
   writes a row to `generated_assets`
7. Dashboard: listings table → "Generate assets" button → preview thumbnails →
   download individually or as a zip
8. Stripe integration: free tier capped at N listings/month, paid tier unlocks
   unlimited + maybe additional template variants later

## Known constraints to flag early
- Puppeteer on Vercel needs `@sparticuz/chromium` (or an external rendering
  service) — don't let the default Puppeteer install silently fail in prod
- No MLS/IDX scraping in v1 — manual entry only, to avoid licensing/ToS issues
- Keep templates as separate, swappable components — resist combining logic
  now, since more template variants are a natural v2 addition

## Status

- [x] Step 1: Next.js App Router project scaffolded, Supabase client wiring
      and schema migration written. **Live and confirmed** — project
      `glowpioqkptggxkrhsxx`, migration applied via the Supabase SQL Editor
      (this sandbox's network policy blocks direct outbound to supabase.co,
      so the CLI/`/api/health/db` route couldn't verify it from here; the
      user confirmed all four tables via a SQL Editor query instead).
      `.env.local` (gitignored) holds the project URL + anon/service-role
      keys for local `npm run dev` use.
- [ ] Step 2: Clerk auth
- [ ] Step 3: Brand kit onboarding
- [ ] Step 4: Listing form + photo upload
- [ ] Step 5: Template components
- [ ] Step 6: Puppeteer render pipeline
- [ ] Step 7: Dashboard
- [ ] Step 8: Stripe integration
