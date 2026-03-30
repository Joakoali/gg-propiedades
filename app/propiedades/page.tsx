export const runtime = "nodejs";
import { supabase, TABLE, type Property } from "@/app/lib/db";
import { Suspense } from "react";
type Category = "houses" | "lots" | "local";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/app/lib/utils";
import Filters from "./Filters";
import PropertyCard from "@/app/components/PropertyCard";

const PAGE_SIZE = 12;

export const metadata = {
  title: "Propiedades",
  description: "Explorá todas nuestras propiedades en venta en Zona Norte GBA.",
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    zone?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    minBedrooms?: string;
    pool?: string;
    financing?: string;
    mortgageEligible?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function PropiedadesPage({ searchParams }: PageProps) {
  const {
    category,
    zone,
    q,
    minPrice,
    maxPrice,
    minBedrooms,
    pool,
    financing,
    mortgageEligible,
    sort,
    page: pageParam,
  } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const db = supabase();

  // ── Build the main query with filters ──
  function applyFilters(query: any) {
    let q2 = query;
    if (category && ["houses", "lots", "local"].includes(category))
      q2 = q2.eq("category", category as Category);
    if (zone) q2 = q2.ilike("zone", `%${zone}%`);
    if (q) q2 = q2.ilike("title", `%${q}%`);
    if (minPrice) q2 = q2.gte("price", parseFloat(minPrice));
    if (maxPrice) q2 = q2.lte("price", parseFloat(maxPrice));
    if (minBedrooms) q2 = q2.gte("bedrooms", parseInt(minBedrooms));
    if (pool === "1") q2 = q2.eq("pool", true);
    if (financing === "1") q2 = q2.eq("financing", true);
    if (mortgageEligible === "1") q2 = q2.eq("mortgageEligible", true);
    return q2;
  }

  // Apply sort
  function applySort(query: ReturnType<typeof db.from>) {
    if (sort === "price_asc") return query.order("price", { ascending: true, nullsFirst: false });
    if (sort === "price_desc") return query.order("price", { ascending: false, nullsFirst: false });
    if (sort === "bedrooms") return query.order("bedrooms", { ascending: false, nullsFirst: false });
    return query
      .order("featured", { ascending: false })
      .order("createdAt", { ascending: false });
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Run all three queries in parallel
  const [propertiesRes, countRes, zonesRes] = await Promise.all([
    applySort(
      applyFilters(db.from(TABLE).select("*"))
    ).range(from, to),

    applyFilters(
      db.from(TABLE).select("*", { count: "exact", head: true })
    ),

    db
      .from(TABLE)
      .select("zone")
      .not("zone", "is", null)
      .order("zone", { ascending: true }),
  ]);

  const properties = (propertiesRes.data ?? []) as Property[];
  const totalCount = countRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Deduplicate zones
  const zoneList = [
    ...new Set(
      (zonesRes.data ?? [])
        .map((z: { zone: string | null }) => z.zone as string)
        .filter(Boolean)
    ),
  ];

  // Build base URL for pagination links (preserve all current filters)
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (zone) params.set("zone", zone);
  if (q) params.set("q", q);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (minBedrooms) params.set("minBedrooms", minBedrooms);
  if (pool) params.set("pool", pool);
  if (financing) params.set("financing", financing);
  if (mortgageEligible) params.set("mortgageEligible", mortgageEligible);
  if (sort) params.set("sort", sort);

  function pageUrl(page: number) {
    const p = new URLSearchParams(params);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    return `/propiedades${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>
      {/* Banner */}
      <div
        className="relative flex items-end pb-10 pt-32 overflow-hidden"
        style={{ background: "var(--color-primary)", minHeight: "220px" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "url('/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="section-container relative z-10">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--color-gold)" }}
          >
            Catálogo completo
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white">
            Propiedades
          </h1>
          <p className="text-white/50 mt-2 text-sm">
            {totalCount} propiedad{totalCount !== 1 ? "es" : ""} encontrada
            {totalCount !== 1 ? "s" : ""}
            {category ? ` en ${CATEGORY_LABELS[category] ?? category}` : ""}
            {zone ? ` · ${zone}` : ""}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="section-container py-10">
        <div className="mb-8">
          <Suspense
            fallback={
              <div className="h-12 bg-white rounded-2xl card-shadow animate-pulse" />
            }
          >
            <Filters
              zones={zoneList}
              currentCategory={category ?? ""}
              currentZone={zone ?? ""}
            />
          </Suspense>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <div className="size-16 rounded-2xl bg-white flex items-center justify-center card-shadow">
              <Home
                size={28}
                style={{ color: "var(--color-muted-foreground)" }}
              />
            </div>
            <p className="text-lg font-display font-semibold">
              No hay propiedades con esos filtros
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Probá ajustando la búsqueda o eliminá algún filtro.
            </p>
            <Link
              href="/propiedades"
              className="mt-2 text-sm font-medium underline"
              style={{ color: "var(--color-gold-dark)" }}
            >
              Ver todas las propiedades
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} detailed />
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-2 mt-12"
                aria-label="Paginación"
              >
                {currentPage > 1 ? (
                  <Link
                    href={pageUrl(currentPage - 1)}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-[--color-border] card-shadow hover:border-[--color-gold] transition-colors"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/50 border border-[--color-border] opacity-40 cursor-not-allowed">
                    <ChevronLeft size={14} /> Anterior
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1,
                    )
                    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1)
                        acc.push("ellipsis");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "ellipsis" ? (
                        <span
                          key={`e${i}`}
                          className="px-2 text-sm"
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          ...
                        </span>
                      ) : (
                        <Link
                          key={item}
                          href={pageUrl(item as number)}
                          className={`size-10 rounded-xl text-sm font-medium flex items-center justify-center transition-colors ${
                            item === currentPage
                              ? "text-white"
                              : "bg-white border border-[--color-border] card-shadow hover:border-[--color-gold]"
                          }`}
                          style={
                            item === currentPage
                              ? { background: "var(--color-primary)" }
                              : undefined
                          }
                        >
                          {item}
                        </Link>
                      ),
                    )}
                </div>

                {currentPage < totalPages ? (
                  <Link
                    href={pageUrl(currentPage + 1)}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-[--color-border] card-shadow hover:border-[--color-gold] transition-colors"
                  >
                    Siguiente <ChevronRight size={14} />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/50 border border-[--color-border] opacity-40 cursor-not-allowed">
                    Siguiente <ChevronRight size={14} />
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
