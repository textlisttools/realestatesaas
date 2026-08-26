import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/resend";

const RETENTION_CODE = "WELCOME10";
const RETENTION_DAYS = 14;

// Triggered by Vercel Cron (see vercel.json) once daily. Vercel sends
// `Authorization: Bearer $CRON_SECRET` automatically when that env var is
// set — checking it here stops anyone else from hitting this route to spam
// every eligible free-tier agent with an email on demand.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Missing CRON_SECRET environment variable." },
      { status: 500 }
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    return NextResponse.json(
      { error: "Missing RESEND_FROM_EMAIL environment variable." },
      { status: 500 }
    );
  }

  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: agents, error } = await supabase
    .from("agents")
    .select("*")
    .eq("subscription_tier", "free")
    .is("retention_code_sent_at", null)
    .lte("created_at", cutoff)
    .not("email", "is", null);
  if (error) throw error;

  const resend = getResend();
  let sent = 0;
  const failures: string[] = [];

  for (const agent of agents) {
    if (!agent.email) continue;

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: agent.email,
      subject: "10 extra listings, on us",
      html: `<p>Hi${agent.name ? ` ${agent.name}` : ""},</p>
<p>You've been on the free plan for a couple weeks — here's a code for 10 extra listings, so you can keep generating flyers and social posts.</p>
<p style="font-size:20px;font-weight:bold;letter-spacing:2px;">${RETENTION_CODE}</p>
<p>Enter it on your dashboard under "Have a code?" to apply it.</p>`,
    });

    if (sendError) {
      failures.push(agent.id);
      continue;
    }

    const { error: updateError } = await supabase
      .from("agents")
      .update({ retention_code_sent_at: new Date().toISOString() })
      .eq("id", agent.id);
    if (updateError) throw updateError;

    sent++;
  }

  return NextResponse.json({ checked: agents.length, sent, failed: failures });
}
