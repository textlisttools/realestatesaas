import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { createServiceRoleClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  just_listed: "Just listed",
  pending: "Pending",
  sold: "Sold",
};

function formatPrice(price: number | null) {
  if (price === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ListingsPage() {
  const agent = await getOrCreateAgent();
  const supabase = createServiceRoleClient();

  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <Link
          href="/dashboard/listings/new"
          className="h-9 flex items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-gray-500">
          No listings yet. Add your first one to start generating marketing
          assets.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="flex items-center justify-between rounded-lg border border-black/10 p-4 dark:border-white/15"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{listing.address}</span>
                <span className="text-xs text-gray-500">
                  {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ") ||
                    "No location set"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">{formatPrice(listing.price)}</span>
                <span className="rounded-full border border-black/10 px-3 py-1 text-xs dark:border-white/15">
                  {STATUS_LABEL[listing.status] ?? listing.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
