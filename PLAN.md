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

      **Live and confirmed end-to-end** — bucket migration run, "Generate
      assets" clicked (several times, while debugging the two Vercel gaps
      below) through the deployed Vercel URL, all three asset types showed
      up on the listing detail page with working download links.

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
- [x] Step 7: The listings table (`/dashboard/listings`) → detail page
      (`/dashboard/listings/[id]`, "Generate assets" button) → thumbnails →
      download flow from the plan was already in place from steps 4-6;
      this step filled in the two pieces it was still missing: thumbnails
      on the generated-assets list (a real `<img>` for the two PNG types,
      a plain "PDF" placeholder tile for the flyer — no library for actual
      PDF thumbnailing), and a "Download all (.zip)" link next to the
      per-asset download links. The zip endpoint
      (`src/app/api/listings/[id]/download-zip/route.ts`, a normal App
      Router Route Handler — no react-dom/server involved, so none of step
      6's Pages Router detour applies here) takes the most recent row per
      `asset_type` (repeated "Generate assets" clicks — including the ones
      from debugging step 6 — pile up rows, so this avoids zipping stale
      duplicates), fetches each `file_url` server-side, and bundles them
      with `jszip`. Hit a real TypeScript issue getting the zip bytes into
      a `NextResponse`: newer TS distinguishes `ArrayBuffer` from
      `SharedArrayBuffer` in `ArrayBufferView`'s `.buffer` type, and
      jszip's `Uint8Array` output is generically typed over the wider
      `ArrayBufferLike`, so `BodyInit`/`BlobPart` rejected it — a type-level
      false positive (Node's zip output is never actually
      `SharedArrayBuffer`-backed), fixed with one documented cast, not a
      runtime bug. Build/lint/typecheck pass; confirmed via `npm run dev`
      that both new/changed routes correctly redirect to `/sign-in` when
      signed out. **Live and confirmed** — thumbnails render correctly and
      the zip download works through the deployed Vercel URL.
- [x] Step 8: Stripe subscriptions built: `/api/billing/checkout` creates a
      Stripe customer on first use (saved to `agents.stripe_customer_id`)
      and a subscription Checkout session for
      `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO`; `/api/billing/portal` opens
      Stripe's hosted billing portal for managing/canceling;
      `/api/billing/webhook` verifies the Stripe signature against the raw
      request body and syncs `agents.subscription_tier` from
      `customer.subscription.{created,updated,deleted}` events (`active`/
      `trialing` → `pro`, everything else → `free`). Free tier is capped
      at `FREE_TIER_LISTING_LIMIT = 3` listings/month
      (`src/lib/quota.ts#hasListingQuota`, counts listings created since
      the start of the current UTC calendar month) — enforced twice: the
      "New listing" page hides/disables the form and shows an upgrade
      prompt when quota is hit, and `createListing` re-checks server-side
      as the actual enforcement point (the page-level hiding is only a
      convenience, not the security boundary). Dashboard shows current
      plan + an Upgrade/Manage billing button.

      Caught a real bug while smoke-testing: the checkout route checked
      `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` before calling `getOrCreateAgent()`,
      so an unauthenticated POST got a raw 500 instead of a sign-in
      redirect — config problems shouldn't be checked before auth.
      Reordered; confirmed via `npm run dev` that `/api/billing/checkout`,
      `/api/billing/portal`, and `/dashboard/listings/new` all now
      correctly redirect signed-out requests to `/sign-in`.

      **Not verified — no Stripe account connected in this session**: the
      actual checkout flow, webhook delivery, and subscription_tier sync
      all need real Stripe test-mode keys plus a Price ID (create a
      recurring Price in the Stripe Dashboard) and a webhook endpoint
      pointed at the deployed URL's `/api/billing/webhook`, listening for
      `customer.subscription.created`, `.updated`, and `.deleted`.

## Follow-up: three tiers + trial-extension codes

Requested after step 8 landed: free / Pro ($29) / Premium ($49), plus a
redeemable code that credits 10 bonus listings to a free-tier agent (meant
to be emailed ~2 weeks after signup to nudge still-free users toward
converting).

- `SubscriptionTier` is now `"free" | "pro" | "premium"`.
  `src/lib/stripe.ts#PAID_TIERS` lists both paid tiers with their own price
  env vars (`NEXT_PUBLIC_STRIPE_PRICE_ID_PRO`,
  `NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM`); the checkout route now takes a
  `tier` field (dashboard posts it as a hidden input, one button per tier)
  and the webhook resolves which tier a subscription is on by matching its
  Stripe price id back to one of those two env vars, rather than assuming
  every active subscription is "pro".
- No functional feature gap between Pro and Premium yet — both just unlock
  unlimited listings. The product doesn't have a second feature to gate on
  (more template variants, team seats, etc. are all unbuilt), so inventing
  one felt worse than being upfront about it: the $20 difference is
  currently a "support tier" until there's something concrete to attach to
  Premium.
- `supabase/migrations/20260828000000_redemption_codes.sql`: adds
  `agents.bonus_listings_remaining`, a `redemption_codes` table (code,
  bonus amount, optional max-redemptions/expiry), an `agent_redemptions`
  join table (one redemption per agent per code), and two Postgres
  functions — `redeem_code()` validates + records + credits the bonus
  atomically in one transaction (handles invalid/expired/exhausted/
  already-redeemed as distinct return values), `consume_bonus_listing()`
  atomically spends one bonus listing via an `UPDATE ... WHERE
  bonus_listings_remaining > 0` guard, so concurrent requests can't
  double-spend the last one. Seeds one starter code, `WELCOME10`.
  `src/lib/quota.ts` now has two functions instead of one:
  `hasListingQuota()` (read-only, for what the UI shows) and
  `consumeListingQuota()` (the real enforcement point `createListing`
  calls — only actually spends a bonus listing when the agent is already
  over their monthly free limit).
- Dashboard has a "Have a code?" input (free tier only) wired to a
  `redeemCode` server action, and shows `bonus_listings_remaining` next to
  the plan name when nonzero.

Build/lint/typecheck pass; confirmed via `npm run dev` that `/dashboard`,
`/api/billing/checkout`, and `/dashboard/listings/new` still correctly
redirect to `/sign-in` when signed out (checked after these changes since
the checkout route's request-parsing order changed).

**Deliberately not built — needs a decision first**: the "code arrives by
email ~2 weeks after signup" automation. That needs an email provider
(e.g. Resend, SendGrid, Postmark) plus a scheduled job (Vercel Cron
calling a route daily that finds free-tier agents whose `created_at` is
~14 days ago and hasn't been sent one yet — needs a new
`retention_code_sent_at` column to track that) to send `WELCOME10` (or a
freshly-generated per-agent code, if you'd rather each agent get a unique
one). Redeeming still works right now by just handing someone the code
directly.

**Now built — Resend chosen for the retention email.**
`supabase/migrations/20260829000000_retention_email_tracking.sql` adds
`agents.retention_code_sent_at`. `src/app/api/cron/retention-email/route.ts`
runs daily via Vercel Cron (`vercel.json`, `0 13 * * *` — 1pm UTC), finds
free-tier agents with an email, no `retention_code_sent_at`, and
`created_at` ≥14 days ago, emails each the `WELCOME10` code via Resend, and
only marks `retention_code_sent_at` on an actually-successful send (so a
transient Resend failure retries the next day instead of being silently
skipped forever). Guarded by `CRON_SECRET` — Vercel sends
`Authorization: Bearer $CRON_SECRET` automatically on cron-triggered
requests; anything else gets a 401, confirmed via `npm run dev` with a
temporary local secret (wrong bearer → 401, correct bearer → passes through
to the next real check). All qualifying agents currently share the one
seeded code rather than getting a unique one each — simpler, and the
`agent_redemptions` unique constraint already stops any single agent from
redeeming it twice, so nothing about correctness depends on the codes being
distinct.

**Stripe: live and confirmed end-to-end.** All four env vars
(`STRIPE_SECRET_KEY`, both price IDs, `STRIPE_WEBHOOK_SECRET`) added to
Vercel and redeployed. Hit one real snag getting there: `STRIPE_SECRET_KEY`
kept saving with a corrupted value through several rounds of mobile
copy/paste/retype (Vercel's own logs showed `Invalid API Key provided`),
fixed by re-copying it fresh from the Stripe Dashboard's copy-icon button
rather than manual text selection. After that, full test purchase
(`4242 4242 4242 4242`) confirmed: Checkout session created correctly,
redirected to `checkout.stripe.com`, payment completed, redirected back to
`/dashboard?upgraded=1`, and the webhook fired and flipped the dashboard's
plan badge to "Pro plan" on refresh — the one piece (webhook delivery →
`subscription_tier` sync) that genuinely could not be verified any other
way, since it requires a real Stripe account round-tripping to a real
deployed URL.

**Still not verified — Resend not set up yet**: sign up, verify a sending
domain (Resend rejects sending to arbitrary recipients from an unverified
domain — the shared `onboarding@resend.dev` sender only delivers to your
own account email, not to real agents), and send `RESEND_API_KEY` +
`RESEND_FROM_EMAIL` (e.g. `Real Estate Marketing Kit
<hello@yourdomain.com>`). `CRON_SECRET` was generated (not from a
third-party account, just a random string both sides need to agree on) and
handed over; user is holding off on the domain/Resend signup for now, no
urgency.

## Follow-up: landing page redesign

Requested after everything above shipped: restyle `/` (the marketing home
page) to look like a polished SaaS landing page, referencing
iHomefinder.com's agent-marketing-platform page as a structural example —
bold italic-accent headline, dark high-contrast "problem" section with
X-marked pain points, numbered "how it works" section, orange-accented pill
buttons. Rebuilt `src/app/page.tsx` with that structure but original copy
grounded in what this product actually does (brand kit → listing → flyer/
social generation), not the reference site's copy.

Then asked to drop the orange (oversaturated in real estate tech — RE/MAX,
Keller Williams, Redfin, iHomefinder itself all live there) for something
that reads well specifically for real estate. Went with **deep navy
(`#1a2b4c`) + warm gold (`#c9a86a`, `#a9884f` for on-light text) + a warm
cream background (`#f7f3ec`)** instead of stark white — navy reads as
trust/stability (the psychologically load-bearing color for a purchase
this size), gold signals warmth/quality without being flashy, and the
combination happens to be exactly `agents.brand_primary_color`/
`brand_secondary_color`'s schema defaults from step 1, so the marketing
site now previews the same palette a new agent's own brand kit starts
with — free cohesion. Also, not coincidentally, this is close to Sotheby's
International Realty's real branding (navy/cream/gold), a well-established
combination in the luxury real estate segment specifically. Colors live as
CSS custom properties in `globals.css` (`--color-brand`, `--color-gold`,
`--color-gold-dark`, `--color-cream`, Tailwind v4 `@theme` block), reused
across buttons, the two navy sections (bookending the page), and gold
accents (italic hero word, eyebrow labels, icons).

**On verification**: this app's pages can't be screenshotted locally at
all — `clerkMiddleware` (`src/proxy.ts`) hits Clerk's API on every request
regardless of the page, and this sandbox blocks that domain; confirmed
this isn't page-specific by temporarily stripping `ClerkProvider` out of
the root layout for a scratch test and seeing the identical block, then
reverting it exactly. Given that, verified the actual color *combination*
a different way: built a standalone static HTML file with the same hex
values and layout shape (no Next.js, no Clerk, nothing this sandbox's
network policy touches) and screenshotted that directly — confirms the
palette itself reads as intended (contrast holds on all the text/background
pairings used) without confirming pixel-exact output of the real page,
which still needs a look on the actual deployment.

## Follow-up: navy/gold/cream extended to the whole app

Requested after seeing the landing page: apply the same colors and design
language everywhere, not just `/`. Touched every page:

- New `src/app/dashboard/layout.tsx` — a shared header (logo, Listings/
  Brand kit nav links, `UserButton`) wrapping all `/dashboard/*` routes,
  replacing what had been duplicated per-page. Individual pages keep their
  own contextual "Back to X" links but no longer each render their own top
  branding bar.
- `/dashboard`, `/dashboard/brand-kit`, `/dashboard/listings`,
  `/dashboard/listings/new`, `/dashboard/listings/[id]`, and the three
  template preview pages: swapped `bg-foreground`/black buttons for solid
  navy (`bg-brand`) primary actions and navy-outline secondary actions,
  gold (`text-gold-dark`) for status pills and secondary links (download
  links, bonus-listings count), cream page backgrounds with white cards,
  headings to `font-black` navy matching the landing page's weight. Did
  **not** touch the actual template components
  (`src/components/templates/*`) or their preview rendering — those use
  each *agent's own* saved brand colors by design, a different concern
  from the app's own chrome.
- Also dropped every `dark:` Tailwind variant across these files. The app
  previously followed OS dark-mode preference inconsistently (scattered
  `dark:` classes with no real dark palette behind them); given the ask was
  for one consistent design everywhere, standardized on the light navy/
  gold/cream identity always, matching the landing page's existing
  approach of ignoring system dark mode.
- Clerk's `<SignIn>`/`<SignUp>`/`<UserButton>` widgets are themed via
  `ClerkProvider`'s `appearance.variables` in the root layout
  (`colorPrimary: "#1a2b4c"`, `colorBackground: "#f7f3ec"`,
  `borderRadius: "0.6rem"`) rather than per-page, so the theme applies
  everywhere Clerk renders UI, including `UserButton` inside the new
  dashboard layout.
- Fixed a real pre-existing bug while touching the "New listing" page's
  quota-exceeded upgrade button: it posted to `/api/billing/checkout`
  without the `tier` field the route has required since the Premium-tier
  work — would have 400'd instead of starting checkout. Added
  `<input type="hidden" name="tier" value="pro">`.

Build/lint/typecheck pass; `grep -rn "dark:\|bg-foreground\|text-background"
src/app` returns nothing, confirming no old-style classes were missed.
Confirmed via `npm run dev` that auth protection is unaffected by the new
shared layout — `/dashboard`, `/dashboard/listings`, and
`/dashboard/brand-kit` still redirect to `/sign-in` when signed out (the
layout itself doesn't call `getOrCreateAgent()`/`auth.protect()` — each
page still does, unchanged). Same screenshot limitation as before: needs a
look on the real deployment to confirm the actual rendered pages, though
the color/contrast choices themselves were already validated via the
earlier static-HTML mockup.

## Follow-up: link back to the main page from everywhere

Added a "Home" link (→ `/`, the marketing page) to the shared dashboard
nav (`src/app/dashboard/layout.tsx`, alongside Listings/Brand kit) —
covers every `/dashboard/*` route including the template previews, since
they all inherit that layout already. `/sign-in` and `/sign-up` had zero
navigation before this (just the centered Clerk widget), so gave both a
small header with the wordmark linking to `/`, matching the dashboard's
header style. Build/lint/typecheck pass; confirmed via `npm run dev` that
`/sign-in` renders with the new header (`href="/"` present in the HTML)
and auth protection on `/dashboard` is unaffected.

## Follow-up: unreadable gray text on the dashboard

User reported (via a phone screenshot of the live `/dashboard`) that
several text elements — the agent name, the brand-kit subtitle, the
"Listings" nav-card link, "Free plan" — rendered almost invisible,
washed-out near-white against the white/cream cards.

Root cause: `src/app/globals.css` still had a leftover
`@media (prefers-color-scheme: dark) { :root { --background: #0a0a0a;
--foreground: #ededed; } }` block from the default Next.js starter,
combined with `body { color: var(--foreground); }`. The earlier "extend
design system to all pages" pass deliberately dropped every `dark:`
Tailwind variant in favor of one fixed light identity, but never removed
this old media query — so on a phone/browser in system dark mode, any
text node with no explicit Tailwind text-color class (inheriting `body`
color) silently flipped to `#ededed`, nearly invisible on the light card
backgrounds. Elements with an explicit color class (`text-zinc-500`,
`text-brand`, etc.) were unaffected, which is exactly why only some text
looked broken and the rest looked fine, matching the screenshot.

Fix:
- Removed the `@media (prefers-color-scheme: dark)` block from
  `globals.css` entirely — `--background`/`--foreground` now stay fixed
  at `#ffffff`/`#171717` regardless of system theme, consistent with the
  "one light identity everywhere" decision already made for the rest of
  the app.
- Defensively added explicit `text-black` (and bumped one
  `text-zinc-500` to `text-zinc-600` for the specific subtitle the user
  called out) to the handful of elements that had been relying on
  inherited body color: agent name, "Listings" link text, and the plan
  label on `src/app/dashboard/page.tsx`; the "Generated assets" heading
  and asset-type label on `src/app/dashboard/listings/[id]/page.tsx`.
- Grepped the rest of `src/app` for the same pattern (text nodes with no
  `text-*` class); the remaining instances (form labels, list rows on
  `/dashboard/listings`, paragraph copy) all inherit the now-fixed
  `body` color, so the CSS fix alone covers them without needing
  individual edits.

Build/lint/typecheck pass.

## Follow-up: import a listing from a URL (own-website scraping)

Requested after discussing MLS/IDX integration options (deferred — needs
per-agent MLS credentials and a licensing agreement, too much friction for
now). This is the lighter-weight version: paste the URL of a listing on
the agent's *own* IDX-powered website (not a general MLS/Zillow scrape —
much lower ToS risk since it's the agent's own licensed listing display),
and prefill the New Listing form from it. Manual entry stays fully intact
as the fallback/default — nothing about the existing flow changed if you
skip the import box.

- `src/lib/importListing.ts`: `fetchAndParseListing(url)` fetches the page
  server-side (15s timeout, browser-like User-Agent, follows redirects)
  and hands the HTML to `parseListingFromHtml(html, sourceUrl)`, which
  tries three extraction strategies in order and merges whatever each one
  finds: (1) `<script type="application/ld+json">` schema.org blocks
  (`address`, `offers.price`, `numberOfBedrooms`, `floorSize`, `image`) —
  most reliable when present; (2) Open Graph meta tags
  (`og:title`/`og:description`/`og:image`) and `itemprop` microdata
  fallbacks for address parts; (3) regex over the page's visible text for
  the "4 bd · 2 ba · 1,772 sqft" / "$185,000" / "MLS® 181932" style
  patterns IDX platforms render as plain text regardless of underlying
  markup — this is what actually carries most of the extraction on
  simpler IDX sites with no structured data at all, confirmed against a
  synthetic page modeled on the screenshot the user sent (a real IDX
  results page). Photo URLs get resolved against the source page,
  deduped, filtered to actual image extensions, and filtered for obvious
  non-listing images (`logo`/`icon`/`avatar`/`sprite` in the URL).
  Basic SSRF hardening: rejects non-http(s) URLs and loopback/private/
  link-local hostnames before fetching (both the page itself and each
  photo URL) — not exhaustive (no DNS-rebinding protection), but this is
  only reachable by authenticated agents, not the public.
- New server action `importListingFromUrl(url)`
  (`src/app/dashboard/listings/new/actions.ts`) — auth-protected like
  everything else via `getOrCreateAgent()`, never throws (catches
  fetch/parse errors and returns `{ok:false,error}` so the client can
  show an inline message instead of crashing the page).
- The New Listing form (`src/app/dashboard/listings/new/page.tsx`) split
  into a server component (auth + quota check, unchanged) rendering a new
  client component, `ListingForm.tsx` — needed client-side state since
  imported data has to land in the form fields interactively. An "Import
  from a listing URL" box sits above the existing fields; on import,
  refs are used to fill the existing uncontrolled inputs (address, city,
  state, zip, price, beds, baths, sqft, MLS number, description) rather
  than converting the whole form to controlled inputs — smaller diff,
  every field stays a normal editable input the agent can override.
  Imported photos show as removable thumbnails and ride along as hidden
  `imported_photo_urls` fields so they submit with the rest of the form;
  the original file-upload input is still there for manual/additional
  photos, now labeled "Additional photos" when an import already
  supplied some.
- `createListing` now processes `imported_photo_urls` before the manually
  attached files (so an imported photo stays the hero image when present)
  and downloads+re-hosts each into the existing `listing-photos` Storage
  bucket via a new `uploadListingPhotoFromUrl()` helper
  (`src/lib/supabase/storage.ts`) — never linking directly to a URL we
  don't control. A single bad remote image (dead link, hotlink
  protection, non-image content-type) is skipped rather than aborting
  the whole listing creation, since remote fetches are inherently more
  failure-prone than a local file the user just picked.

Added `cheerio` as a new dependency for HTML parsing/JSON-LD extraction.
Build/lint/typecheck pass. Verified the parser directly (this sandbox
still can't load the real app — Clerk's network block) against two
synthetic HTML fixtures modeled on the user's screenshot: one with full
JSON-LD + Open Graph data (address/city/state/zip/price/beds/baths/sqft/
description/photos all extracted correctly), and one with only bare IDX
card markup and no structured data at all (price/beds/baths/sqft/MLS
number still extracted via the text-regex fallback; address fell back to
the page `<title>`, city/state/zip came back empty — exactly the
"best-effort, review before saving" behavior intended, since nothing
forces the agent to trust an import instead of typing it themselves).
Still needs a look on the real deployment against an actual agent
website to see how well the heuristics hold up on real-world markup.
