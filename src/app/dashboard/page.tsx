import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateAgent } from "@/lib/agents";

export default async function DashboardPage() {
  const agent = await getOrCreateAgent();

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <UserButton />
      </div>
      <p className="text-sm text-gray-500">
        Signed in as {agent.email ?? agent.clerk_user_id}. Listing management
        lands here in the next step.
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
    </div>
  );
}
