import Stripe from "stripe";
import type { SubscriptionTier } from "@/lib/supabase/types";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  cached = new Stripe(secretKey);
  return cached;
}

export const FREE_TIER_LISTING_LIMIT = 3;

export type PaidTier = "pro" | "premium";

export const PAID_TIERS: { tier: PaidTier; label: string; displayPrice: string }[] = [
  { tier: "pro", label: "Pro", displayPrice: "$29/mo" },
  { tier: "premium", label: "Premium", displayPrice: "$49/mo" },
];

const PRICE_ENV_VAR: Record<PaidTier, string> = {
  pro: "NEXT_PUBLIC_STRIPE_PRICE_ID_PRO",
  premium: "NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM",
};

export function isPaidTier(value: string): value is PaidTier {
  return value === "pro" || value === "premium";
}

export function priceIdForTier(tier: PaidTier): string | undefined {
  return process.env[PRICE_ENV_VAR[tier]];
}

/** Reverse lookup used by the webhook to turn a subscription's price back into a tier. */
export function tierForPriceId(priceId: string): SubscriptionTier {
  for (const { tier } of PAID_TIERS) {
    if (priceIdForTier(tier) === priceId) return tier;
  }
  return "free";
}
