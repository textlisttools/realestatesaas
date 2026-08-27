import { createServiceRoleClient } from "@/lib/supabase/server";

const BRAND_ASSETS_BUCKET = "brand-assets";
const LISTING_PHOTOS_BUCKET = "listing-photos";

async function uploadPublicFile(
  bucket: string,
  path: string,
  body: File | ArrayBuffer,
  contentType?: string
): Promise<string> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      upsert: true,
      contentType: contentType || (body instanceof File ? body.type : undefined) || undefined,
    });

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

/** Downloads a photo found on an imported listing page and re-hosts it in our own
 * Storage bucket, rather than linking directly to a URL we don't control. */
export async function uploadListingPhotoFromUrl(
  listingId: string,
  index: number,
  sourceUrl: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(sourceUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`Failed to download photo (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("URL did not point to an image");
  }

  const buffer = await response.arrayBuffer();
  const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
  const path = `${listingId}/${index}-${Date.now()}.${ext}`;
  return uploadPublicFile(LISTING_PHOTOS_BUCKET, path, buffer, contentType);
}
