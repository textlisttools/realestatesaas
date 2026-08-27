import {
  formatCityStateZip,
  formatPrice,
  formatStats,
  statusBanner,
} from "@/components/templates/format";
import type { TemplateData } from "@/components/templates/types";

export type SlideCaption = { title: string; subtitle: string | null };

/**
 * One caption per photo, cycling through address/price/stats if there are
 * more photos than captions in the pool. The last slide is always reserved
 * for a closing "contact the agent" card, regardless of how many photos
 * were selected (3-7).
 */
export function buildTikTokSlideCaptions(
  data: TemplateData,
  photoCount: number
): SlideCaption[] {
  const { agent, listing } = data;

  const amenityCaptions: SlideCaption[] = [
    { title: listing.address, subtitle: formatCityStateZip(listing) || null },
    { title: formatPrice(listing.price), subtitle: statusBanner(listing.status) },
    { title: formatStats(listing) || "Schedule a tour today", subtitle: null },
  ];

  const bodyCount = Math.max(photoCount - 1, 0);
  const captions: SlideCaption[] = [];
  for (let i = 0; i < bodyCount; i++) {
    captions.push(amenityCaptions[i % amenityCaptions.length]);
  }

  if (photoCount > 0) {
    captions.push({
      title: agent.name ? `Interested? Contact ${agent.name}` : "Interested? Get in touch",
      subtitle: agent.phone ?? agent.email ?? null,
    });
  }

  return captions;
}
