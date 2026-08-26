"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateAgent } from "@/lib/agents";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { uploadBrandAsset } from "@/lib/supabase/storage";
import type { Agent } from "@/lib/supabase/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function updateBrandKit(formData: FormData) {
  const agent = await getOrCreateAgent();

  const updates: Partial<Agent> = {
    name: readString(formData, "name"),
    brokerage: readString(formData, "brokerage"),
    phone: readString(formData, "phone"),
    brand_primary_color:
      readString(formData, "brand_primary_color") ?? agent.brand_primary_color,
    brand_secondary_color:
      readString(formData, "brand_secondary_color") ?? agent.brand_secondary_color,
    font_choice: readString(formData, "font_choice") ?? agent.font_choice,
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_FILE_BYTES) {
      throw new Error("Logo must be under 5MB");
    }
    updates.logo_url = await uploadBrandAsset(agent.id, "logo", logo);
  }

  const headshot = formData.get("headshot");
  if (headshot instanceof File && headshot.size > 0) {
    if (headshot.size > MAX_FILE_BYTES) {
      throw new Error("Headshot must be under 5MB");
    }
    updates.headshot_url = await uploadBrandAsset(agent.id, "headshot", headshot);
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("agents").update(updates).eq("id", agent.id);
  if (error) throw error;

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
