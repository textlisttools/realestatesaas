"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateAgent } from "@/lib/agents";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { uploadListingPhoto } from "@/lib/supabase/storage";
import { consumeListingQuota } from "@/lib/quota";
import { FREE_TIER_LISTING_LIMIT } from "@/lib/stripe";
import type { ListingStatus } from "@/lib/supabase/types";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS = 12;
const STATUSES: ListingStatus[] = ["active", "just_listed", "pending", "sold"];

function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(formData: FormData, key: string): number | null {
  const value = readString(formData, key);
  if (value === null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createListing(formData: FormData) {
  const agent = await getOrCreateAgent();

  // The actual enforcement point (the page only hides the form as a
  // convenience) — also atomically spends a bonus listing here if the
  // agent is over their monthly free limit but has redeemed bonus ones.
  if (!(await consumeListingQuota(agent))) {
    throw new Error(
      `Free plan is limited to ${FREE_TIER_LISTING_LIMIT} listings/month. Redeem a code or upgrade to Pro/Premium for more.`
    );
  }

  const address = readString(formData, "address");
  if (!address) throw new Error("Address is required");

  const statusInput = readString(formData, "status");
  const status: ListingStatus = STATUSES.includes(statusInput as ListingStatus)
    ? (statusInput as ListingStatus)
    : "active";

  const supabase = createServiceRoleClient();

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      agent_id: agent.id,
      address,
      city: readString(formData, "city"),
      state: readString(formData, "state"),
      zip: readString(formData, "zip"),
      price: readNumber(formData, "price"),
      beds: readNumber(formData, "beds"),
      baths: readNumber(formData, "baths"),
      sqft: readNumber(formData, "sqft"),
      status,
      description: readString(formData, "description"),
      mls_number: readString(formData, "mls_number"),
    })
    .select("*")
    .single();

  if (insertError) throw insertError;

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_PHOTOS);

  for (const [index, photo] of photos.entries()) {
    if (photo.size > MAX_FILE_BYTES) {
      throw new Error(`${photo.name} is over 8MB`);
    }
    const photoUrl = await uploadListingPhoto(listing.id, index, photo);
    const { error: photoError } = await supabase.from("listing_photos").insert({
      listing_id: listing.id,
      photo_url: photoUrl,
      sort_order: index,
      is_hero: index === 0,
    });
    if (photoError) throw photoError;
  }

  revalidatePath("/dashboard/listings");
  redirect("/dashboard/listings");
}
