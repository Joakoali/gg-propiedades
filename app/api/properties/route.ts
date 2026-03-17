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

export async function POST(request: Request) {
  const body = await request.json();

  const property = await prisma.property.create({
    data: {
      slug: body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      title: body.title,
      price: body.price ? parseFloat(body.price) : null,
      category: body.category,
      description: body.description,
      images: [],
      bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
      coveredArea: body.coveredArea ? parseInt(body.coveredArea) : null,
      semiCoveredArea: body.semiCoveredArea
        ? parseInt(body.semiCoveredArea)
        : null,
      lotArea: body.lotArea ? parseInt(body.lotArea) : null,
      neighborhood: body.neighborhood || null,
      zone: body.zone || null,
      pool: body.pool,
      financing: body.financing,
      mortgageEligible: body.mortgageEligible,
      featured: body.featured,
    },
  });
  return NextResponse.json(property);
}
