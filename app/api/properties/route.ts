import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const properties = await prisma.property.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return NextResponse.json(properties);
}
