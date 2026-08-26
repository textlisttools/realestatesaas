import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getOrCreateAgentForClerkUser } from "@/lib/agents";
import { findListingForAgent, toTemplateData } from "@/lib/listings";
import { generateListingAssets } from "@/lib/render/generateAssets";

// Deliberately a Pages Router API route, not an App Router Route Handler:
// generateListingAssets pulls in react-dom/server (via Puppeteer's HTML
// rendering step), and Next.js forces a "react-server" module resolution
// condition on everything reachable from src/app — including Route
// Handlers — which breaks react-dom/server outright. Pages Router routes
// are a separate module graph and aren't subject to that, so this is the
// supported escape hatch. The "Generate assets" button on the listing
// detail page posts here directly via a plain HTML form.
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

  const data = toTemplateData(agent, listingWithPhotos);
  await generateListingAssets(listingId, data);

  res.redirect(303, `/dashboard/listings/${listingId}`);
}
