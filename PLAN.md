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
- [x] Step 2: Clerk auth wired up — `ClerkProvider` in the root layout,
      `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; this
      build flagged the old name as deprecated) protects `/dashboard(.*)`
      via `clerkMiddleware`/`auth.protect()`, `/sign-in` and `/sign-up`
      catch-all routes render Clerk's hosted `<SignIn>`/`<SignUp>`, and
      `src/lib/agents.ts#getOrCreateAgent()` looks up (or inserts) the
      `agents` row for the signed-in Clerk user — called from
      `/dashboard`, so the row is created on first authenticated visit
      rather than via a webhook (no public URL to receive one in this
      sandbox). **Live and confirmed end-to-end** — deployed to Vercel
      (user is on mobile, no local Node.js available) with the six env
      vars set, signed up through the deployed URL in Safari, and
      confirmed the new user shows up in Clerk Dashboard → Users and the
      matching row shows up in Supabase → `agents`. Note: installed
      `@clerk/nextjs` is v7 ("Core 3"), which
      removed `<SignedIn>`/`<SignedOut>`/`<Protect>` in favor of a single
      async server `<Show when="signed-in" | "signed-out">` component —
      used that instead on the home page.
- [x] Step 3: Brand kit onboarding built at `/dashboard/brand-kit` —
      name/brokerage/phone fields, primary/secondary color pickers, a font
      picker (Inter/Playfair Display/Montserrat/Roboto Slab), and
      logo/headshot upload (5MB cap, `image/*` only). Uploads go through a
      server action (`src/app/dashboard/brand-kit/actions.ts`) using the
      service-role client — never a direct client-side upload with the
      anon key — so no Storage RLS policies were needed. Files land in a
      new public `brand-assets` Storage bucket
      (`supabase/migrations/20260826010000_brand_assets_bucket.sql`,
      public read so Puppeteer can fetch them by URL later; writes are
      service-role only) under `${agentId}/logo-*`/`headshot-*`. Dashboard
      now shows a brand-kit summary card (logo, name, brokerage, color
      swatches) with an edit link. **Live and confirmed end-to-end** —
      bucket migration run, logo uploaded and name/brokerage/colors saved
      through the deployed Vercel URL, dashboard card renders it correctly.
- [x] Step 4: Listing form built at `/dashboard/listings/new` (address,
      city/state/zip, price/beds/baths/sqft, status dropdown, MLS number,
      description, multi-photo upload — first selected photo becomes the
      hero). `/dashboard/listings` lists an agent's listings with a "New
      listing" link; dashboard links to it. Photos go to a new public
      `listing-photos` Storage bucket
      (`supabase/migrations/20260826020000_listing_photos_bucket.sql`),
      same service-role-only upload pattern as brand assets, 8MB/photo cap,
      up to 12 photos, `listing_photos.sort_order`/`is_hero` set from
      upload order. **Needs the bucket migration run** before uploads work.
      Also fixed a latent gap noticed while smoke-testing this step: Clerk
      flagged `createRouteMatcher`-based middleware protection (from step
      2) as deprecated, specifically because path matching in middleware
      can diverge from actual Next.js routing and leave a page
      unprotected — true here, since `/dashboard/listings/new`'s page
      component never called `getOrCreateAgent()` and had no protection of
      its own, relying solely on the middleware matcher string. Moved to
      Clerk's recommended resource-based checks instead: `src/proxy.ts` is
      now a bare `clerkMiddleware()` (just establishes the auth context),
      `getOrCreateAgent()` calls `auth.protect()` first (covering every
      page/action that already calls it), and the one page that didn't —
      `/dashboard/listings/new` — now calls `auth.protect()` directly.
      Verified via `npm run dev`: `/dashboard`, `/dashboard/listings`, and
      `/dashboard/listings/new` all redirect to `/sign-in` when signed
      out, deprecation warning gone. Build/lint/typecheck pass; the actual
      create-listing → photos-in-Storage → `listing_photos` rows flow
      still needs a real browser click-through plus that bucket existing.
      **Live and confirmed** — bucket migration run, listing created with
      photos through the deployed Vercel URL, shows up correctly on
      `/dashboard/listings`.
- [x] Step 5: All three templates built as standalone components in
      `src/components/templates/` — `FlyerTemplate` (2550×3300, hero /
      stat row / up-to-3-photo grid / primary-color footer bar with
      headshot+logo+name+phone+email), `InstagramPostTemplate` (1080×1080,
      full-bleed hero, secondary-color price badge, bottom gradient with
      address+stats, corner logo), `InstagramStoryTemplate` (1080×1920,
      full-bleed hero, top status banner in primary color — FOR SALE /
      JUST LISTED / PENDING / SOLD from `listing.status` — bottom gradient
      with address+stats+agent). All three take the same `TemplateData`
      shape (`types.ts`) built by `src/lib/listings.ts#toTemplateData()`,
      which also scopes listing lookup to the signed-in agent's `id` so
      one agent can't load another's listing by guessing a UUID. Shared
      `format.ts` handles price/address/stats formatting and a
      font-choice → CSS font-stack map. Plain `<img>` (not `next/image`)
      throughout — deliberate, since these get screenshotted/printed by
      Puppeteer at exact pixel dimensions in step 6, where `next/image`'s
      lazy-loading and srcset would work against a fixed-size render
      target rather than for it. Preview pages at
      `/dashboard/listings/[id]/{flyer,ig-post,ig-story}` render each
      template at true pixel size inside a `TemplatePreview` wrapper that
      only scales the on-screen view (via CSS `transform: scale`) —
      matches the plan's stated purpose of debugging templates in
      isolation before wiring to Puppeteer, and step 6 can render the
      template components directly, unscaled. `/dashboard/listings` links
      to all three per listing. Build/lint/typecheck pass; confirmed via
      `npm run dev` that all three preview routes correctly redirect
      unauthenticated requests to `/sign-in`. Visual correctness with a
      real listing's photos/brand data still needs a real browser
      look — nothing to verify differently here since these are pure
      presentational components with no separate "live" step, unlike
      earlier steps that needed a bucket or schema to exist first.
