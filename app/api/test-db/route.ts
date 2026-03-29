// app/api/test-db/route.ts
export const runtime = "nodejs";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const count = await prisma.property.count();
    return NextResponse.json({ ok: true, total: count });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message });
  }
}
