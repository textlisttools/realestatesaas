import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/supabase/types";

/**
 * Looks up the agents row for the signed-in Clerk user, creating it on
 * first sign-in if it doesn't exist yet. This is the resource-level auth
 * check for every protected page/action (redirects to sign-in if called
 * signed-out) — see src/proxy.ts for why protection lives here rather than
 * in middleware route matching.
 */
export async function getOrCreateAgent(): Promise<Agent> {
  await auth.protect();
  const user = await currentUser();
  if (!user) {
    throw new Error("getOrCreateAgent: signed in but currentUser() returned null");
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
