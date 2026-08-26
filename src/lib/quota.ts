import { createServiceRoleClient } from "@/lib/supabase/server";
import { FREE_TIER_LISTING_LIMIT } from "@/lib/stripe";
import type { Agent } from "@/lib/supabase/types";

export async function countListingsThisMonth(agentId: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const { count, error } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .gte("created_at", monthStart);

  if (error) throw error;
  return count ?? 0;
}

/** Read-only — for deciding what to show in the UI. Never gates creation on its own. */
export async function hasListingQuota(agent: Agent): Promise<boolean> {
  if (agent.subscription_tier !== "free") return true;
  if (agent.bonus_listings_remaining > 0) return true;
  const count = await countListingsThisMonth(agent.id);
  return count < FREE_TIER_LISTING_LIMIT;
}

/**
 * The actual enforcement point — call this from createListing, not
 * hasListingQuota. Paid tiers and agents still under their monthly limit
 * pass for free; a free-tier agent over the limit spends one bonus listing
 * atomically (via a Postgres function, so concurrent requests can't both
 * succeed off the same last bonus listing) and only passes if one was
 * actually available to spend.
 */
export async function consumeListingQuota(agent: Agent): Promise<boolean> {
  if (agent.subscription_tier !== "free") return true;

  const count = await countListingsThisMonth(agent.id);
  if (count < FREE_TIER_LISTING_LIMIT) return true;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("consume_bonus_listing", {
    p_agent_id: agent.id,
  });
  if (error) throw error;
  return data === true;
}
