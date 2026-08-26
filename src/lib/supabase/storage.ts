import { createServiceRoleClient } from "@/lib/supabase/server";

const BRAND_ASSETS_BUCKET = "brand-assets";
const LISTING_PHOTOS_BUCKET = "listing-photos";

async function uploadPublicFile(bucket: string, path: string, file: File): Promise<string> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function uploadBrandAsset(
  agentId: string,
  kind: "logo" | "headshot",
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${agentId}/${kind}-${Date.now()}.${ext}`;
  return uploadPublicFile(BRAND_ASSETS_BUCKET, path, file);
}

export async function uploadListingPhoto(
  listingId: string,
  index: number,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${listingId}/${index}-${Date.now()}.${ext}`;
  return uploadPublicFile(LISTING_PHOTOS_BUCKET, path, file);
}
