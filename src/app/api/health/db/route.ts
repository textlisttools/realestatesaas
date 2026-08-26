import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const EXPECTED_TABLES = [
  "agents",
  "listings",
  "listing_photos",
  "generated_assets",
] as const;

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    const results = await Promise.all(
      EXPECTED_TABLES.map(async (table) => {
        const { error, count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        return { table, ok: !error, error: error?.message, count };
      })
    );

    const ok = results.every((r) => r.ok);
    return NextResponse.json({ ok, tables: results }, { status: ok ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
