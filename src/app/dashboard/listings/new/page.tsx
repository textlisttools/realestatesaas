import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { hasListingQuota } from "@/lib/quota";
import { FREE_TIER_LISTING_LIMIT } from "@/lib/stripe";
import { createListing } from "./actions";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "just_listed", label: "Just listed" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" },
];

const inputClass = "rounded border border-black/10 bg-white px-3 py-2 text-sm";

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

      <form
        action={createListing}
        className={`flex flex-col gap-6 ${!hasQuota ? "pointer-events-none opacity-40" : ""}`}
      >
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input name="address" required className={inputClass} />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            City
            <input name="city" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            State
            <input name="state" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Zip
            <input name="zip" className={inputClass} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            Price
            <input name="price" type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Beds
            <input name="beds" type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Baths
            <input name="baths" type="number" min="0" step="0.5" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sqft
            <input name="sqft" type="number" min="0" step="1" className={inputClass} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select name="status" defaultValue="active" className={inputClass}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            MLS number
            <input name="mls_number" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea name="description" rows={4} className={inputClass} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Photos
          <input name="photos" type="file" accept="image/*" multiple />
          <span className="text-xs text-zinc-500">
            The first photo you select is used as the hero image.
          </span>
        </label>

        <button
          type="submit"
          disabled={!hasQuota}
          className="bg-brand hover:bg-brand-dark h-11 w-fit rounded-full px-6 text-sm font-medium text-white transition-colors disabled:opacity-40"
        >
          Save listing
        </button>
      </form>
    </div>
  );
}
