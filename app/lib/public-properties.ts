import { unstable_cache } from "next/cache";
import { supabase, TABLE, type Property } from "@/app/lib/db";

export const PUBLIC_PAGE_SIZE = 12;

const PROPERTY_CARD_SELECT = [
  "id",
  "slug",
  "title",
  "price",
  "images",
  "neighborhood",
  "zone",
  "bedrooms",
  "coveredArea",
  "lotArea",
  "featured",
  "category",
  "pool",
  "financing",
  "mortgageEligible",
].join(", ");

const HOME_FEATURED_SELECT = [
  "id",
  "slug",
  "title",
  "price",
  "images",
  "neighborhood",
  "zone",
  "bedrooms",
  "coveredArea",
  "category",
].join(", ");

type Category = "houses" | "lots" | "local";
type Sort = "" | "price_asc" | "price_desc" | "bedrooms";

export interface PublicPropertyFilters {
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
}

interface NormalizedFilters {
  category: Category | null;
  zone: string | null;
  q: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number | null;
  pool: boolean;
  financing: boolean;
  mortgageEligible: boolean;
  sort: Sort;
}

interface FilterQuery {
  eq(column: string, value: unknown): FilterQuery;
  ilike(column: string, value: string): FilterQuery;
  gte(column: string, value: number): FilterQuery;
  lte(column: string, value: number): FilterQuery;
  order(
    column: string,
    options: { ascending: boolean; nullsFirst?: boolean },
  ): FilterQuery;
  range(from: number, to: number): unknown;
}

function cleanText(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, 100);
  return trimmed.length > 0 ? trimmed : null;
}

function cleanQuery(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, 120);
  return trimmed.length > 0 ? trimmed : null;
}

