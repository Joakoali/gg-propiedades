import { supabase, TABLE, generateId } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";

const ADMIN_PROPERTY_LIST_SELECT = [
  "id",
  "slug",
  "title",
  "category",
  "price",
  "zone",
  "neighborhood",
  "images",
  "featured",
  "bedrooms",
].join(", ");

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

function revalidatePublicPropertyData() {
  revalidateTag("properties", "max");
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
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { data, error } = await supabase()
    .from(TABLE)
    .select(ADMIN_PROPERTY_LIST_SELECT)
    .order("createdAt", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

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

    const row = {
      id: generateId(),
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
    };

    const { data, error } = await supabase()
      .from(TABLE)
      .insert(row)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePublicPropertyData();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Error al crear propiedad" },
      { status: 500 },
    );
  }
}
