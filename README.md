# Real Estate Agent Marketing Kit Generator

Next.js (App Router) SaaS that turns listing details + a saved agent brand
kit into a print-ready flyer PDF and Instagram post/story images. See
[`PLAN.md`](./PLAN.md) for the full product spec and build order.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase (and later Clerk/Stripe) keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

- Schema lives in [`supabase/migrations`](./supabase/migrations); the
  Supabase CLI config is in [`supabase/config.toml`](./supabase/config.toml).
- Link this repo to a Supabase project and apply the migration:

  ```bash
  npx supabase link --project-ref <your-project-ref>
  npx supabase db push
  ```

- Server code reads/writes via the service-role client in
  [`src/lib/supabase/server.ts`](./src/lib/supabase/server.ts) (bypasses RLS;
  callers must scope queries to the current agent). Client-side Storage
  uploads use the anon-key browser client in
  [`src/lib/supabase/client.ts`](./src/lib/supabase/client.ts).
- `GET /api/health/db` checks that all four tables (`agents`, `listings`,
  `listing_photos`, `generated_assets`) are reachable — use it to confirm a
  migration actually applied.

## Learn more

This project was bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
See the [Next.js documentation](https://nextjs.org/docs) for framework
details, and the
[Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying)
for deploying (e.g. on Vercel).