function parsePositiveNumber(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parsePositiveInt(value?: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function normalizePublicFilters(
  filters: PublicPropertyFilters,
): NormalizedFilters {
  return {
    category:
      filters.category === "houses" ||
      filters.category === "lots" ||
      filters.category === "local"
        ? filters.category
        : null,
    zone: cleanText(filters.zone),
    q: cleanQuery(filters.q),
    minPrice: parsePositiveNumber(filters.minPrice),
    maxPrice: parsePositiveNumber(filters.maxPrice),
    minBedrooms: parsePositiveInt(filters.minBedrooms),
    pool: filters.pool === "1",
    financing: filters.financing === "1",
    mortgageEligible: filters.mortgageEligible === "1",
    sort:
      filters.sort === "price_asc" ||
      filters.sort === "price_desc" ||
      filters.sort === "bedrooms"
        ? filters.sort
        : "",
  };
}

function serializeFilters(filters: NormalizedFilters): string {
  return JSON.stringify(filters);
}

function applyFilters(query: FilterQuery, filters: NormalizedFilters) {
  let nextQuery = query;

  if (filters.category) nextQuery = nextQuery.eq("category", filters.category);
  if (filters.zone) nextQuery = nextQuery.ilike("zone", `%${filters.zone}%`);
  if (filters.q) nextQuery = nextQuery.ilike("title", `%${filters.q}%`);
  if (filters.minPrice != null) nextQuery = nextQuery.gte("price", filters.minPrice);
  if (filters.maxPrice != null) nextQuery = nextQuery.lte("price", filters.maxPrice);
  if (filters.minBedrooms != null) {
    nextQuery = nextQuery.gte("bedrooms", filters.minBedrooms);
  }
  if (filters.pool) nextQuery = nextQuery.eq("pool", true);
  if (filters.financing) nextQuery = nextQuery.eq("financing", true);
  if (filters.mortgageEligible) {
    nextQuery = nextQuery.eq("mortgageEligible", true);
  }

  return nextQuery;
}

function applySort(query: FilterQuery, sort: Sort) {
  if (sort === "price_asc") {
    return query.order("price", { ascending: true, nullsFirst: false });
  }
  if (sort === "price_desc") {
    return query.order("price", { ascending: false, nullsFirst: false });
  }
  if (sort === "bedrooms") {
    return query.order("bedrooms", { ascending: false, nullsFirst: false });
  }

  return query
    .order("featured", { ascending: false })
    .order("createdAt", { ascending: false });
}

export async function getCachedHomeData() {
  return unstable_cache(
    async () => {
      const db = supabase();
      const [featuredRes, countRes] = await Promise.all([
        db
          .from(TABLE)
          .select(HOME_FEATURED_SELECT)
          .eq("featured", true)
          .order("createdAt", { ascending: false })
          .limit(9),
        db.from(TABLE).select("id", { count: "exact", head: true }),
      ]);

      return {
        featured: (featuredRes.data ?? []) as unknown as Array<
          Pick<
            Property,
            | "id"
            | "slug"
            | "title"
            | "price"
            | "images"
            | "neighborhood"
            | "zone"
            | "bedrooms"
            | "coveredArea"
            | "category"
          >
        >,
        totalProperties: countRes.count ?? 0,
      };
    },
    ["public-home-data"],
    { revalidate: 1800, tags: ["properties"] },
  )();
}

export async function getCachedZones() {
  return unstable_cache(
    async () => {
      const { data } = await supabase()
        .from(TABLE)
        .select("zone")
        .not("zone", "is", null)
        .order("zone", { ascending: true });

      return [
        ...new Set(
          (data ?? [])
            .map((row: { zone: string | null }) => row.zone)
            .filter((zone): zone is string => Boolean(zone)),
        ),
      ];
    },
    ["public-property-zones"],
    { revalidate: 3600, tags: ["properties"] },
  )();
}

export async function getCachedPropertyList(
  rawFilters: PublicPropertyFilters,
  page: number,
) {
  const filters = normalizePublicFilters(rawFilters);
  const currentPage = Math.max(1, page || 1);
  const from = (currentPage - 1) * PUBLIC_PAGE_SIZE;
  const to = from + PUBLIC_PAGE_SIZE - 1;

  return unstable_cache(
    async () => {
      const db = supabase();
      const propertiesQuery = applySort(
        applyFilters(
          db.from(TABLE).select(PROPERTY_CARD_SELECT) as unknown as FilterQuery,
          filters,
        ),
        filters.sort,
      );
      const countQuery = applyFilters(
        db.from(TABLE).select("id", { count: "exact", head: true }) as unknown as FilterQuery,
        filters,
      );

      const [propertiesRes, countRes] = await Promise.all([
        propertiesQuery.range(from, to) as Promise<{
          data: unknown[] | null;
        }>,
        countQuery as unknown as Promise<{
          count: number | null;
        }>,
      ]);

      const totalCount = countRes.count ?? 0;

      return {
        properties: (propertiesRes.data ?? []) as unknown as Array<
          Pick<
            Property,
            | "id"
            | "slug"
            | "title"
            | "price"
            | "images"
            | "neighborhood"
            | "zone"
            | "bedrooms"
            | "coveredArea"
            | "lotArea"
            | "featured"
            | "category"
            | "pool"
            | "financing"
            | "mortgageEligible"
          >
        >,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / PUBLIC_PAGE_SIZE)),
      };
    },
    ["public-property-list", serializeFilters(filters), String(currentPage)],
    { revalidate: 1800, tags: ["properties"] },
  )();
}

export async function getCachedPropertyBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const { data } = await supabase()
        .from(TABLE)
        .select("*")
        .eq("slug", slug)
        .single();

      return (data as Property | null) ?? null;
    },
    ["public-property-detail", slug],
    { revalidate: 3600, tags: ["properties", `property:${slug}`] },
  )();
}

export async function getCachedPropertySlugs() {
  return unstable_cache(
    async () => {
      const { data } = await supabase()
        .from(TABLE)
        .select("slug, createdAt");

      return (data ?? []) as Array<Pick<Property, "slug" | "createdAt">>;
    },
    ["public-property-slugs"],
    { revalidate: 3600, tags: ["properties"] },
  )();
}
