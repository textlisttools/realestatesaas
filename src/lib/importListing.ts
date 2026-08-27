import * as cheerio from "cheerio";

export type ParsedListing = {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  description: string | null;
  mlsNumber: string | null;
  photoUrls: string[];
};

const MAX_PHOTO_URLS = 8;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asNumberLike(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const num = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function firstNumberMatch(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const num = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

function extractJsonLdBlocks($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const record = asRecord(item);
        if (!record) continue;
        blocks.push(record);
        const graph = record["@graph"];
        if (Array.isArray(graph)) {
          for (const g of graph) {
            const gRecord = asRecord(g);
            if (gRecord) blocks.push(gRecord);
          }
        }
      }
    } catch {
      // Malformed JSON-LD on the page — ignore this block and keep looking.
    }
  });
  return blocks;
}

/** Blocks fetches to loopback/private/link-local hosts as basic SSRF hardening. Not exhaustive
 * (doesn't cover DNS rebinding), but this endpoint is only reachable by authenticated agents. */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 127) return true; // loopback
    if (a === 0) return true;
    if (a === 10) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
  }
  return false;
}

export function parseListingFromHtml(html: string, sourceUrl: string): ParsedListing {
  const $ = cheerio.load(html);
  const base = new URL(sourceUrl);

  const result: ParsedListing = {
    address: null,
    city: null,
    state: null,
    zip: null,
    price: null,
    beds: null,
    baths: null,
    sqft: null,
    description: null,
    mlsNumber: null,
    photoUrls: [],
  };

  const rawPhotoUrls: string[] = [];

  for (const block of extractJsonLdBlocks($)) {
    const type = block["@type"];
    const typeStr = Array.isArray(type) ? type.join(" ") : String(type ?? "");
    const looksLikeListing = /residence|realestate|house|product|apartment|singlefamily/i.test(
      typeStr
    );

    const addr = asRecord(block["address"]);
    if (addr) {
      result.address ??= asString(addr["streetAddress"]);
      result.city ??= asString(addr["addressLocality"]);
      result.state ??= asString(addr["addressRegion"]);
      result.zip ??= asString(addr["postalCode"]);
    }

    const offers = asRecord(block["offers"]);
    result.price ??= offers ? asNumberLike(offers["price"]) : null;
    result.price ??= asNumberLike(block["price"]);

    result.description ??= asString(block["description"]);

    if (looksLikeListing) {
      result.address ??= asString(block["name"]);
    }

    result.beds ??= asNumberLike(block["numberOfBedrooms"] ?? block["numberOfRooms"]);
    result.baths ??= asNumberLike(
      block["numberOfBathroomsTotal"] ?? block["numberOfBathrooms"]
    );

    const floorSize = asRecord(block["floorSize"]);
    if (floorSize) result.sqft ??= asNumberLike(floorSize["value"]);

    const images = block["image"];
    if (typeof images === "string") rawPhotoUrls.push(images);
    if (Array.isArray(images)) {
      for (const img of images) {
        if (typeof img === "string") {
          rawPhotoUrls.push(img);
        } else {
          const rec = asRecord(img);
          const u = rec && asString(rec["url"]);
          if (u) rawPhotoUrls.push(u);
        }
      }
    }
  }

  // Open Graph fallback
  const ogTitle = $('meta[property="og:title"]').attr("content");
  result.description ??= asString($('meta[property="og:description"]').attr("content") ?? null);
  $('meta[property="og:image"]').each((_, el) => {
    const c = $(el).attr("content");
    if (c) rawPhotoUrls.push(c);
  });

  // Microdata fallback for address parts
  result.address ??= asString($('[itemprop="streetAddress"]').first().text() || null);
  result.city ??= asString($('[itemprop="addressLocality"]').first().text() || null);
  result.state ??= asString($('[itemprop="addressRegion"]').first().text() || null);
  result.zip ??= asString($('[itemprop="postalCode"]').first().text() || null);

  // Visible-text regex fallback — matches the "4 bd · 2 ba · 1,772 sqft" style
  // text most IDX platforms render regardless of markup structure.
  const text = $("body").text().replace(/\s+/g, " ").trim();
  result.price ??= firstNumberMatch(text, /\$\s?([\d,]{4,})/);
  result.beds ??= firstNumberMatch(text, /(\d+(?:\.\d+)?)\s*(?:bd|beds?|bedrooms?)\b/i);
  result.baths ??= firstNumberMatch(text, /(\d+(?:\.\d+)?)\s*(?:ba|baths?|bathrooms?)\b/i);
  result.sqft ??= firstNumberMatch(text, /([\d,]{3,})\s*sq\s*\.?\s*ft/i);

  const mlsMatch = text.match(/MLS\s*(?:®|#)?\s*:?\s*([A-Za-z0-9-]{4,})/i);
  result.mlsNumber ??= mlsMatch ? mlsMatch[1] : null;

  if (!result.address) {
    result.address = asString(ogTitle ?? null) ?? asString($("title").first().text() || null);
  }

  // Fallback: scan <img> tags if neither JSON-LD nor og:image found anything.
  if (rawPhotoUrls.length === 0) {
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src) rawPhotoUrls.push(src);
    });
  }

  const seen = new Set<string>();
  for (const raw of rawPhotoUrls) {
    if (result.photoUrls.length >= MAX_PHOTO_URLS) break;
    let resolved: string;
    try {
      resolved = new URL(raw, base).toString();
    } catch {
      continue;
    }
    if (seen.has(resolved)) continue;
    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(resolved)) continue;
    if (/logo|icon|avatar|sprite|placeholder/i.test(resolved)) continue;
    if (isBlockedHost(new URL(resolved).hostname)) continue;
    seen.add(resolved);
    result.photoUrls.push(resolved);
  }

  return result;
}

export async function fetchAndParseListing(url: string): Promise<ParsedListing> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must start with http:// or https://");
  }
  if (isBlockedHost(parsed.hostname)) {
    throw new Error("That URL isn't allowed.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    throw new Error("Couldn't reach that URL. Check the link and try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`That page returned an error (${response.status}).`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    throw new Error("That URL doesn't look like a web page.");
  }

  const html = await response.text();
  const listing = parseListingFromHtml(html, parsed.toString());

  const foundAnything =
    listing.address ||
    listing.price !== null ||
    listing.beds !== null ||
    listing.baths !== null ||
    listing.sqft !== null ||
    listing.photoUrls.length > 0;

  if (!foundAnything) {
    throw new Error("Couldn't find listing details on that page — try entering them manually.");
  }

  return listing;
}
