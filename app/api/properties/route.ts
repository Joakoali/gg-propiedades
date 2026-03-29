export const runtime = "nodejs";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

/** Only allow HTTPS image URLs from known domains */
const ALLOWED_IMAGE_HOSTS = [
  "pub-bd2ec60177e8464ab87d64b45deb3958.r2.dev",
  "ggpropiedades.com",
  "www.ggpropiedades.com",
];

function isValidImageUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_IMAGE_HOSTS.some(
        (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`),
      )
    );
  } catch {
    return false;
  }
}

/** Parse int with bounds checking */
function safeInt(val: unknown, min = 0, max = 999999): number | null {
  if (val == null || val === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) || n < min || n > max ? null : n;
}

const VALID_CATEGORIES = ["houses", "lots", "local"] as const;

export async function GET() {
  //const session = await getServerSession(authOptions);
  //if (!session) return unauthorized();

  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(properties);
}

export async function POST(request: Request) {
  //const session = await getServerSession(authOptions);
  //if (!session) return unauthorized();

  try {
    const body = await request.json();
    if (
      !body.title ||
      typeof body.title !== "string" ||
      body.title.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "Título requerido (mín. 3 caracteres)" },
        { status: 400 },
      );
    }

    const title = body.title.trim().slice(0, 200);
    const category = VALID_CATEGORIES.includes(body.category)
      ? body.category
      : "houses";
    const images = Array.isArray(body.images)
      ? body.images.filter(isValidImageUrl)
      : [];

    const property = await prisma.property.create({
      data: {
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        title,
        price: body.price
          ? Math.max(0, parseFloat(body.price) || 0) || null
          : null,
        category,
        description:
          typeof body.description === "string"
            ? body.description.slice(0, 10000)
            : "",
        images,
        bedrooms: safeInt(body.bedrooms, 0, 50),
        coveredArea: safeInt(body.coveredArea),
        semiCoveredArea: safeInt(body.semiCoveredArea),
        lotArea: safeInt(body.lotArea),
        neighborhood:
          typeof body.neighborhood === "string"
            ? body.neighborhood.slice(0, 100)
            : null,
        zone: typeof body.zone === "string" ? body.zone.slice(0, 100) : null,
        pool: body.pool === true,
        financing: body.financing === true,
        mortgageEligible: body.mortgageEligible === true,
        featured: body.featured === true,
      },
    });
    return NextResponse.json(property);
  } catch {
    return NextResponse.json(
      { error: "Error al crear propiedad" },
      { status: 500 },
    );
  }
}
