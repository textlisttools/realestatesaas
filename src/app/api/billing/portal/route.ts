import { NextResponse, type NextRequest } from "next/server";
import { getOrCreateAgent } from "@/lib/agents";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const agent = await getOrCreateAgent();
  if (!agent.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer on this account yet." }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = new URL(request.url).origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: agent.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });

  return NextResponse.redirect(session.url, 303);
}
