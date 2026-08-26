import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/supabase/types";

/**
 * Looks up the agents row for the signed-in Clerk user, creating it on
 * first sign-in if it doesn't exist yet. Call from server components/routes
 * behind the auth middleware only — throws if there's no signed-in user.
 */
export async function getOrCreateAgent(): Promise<Agent> {
  const user = await currentUser();
  if (!user) {
    throw new Error("getOrCreateAgent called without a signed-in user");
  }

  const supabase = createServiceRoleClient();

  const { data: existing, error: selectError } = await supabase
    .from("agents")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("agents")
    .insert({
      clerk_user_id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created;
}
