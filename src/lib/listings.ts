import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Agent, Listing, ListingPhoto } from "@/lib/supabase/types";
import type { TemplateData } from "@/components/templates/types";

export type ListingWithPhotos = {
  listing: Listing;
  photos: ListingPhoto[];
};

/**
 * Scoped to `agent.id` so one agent can never load another's listing by
 * guessing an id. Returns null rather than 404ing so it works from both
 * App Router pages (via getListingForAgent below) and the Pages Router API
 * route that Puppeteer rendering has to live in (see src/lib/render).
 */
export async function findListingForAgent(
  listingId: string,
  agentId: string
): Promise<ListingWithPhotos | null> {
  const supabase = createServiceRoleClient();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("agent_id", agentId)
    .maybeSingle();

  if (listingError) throw listingError;
  if (!listing) return null;

  const { data: photos, error: photosError } = await supabase
    .from("listing_photos")
    .select("*")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });

  if (photosError) throw photosError;

  return { listing, photos: photos ?? [] };
}

/** App Router pages only — 404s via next/navigation if the listing isn't found/owned. */
export async function getListingForAgent(
  listingId: string,
  agentId: string
): Promise<ListingWithPhotos> {
  const result = await findListingForAgent(listingId, agentId);
  if (!result) notFound();
  return result;
}

export function toTemplateData(agent: Agent, { listing, photos }: ListingWithPhotos): TemplateData {
  const hero = photos.find((p) => p.is_hero) ?? photos[0] ?? null;
  const secondary = photos.filter((p) => p.id !== hero?.id).map((p) => p.photo_url);

  return {
    agent: {
      name: agent.name,
      brokerage: agent.brokerage,
      phone: agent.phone,
      email: agent.email,
      logoUrl: agent.logo_url,
      headshotUrl: agent.headshot_url,
      primaryColor: agent.brand_primary_color,
      secondaryColor: agent.brand_secondary_color,
      fontChoice: agent.font_choice,
    },
    listing: {
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
      price: listing.price,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      status: listing.status,
    },
    photos: {
      hero: hero?.photo_url ?? null,
      secondary,
    },
  };
}
