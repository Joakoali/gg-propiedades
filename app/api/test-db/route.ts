// app/api/test-db/route.ts
import { supabase, TABLE } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { count, error } = await supabase()
      .from(TABLE)
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true, total: count });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message });
  }
}
