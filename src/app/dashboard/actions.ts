"use server";

import { redirect } from "next/navigation";
import { getOrCreateAgent } from "@/lib/agents";
import { createServiceRoleClient } from "@/lib/supabase/server";

const RESULT_MESSAGE: Record<string, string> = {
  ok: "Code applied — extra listings added to your account.",
  invalid_code: "That code isn't valid.",
  expired: "That code has expired.",
  exhausted: "That code has already been fully redeemed.",
  already_redeemed: "You've already used that code.",
};

export async function redeemCode(formData: FormData) {
  const agent = await getOrCreateAgent();

  const codeInput = formData.get("code");
  const code = typeof codeInput === "string" ? codeInput.trim().toUpperCase() : "";

  let result = "invalid_code";
  if (code) {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("redeem_code", {
      p_agent_id: agent.id,
      p_code: code,
    });
    if (error) throw error;
    result = data ?? "invalid_code";
  }

  const message = RESULT_MESSAGE[result] ?? "Something went wrong redeeming that code.";
  redirect(`/dashboard?redeem=${encodeURIComponent(result)}&message=${encodeURIComponent(message)}`);
}
