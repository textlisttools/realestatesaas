import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { FREE_TIER_LISTING_LIMIT, PAID_TIERS } from "@/lib/stripe";
import { redeemCode } from "./actions";

const TIER_LABEL: Record<string, string> = {
  free: "Free plan",
  pro: "Pro plan",
  premium: "Premium plan",
};

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const agent = await getOrCreateAgent();
  const searchParams = await props.searchParams;
  const redeemMessage =
    typeof searchParams.message === "string" ? searchParams.message : null;
  const redeemOk = searchParams.redeem === "ok";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <div>
        <h1 className="text-brand text-2xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Signed in as {agent.email ?? agent.clerk_user_id}.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-black/10 bg-white p-4">
        {agent.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static local asset
          <img
            src={agent.logo_url}
            alt="Brand logo"
            className="h-12 w-12 rounded border border-black/10 object-contain"
          />
        ) : (
          <div className="h-12 w-12 rounded border border-dashed border-black/20" />
        )}
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-black">
            {agent.name ?? "Brand kit not set up yet"}
          </span>
          <span className="text-xs text-zinc-600">
            {agent.brokerage ?? "Add your brokerage, colors, logo, and headshot"}
          </span>
        </div>
        <div className="flex gap-1">
          <span
            className="h-6 w-6 rounded-full border border-black/10"
            style={{ backgroundColor: agent.brand_primary_color }}
          />
          <span
            className="h-6 w-6 rounded-full border border-black/10"
            style={{ backgroundColor: agent.brand_secondary_color }}
          />
        </div>
        <Link
          href="/dashboard/brand-kit"
          className="border-brand text-brand flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors hover:bg-black/[.04]"
        >
          Edit brand kit
        </Link>
      </div>

      <Link
        href="/dashboard/listings"
        className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-4 text-sm font-medium text-black transition-colors hover:bg-black/[.04]"
      >
        Listings
        <span className="text-zinc-500">&rarr;</span>
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-black">{TIER_LABEL[agent.subscription_tier]}</span>
            {agent.subscription_tier === "free" && (
              <span className="text-zinc-500"> — {FREE_TIER_LISTING_LIMIT} listings/month</span>
            )}
            {agent.bonus_listings_remaining > 0 && (
              <span className="text-gold-dark font-medium">
                {" "}
                (+{agent.bonus_listings_remaining} bonus)
              </span>
            )}
          </div>
          {agent.subscription_tier !== "free" && (
            <form action="/api/billing/portal" method="post">
              <button
                type="submit"
                className="border-brand text-brand h-9 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-black/[.04]"
              >
                Manage billing
              </button>
            </form>
          )}
        </div>

        {agent.subscription_tier === "free" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {PAID_TIERS.map(({ tier, label, displayPrice }) => (
                <form key={tier} action="/api/billing/checkout" method="post">
                  <input type="hidden" name="tier" value={tier} />
                  <button
                    type="submit"
                    className="bg-brand hover:bg-brand-dark h-9 rounded-full px-4 text-sm font-medium text-white transition-colors"
                  >
                    Upgrade to {label} ({displayPrice})
                  </button>
                </form>
              ))}
            </div>

            <form action={redeemCode} className="flex gap-2">
              <input
                name="code"
                placeholder="Have a code?"
                className="rounded border border-black/10 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="border-brand text-brand h-9 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-black/[.04]"
              >
                Redeem
              </button>
            </form>
            {redeemMessage && (
              <p className={`text-sm ${redeemOk ? "text-green-600" : "text-red-600"}`}>
                {redeemMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