- [x] Step 6: Puppeteer render pipeline built and **verified locally with a
      real headless Chromium** (this environment has one preinstalled for
      Playwright at `/opt/pw-browsers/chromium`; setting
      `PUPPETEER_EXECUTABLE_PATH` to it made `launchBrowser()` use it
      instead of `@sparticuz/chromium`, which needs a real serverless
      environment to test). All three templates rendered to files with
      byte-exact target pixel dimensions (2550×3300, 1080×1080, 1080×1920,
      confirmed via PNG header inspection) and visually inspected — layout,
      colors, and text all correct; the flyer PDF opened as a valid single
      US-Letter page. `src/lib/render/`: `browser.ts` picks
      `PUPPETEER_EXECUTABLE_PATH` if set, else `@sparticuz/chromium`
      (untested here — no serverless env available — this is the one part
      of step 6 that can only really be confirmed on Vercel);
      `renderElement.ts` renders a template to HTML (Google Fonts link +
      minimal reset) and screenshots it at exact size, waiting for all
      `<img>` elements to finish loading first; `pdf.ts` wraps the flyer
      PNG into a true 8.5×11in `pdf-lib` PDF rather than trusting
      Puppeteer's own `page.pdf()`, which maps CSS px to physical units at
      96dpi regardless of viewport size and so can't produce a real 300dpi
      page from a 2550×3300 viewport; `generateAssets.ts` orchestrates all
      three renders + uploads to a new public `generated-assets` bucket
      (`supabase/migrations/20260826030000_generated_assets_bucket.sql`)
      + writes the three `generated_assets` rows.

      **Structural surprise, not a bug in the render logic**: this pipeline
      cannot be reached from the App Router at all. `generateListingAssets`
      needs `react-dom/server` to turn a template component into an HTML
      string for Puppeteer, and Next.js forces a `react-server` module
      resolution condition on every file reachable from `src/app` —
      including Route Handlers, not just Server Components/Actions — which
      makes every `react-dom/server` entry point unusable there (confirmed
      by trying the plain import, the modern `renderToReadableStream`
      streaming API, and a `react-dom/server.node` subpath import — all
      three fail the same way once actually resolved). The supported
      escape hatch is a Pages Router API route, which is a separate module
      graph and isn't subject to that condition; Next.js fully supports
      Pages and App Router coexisting. So the "Generate assets" button on
      `/dashboard/listings/[id]` is a plain HTML `<form action="/api/
      listings/[id]/generate-assets" method="post">` — not a Server Action
      — posting to `src/pages/api/listings/[id]/generate-assets.ts`. That
      route can't use `auth()`/`currentUser()` (App Router-only), so
      `src/lib/agents.ts` gained `getOrCreateAgentForClerkUser(clerkUserId)`
      alongside the existing `getOrCreateAgent()`, using Clerk's Pages
      Router-compatible `getAuth(req)` instead; `src/lib/listings.ts`
      similarly gained `findListingForAgent()` (returns null) alongside
      `getListingForAgent()` (App Router only, 404s via `next/navigation`).
      One more layer to this: `server-only` (used to guard
      `createServiceRoleClient` etc. against accidental client-bundle
      inclusion) turned out to unconditionally throw under the Pages
      Router too — Next only turns it into a no-op within the App Router
      compiler layer. Since `agents.ts`, `listings.ts`, and everything
      under `render/` are now reachable from both routers, the guard had
      to come out of those specific files; Next's separate, always-on
      stripping of non-`NEXT_PUBLIC_*` env vars from client bundles still
      prevents the service-role key from actually leaking, so this trades
      away an early build-time guard, not real protection. Verified via
      `npm run dev`: the listing detail page still redirects to
      `/sign-in` when signed out, and posting to the API route
      unauthenticated now correctly returns `401 {"error": "Not
      authenticated"}` instead of crashing.

      **Still unverified**: the real Supabase Storage upload + `INSERT
      INTO generated_assets` (network-blocked here, same as every other
      step) — needs the bucket migration run, then a real click through
      "Generate assets" on a deployed listing with actual photos.

      **Follow-up after a real "internal server error" on Vercel**: found
      and fixed two real deploy-time gaps, neither reachable from this
      sandbox (no serverless environment to test against), but both
      confirmed structurally:
      1. `@sparticuz/chromium`'s binary (`node_modules/@sparticuz/chromium/
         bin/*.br`) is loaded via dynamic path resolution, not a static
         `require()`, so Vercel's build-time file tracer doesn't detect it
         as a dependency and leaves it out of the deployed function by
         default. Added `outputFileTracingIncludes` in `next.config.ts` for
         `/api/**/*`. Verified locally, without needing Vercel: built once
         without the config and once with it, and inspected the actual Node
         File Trace manifest Next generates
         (`.next/server/pages/api/listings/[id]/generate-assets.js.nft.json`)
         — 0 of the four `.br` binary files traced without the config,
         all 4 traced with it.
      2. No `maxDuration` was set, so the route was on Vercel's default 10s
         function timeout — launching Chromium, rendering three templates,
         and doing three Storage uploads realistically won't fit in that.
         Added `export const config: PageConfig = { maxDuration: 60 }` (60s
         is the ceiling on the Hobby plan).
- [ ] Step 7: Dashboard
- [ ] Step 8: Stripe integration
