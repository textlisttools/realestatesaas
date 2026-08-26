import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
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
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <UserButton />
      </div>
      <p className="text-sm text-gray-500">
        Signed in as {agent.email ?? agent.clerk_user_id}.
      </p>

      <div className="flex items-center gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {agent.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static local asset
          <img
            src={agent.logo_url}
            alt="Brand logo"
            className="h-12 w-12 rounded border border-black/10 object-contain dark:border-white/15"
          />
        ) : (
          <div className="h-12 w-12 rounded border border-dashed border-black/20 dark:border-white/20" />
        )}
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium">
            {agent.name ?? "Brand kit not set up yet"}
          </span>
          <span className="text-xs text-gray-500">
            {agent.brokerage ?? "Add your brokerage, colors, logo, and headshot"}
          </span>
        </div>
        <div className="flex gap-1">
          <span
            className="h-6 w-6 rounded-full border border-black/10 dark:border-white/15"
            style={{ backgroundColor: agent.brand_primary_color }}
          />
          <span
            className="h-6 w-6 rounded-full border border-black/10 dark:border-white/15"
            style={{ backgroundColor: agent.brand_secondary_color }}
          />
        </div>
        <Link
          href="/dashboard/brand-kit"
          className="h-9 flex items-center rounded-full border border-black/10 px-4 text-sm transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-[#1a1a1a]"
        >
          Edit brand kit
        </Link>
      </div>

      <Link
        href="/dashboard/listings"
        className="flex items-center justify-between rounded-lg border border-black/10 p-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-[#1a1a1a]"
      >
        Listings
        <span className="text-gray-500">&rarr;</span>
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{TIER_LABEL[agent.subscription_tier]}</span>
            {agent.subscription_tier === "free" && (
              <span className="text-gray-500"> — {FREE_TIER_LISTING_LIMIT} listings/month</span>
            )}
            {agent.bonus_listings_remaining > 0 && (
              <span className="text-gray-500">
                {" "}
                (+{agent.bonus_listings_remaining} bonus)
              </span>
            )}
          </div>
          {agent.subscription_tier !== "free" && (
            <form action="/api/billing/portal" method="post">
              <button
                type="submit"
                className="h-9 rounded-full border border-black/10 px-4 text-sm transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-[#1a1a1a]"
              >
                Manage billing
              </button>
            </form>
          )}
        </div>

        {agent.subscription_tier === "free" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {PAID_TIERS.map(({ tier, label, displayPrice }) => (
                <form key={tier} action="/api/billing/checkout" method="post">
                  <input type="hidden" name="tier" value={tier} />
                  <button
                    type="submit"
                    className="h-9 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
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
                className="rounded border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
              />
              <button
                type="submit"
                className="h-9 rounded-full border border-black/10 px-4 text-sm transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-[#1a1a1a]"
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
