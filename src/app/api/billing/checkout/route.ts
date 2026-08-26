import { NextResponse, type NextRequest } from "next/server";
import { getOrCreateAgent } from "@/lib/agents";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const agent = await getOrCreateAgent();

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
  if (!priceId) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_STRIPE_PRICE_ID_PRO environment variable." },
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
