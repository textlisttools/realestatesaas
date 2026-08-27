import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getOrCreateAgentForClerkUser } from "@/lib/agents";
import { findListingForAgent, toTemplateData } from "@/lib/listings";
import { generateTikTokSlideshow } from "@/lib/render/generateTikTokSlideshow";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 7;

// Same Pages Router / react-dom/server constraint as generate-assets.ts —
// see the comment there. Rendering up to 7 slides plus an ffmpeg encode is
// heavier than the existing 3-image pipeline; 60s is still the Hobby plan
// ceiling, so this is the one asset type most likely to need a paid plan's
// higher function duration if it times out in practice.
export const config: PageConfig = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const listingId = req.query.id;
  if (typeof listingId !== "string") {
    res.status(400).json({ error: "Missing listing id" });
    return;
  }

  const agent = await getOrCreateAgentForClerkUser(userId);
  const listingWithPhotos = await findListingForAgent(listingId, agent.id);
  if (!listingWithPhotos) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const rawSelected = req.body?.photo_ids;
  const selectedIds: string[] = Array.isArray(rawSelected)
    ? rawSelected
    : typeof rawSelected === "string"
      ? [rawSelected]
      : [];

  // Preserves listing_photos.sort_order regardless of checkbox submission order.
  const selectedPhotos = listingWithPhotos.photos.filter((p) => selectedIds.includes(p.id));

  if (selectedPhotos.length < MIN_PHOTOS || selectedPhotos.length > MAX_PHOTOS) {
    res
      .status(400)
      .json({ error: `Select between ${MIN_PHOTOS} and ${MAX_PHOTOS} photos.` });
    return;
  }

  const data = toTemplateData(agent, listingWithPhotos);
  await generateTikTokSlideshow(
    listingId,
    data,
    selectedPhotos.map((p) => p.photo_url)
  );

  res.redirect(303, `/dashboard/listings/${listingId}`);
}
