import type { ListingStatus } from "@/lib/supabase/types";
import type { TemplateListing } from "./types";

const FONT_STACKS: Record<string, string> = {
  inter: '"Inter", "Helvetica Neue", Arial, sans-serif',
  playfair: '"Playfair Display", Georgia, serif',
  montserrat: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
  "roboto-slab": '"Roboto Slab", Georgia, serif',
};

export function fontStack(fontChoice: string): string {
  return FONT_STACKS[fontChoice] ?? FONT_STACKS.inter;
}

const GOOGLE_FONTS_FAMILY: Record<string, string> = {
  inter: "Inter:wght@400;600;700",
  playfair: "Playfair+Display:wght@400;600;700",
  montserrat: "Montserrat:wght@400;600;700",
  "roboto-slab": "Roboto+Slab:wght@400;600;700",
};

/** Used only by the Puppeteer render pipeline, which sets raw HTML without Next's font optimization. */
export function googleFontsHref(fontChoice: string): string {
  const family = GOOGLE_FONTS_FAMILY[fontChoice] ?? GOOGLE_FONTS_FAMILY.inter;
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}

export function formatPrice(price: number | null): string {
  if (price === null) return "Price upon request";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatAddress(listing: TemplateListing): string {
  return listing.address;
}

export function formatCityStateZip(listing: TemplateListing): string {
  return [listing.city, [listing.state, listing.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

export function formatStats(listing: TemplateListing): string {
  const parts: string[] = [];
  if (listing.beds !== null) parts.push(`${listing.beds} bd`);
  if (listing.baths !== null) parts.push(`${listing.baths} ba`);
  if (listing.sqft !== null) {
    parts.push(`${new Intl.NumberFormat("en-US").format(listing.sqft)} sqft`);
  }
  return parts.join("  •  ");
}

const STATUS_BANNER: Record<ListingStatus, string> = {
  active: "FOR SALE",
  just_listed: "JUST LISTED",
  pending: "PENDING",
  sold: "SOLD",
};

export function statusBanner(status: ListingStatus): string {
  return STATUS_BANNER[status];
}
