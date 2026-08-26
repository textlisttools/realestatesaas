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

export async function hasListingQuota(agent: Agent): Promise<boolean> {
  if (agent.subscription_tier === "pro") return true;
  const count = await countListingsThisMonth(agent.id);
  return count < FREE_TIER_LISTING_LIMIT;
}
