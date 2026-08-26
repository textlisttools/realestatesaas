import { NextResponse, type NextRequest } from "next/server";
import { getOrCreateAgent } from "@/lib/agents";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe, isPaidTier, priceIdForTier } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const agent = await getOrCreateAgent();

  const formData = await request.formData();
  const tierInput = formData.get("tier");
  if (typeof tierInput !== "string" || !isPaidTier(tierInput)) {
    return NextResponse.json({ error: "Missing or invalid tier." }, { status: 400 });
  }

  const priceId = priceIdForTier(tierInput);
  if (!priceId) {
    return NextResponse.json(
      { error: `Missing price id environment variable for tier "${tierInput}".` },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const origin = new URL(request.url).origin;

  let customerId = agent.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: agent.email ?? undefined,
      name: agent.name ?? undefined,
      metadata: { agent_id: agent.id },
    });
    customerId = customer.id;

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("agents")
      .update({ stripe_customer_id: customerId })
      .eq("id", agent.id);
    if (error) throw error;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/dashboard`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
  }

  return NextResponse.redirect(session.url, 303);
}
