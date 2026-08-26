import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/supabase/types";

async function findAgentByClerkId(clerkUserId: string): Promise<Agent | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function createAgent(
  clerkUserId: string,
  email: string | null,
  name: string | null
): Promise<Agent> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("agents")
    .insert({ clerk_user_id: clerkUserId, email, name })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Looks up the agents row for the signed-in Clerk user, creating it on
 * first sign-in if it doesn't exist yet. This is the resource-level auth
 * check for every protected page/action (redirects to sign-in if called
 * signed-out) — see src/proxy.ts for why protection lives here rather than
 * in middleware route matching. App Router only (uses auth()/currentUser()).
 */
export async function getOrCreateAgent(): Promise<Agent> {
  await auth.protect();
  const user = await currentUser();
  if (!user) {
    throw new Error("getOrCreateAgent: signed in but currentUser() returned null");
  }

  const existing = await findAgentByClerkId(user.id);
  if (existing) return existing;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  return createAgent(user.id, user.primaryEmailAddress?.emailAddress ?? null, name);
}

/**
 * Same lookup-or-create, for Pages Router API routes (which can't use
 * auth()/currentUser() — those are App Router-only). Caller must already
 * have verified clerkUserId via getAuth(req) and rejected unauthenticated
 * requests before calling this.
 */
export async function getOrCreateAgentForClerkUser(clerkUserId: string): Promise<Agent> {
  const existing = await findAgentByClerkId(clerkUserId);
  if (existing) return existing;

  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  return createAgent(clerkUserId, user.primaryEmailAddress?.emailAddress ?? null, name);
}
