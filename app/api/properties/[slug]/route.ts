import { supabase, TABLE } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";

type Params = { params: Promise<{ slug: string }> };

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

function revalidatePublicPropertyData(_slug: string) {
  // revalidation handled by page-level revalidate = 60
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

function safeInt(val: unknown, min = 0, max = 999999): number | null {
  if (val == null || val === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) || n < min || n > max ? null : n;
}

const VALID_CATEGORIES = ["houses", "lots", "local"] as const;

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { slug } = await params;
  const db = supabase();

  // Check existence
  const { data: existing } = await db
    .from(TABLE)
    .select("id")
    .eq("slug", slug)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const { error } = await db.from(TABLE).delete().eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePublicPropertyData(slug);

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  try {
    const { slug } = await params;
    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim().slice(0, 200)
        : undefined;
    const category = VALID_CATEGORIES.includes(body.category)
      ? body.category
      : undefined;
    const images = Array.isArray(body.images)
      ? body.images.filter(isValidImageUrl)
      : [];

    const updateData: Record<string, unknown> = {
      price: body.price
        ? Math.max(0, parseFloat(body.price) || 0) || null
        : null,
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
      featuredOrder: body.featured === true ? safeInt(body.featuredOrder, 1, 9) : null,
    };

    if (title) updateData.title = title;
    if (category) updateData.category = category;

    const { data, error } = await supabase()
      .from(TABLE)
      .update(updateData)
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePublicPropertyData(slug);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
