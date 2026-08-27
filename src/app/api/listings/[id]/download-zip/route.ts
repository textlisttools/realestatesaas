import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getOrCreateAgent } from "@/lib/agents";
import { getListingForAgent } from "@/lib/listings";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AssetType, GeneratedAsset } from "@/lib/supabase/types";

const ASSET_FILENAME: Record<AssetType, string> = {
  flyer_pdf: "flyer.pdf",
  ig_post: "instagram-post.png",
  ig_story: "instagram-story.png",
  fb_post: "facebook-post.png",
  tiktok_slideshow: "tiktok-slideshow.mp4",
};

/** One row per asset_type — the most recently generated of each. */
function latestPerType(assets: GeneratedAsset[]): GeneratedAsset[] {
  const byType = new Map<AssetType, GeneratedAsset>();
  for (const asset of assets) {
    const existing = byType.get(asset.asset_type);
    if (!existing || asset.created_at > existing.created_at) {
      byType.set(asset.asset_type, asset);
    }
  }
  return [...byType.values()];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getOrCreateAgent();
  const { listing } = await getListingForAgent(id, agent.id);

  const supabase = createServiceRoleClient();
  const { data: assets, error } = await supabase
    .from("generated_assets")
    .select("*")
    .eq("listing_id", id);
  if (error) throw error;

  const zip = new JSZip();
  for (const asset of latestPerType(assets)) {
    if (!asset.file_url) continue;
    const res = await fetch(asset.file_url);
    if (!res.ok) continue;
    const bytes = await res.arrayBuffer();
    zip.file(ASSET_FILENAME[asset.asset_type], bytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const filename = `${listing.address.replace(/[^a-z0-9]+/gi, "-")}-assets.zip`;

  // TS's stricter ArrayBuffer-vs-ArrayBufferLike typing (5.7+) flags this as
  // a mismatch because jszip's Uint8Array is generically typed over
  // ArrayBufferLike (which includes SharedArrayBuffer); at runtime it's a
  // plain heap-allocated ArrayBuffer, which BlobPart/BodyInit both accept.
  return new NextResponse(new Blob([zipBytes as BlobPart]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
