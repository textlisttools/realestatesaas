import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { hasListingQuota } from "@/lib/quota";
import { FREE_TIER_LISTING_LIMIT } from "@/lib/stripe";
import ListingForm from "./ListingForm";

export default async function NewListingPage() {
  const agent = await getOrCreateAgent();
  const hasQuota = await hasListingQuota(agent);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-brand text-2xl font-black tracking-tight">New listing</h1>
        <Link href="/dashboard/listings" className="hover:text-brand text-sm text-zinc-500">
          Back to listings
        </Link>
      </div>

      {!hasQuota && (
        <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 text-sm">
          <p>
            Free plan is limited to {FREE_TIER_LISTING_LIMIT} listings/month. Upgrade to Pro
            for unlimited listings.
          </p>
          <form action="/api/billing/checkout" method="post">
            <input type="hidden" name="tier" value="pro" />
            <button
              type="submit"
              className="bg-brand hover:bg-brand-dark h-9 w-fit rounded-full px-4 text-sm font-medium text-white transition-colors"
            >
              Upgrade to Pro
            </button>
          </form>
        </div>
      )}

      <ListingForm hasQuota={hasQuota} />
    </div>
  );
}
