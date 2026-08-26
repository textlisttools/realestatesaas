import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";

const BRAND_ASSETS_BUCKET = "brand-assets";

export async function uploadBrandAsset(
  agentId: string,
  kind: "logo" | "headshot",
  file: File
): Promise<string> {
  const supabase = createServiceRoleClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${agentId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BRAND_ASSETS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);

  return publicUrl;
}
