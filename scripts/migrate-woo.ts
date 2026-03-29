/**
 * Script de migración: WooCommerce → Supabase (Prisma)
 * Correr con: npx tsx scripts/migrate-woo.ts
 *
 * En modo DRY RUN (por defecto) solo muestra qué se importaría.
 * Para insertar de verdad: npx tsx scripts/migrate-woo.ts --insert
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const WC_URL         = "https://ggpropiedades.com";
const CONSUMER_KEY   = "ck_9888203d848da70791ccc55c98c404854bf0bee1";
const CONSUMER_SEC   = "cs_e17aa1474e8a7d3b764bceb2fd0dcedd73b36d18";

// Mapeá los slugs/nombres de categorías de WooCommerce a tu schema
const CATEGORY_MAP: Record<string, "houses" | "lots" | "local"> = {
  casa:      "houses",
  casas:     "houses",
  house:     "houses",
  houses:    "houses",
  terreno:   "lots",
  terrenos:  "lots",
  lote:      "lots",
  lot:       "lots",
  lots:      "lots",
  local:     "local",
  locales:   "local",
  comercial: "local",
};

// Nombres de atributos/meta que pueden contener cada campo
// (ajustar si difieren en tu WooCommerce)
const ATTR = {
  bedrooms:         ["dormitorios", "bedrooms", "ambientes", "habitaciones"],
  coveredArea:      ["metros_cubiertos", "m2_cubiertos", "superficie_cubierta", "covered_area"],
  semiCoveredArea:  ["metros_semi", "m2_semi", "semi_cubiertos", "semi_covered"],
  lotArea:          ["metros_lote", "m2_lote", "lote", "lot_area", "terreno_m2"],
  neighborhood:     ["barrio", "neighborhood", "urbanizacion"],
  zone:             ["zona", "zone", "localidad", "ciudad"],
  pool:             ["pileta", "pool", "piscina"],
  financing:        ["financiacion", "financing", "financiamiento"],
  mortgageEligible: ["apto_credito", "credito_hipotecario", "mortgage"],
};
// ───────────────────────────────────────────────────────────────────────────

const DRY_RUN = !process.argv.includes("--insert");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

// ── Parser de título/descripción ─────────────────────────────────────────────

// Zonas conocidas de la zona norte GBA (orden: más específico primero)
const KNOWN_ZONES: [RegExp, string][] = [
  [/pilar\s+del\s+este/i,              "Pilar del Este"],
  [/pilar\s+del\s+lago/i,              "Pilar del Lago"],
  [/bel[eé]n\s+de\s+escobar/i,         "Belén de Escobar"],
  [/ing(?:eniero)?\s+maschwitz/i,      "Ingeniero Maschwitz"],
  [/capilla\s+del\s+se[ñn]or/i,        "Capilla del Señor"],
  [/exaltaci[oó]n\s+de\s+la\s+cruz/i,  "Exaltación de la Cruz"],
  [/los\s+cardales/i,                  "Los Cardales"],
  [/\bcardales\b/i,                    "Cardales"],
  [/\bcampa[ñn]a\b/i,                  "Campana"],
  [/\bcaama[ñn]o\b/i,                  "Caamaño"],
  [/\bmanzanares\b/i,                  "Manzanares"],
  // San Sebastián y El Cantón son barrios dentro de Escobar/Pilar
  [/san\s+sebasti[aá]n/i,              "Escobar"],
  [/el\s+cant[oó]n/i,                  "Escobar"],
  [/puertos?\s+del\s+lago/i,           "Escobar"],
  [/\bescobar\b/i,                     "Escobar"],
  [/\bpilar\b/i,                       "Pilar"],
];

function parseFromTitle(title: string, description: string): {
  bedrooms:         number | null;
  coveredArea:      number | null;
  semiCoveredArea:  number | null;
  lotArea:          number | null;
  neighborhood:     string | null;
  zone:             string | null;
  pool:             boolean;
  financing:        boolean;
  mortgageEligible: boolean;
} {
  const text = `${title} ${description.replace(/<[^>]*>/g, " ")}`;

  // Dormitorios
  const bedroomsMatch = text.match(/(\d+)\s*dormitorios?/i);
  const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : null;

  // Metros cubiertos (ej: "280m2 cubiertos")
  const coveredMatch = text.match(/(\d+)\s*m[²2]\s*(?:cubiertos?)/i);
  const coveredArea = coveredMatch ? parseInt(coveredMatch[1]) : null;

  // Metros semi cubiertos
  const semiMatch = text.match(/(\d+)\s*m[²2]\s*(?:semi)/i);
  const semiCoveredArea = semiMatch ? parseInt(semiMatch[1]) : null;

  // Metros de lote (ej: "1075m2" o "600m2 de lote")
  // Busca el PRIMER número + m2 que no sea "cubiertos"
  const lotMatches = [...text.matchAll(/(\d+)\s*m[²2]/gi)];
  let lotArea: number | null = null;
  for (const m of lotMatches) {
    const after = text.slice(m.index! + m[0].length, m.index! + m[0].length + 20).toLowerCase();
    if (!after.includes("cubierto") && !after.includes("semi")) {
      lotArea = parseInt(m[1]);
      break;
    }
  }

  // Features
  const pool             = /pileta|piscina/i.test(text);
  const financing        = /financi/i.test(text);
  const mortgageEligible = /apto\s*cr[eé]dito|cr[eé]dito\s*hipotecario/i.test(text);

  // Zona — busca en orden de especificidad
  let zone: string | null = null;
  for (const [pattern, label] of KNOWN_ZONES) {
    if (pattern.test(text)) { zone = label; break; }
  }

  // Barrio — detectar barrios conocidos primero, luego parseo genérico
  const KNOWN_NEIGHBORHOODS: [RegExp, string][] = [
    [/san\s+sebasti[aá]n/i,    "San Sebastián"],
    [/el\s+cant[oó]n/i,        "El Cantón"],
    [/puertos?\s+del\s+lago/i, "Puertos del Lago"],
    [/santa\s+elisa/i,         "Santa Elisa"],
    [/santa\s+sof[ií]a/i,      "Santa Sofía"],
    [/santa\s+emilia/i,        "Santa Emilia"],
    [/santa\s+elena/i,         "Santa Elena"],
    [/santa\s+lucia/i,         "Santa Lucía"],
    [/santa\s+guadalupe/i,     "Santa Guadalupe"],
    [/san\s+ramon/i,           "San Ramón"],
    [/san\s+ramiro/i,          "San Ramiro"],
    [/san\s+alfonso/i,         "San Alfonso"],
    [/san\s+pablo/i,           "San Pablo"],
    [/san\s+mat[ií]as/i,       "San Matías"],
    [/la\s+ca[ñn]ada/i,        "La Cañada de Pilar"],
    [/country\s+roda/i,        "Country Roda"],
    [/loma\s+verde/i,          "Loma Verde"],
    [/\bmirabosques\b/i,       "Mirabosques"],
    [/barrio\s+monet/i,        "Barrio Monet"],
    [/las\s+mar[ií]as/i,       "Las Marías"],
    [/la\s+estela/i,           "La Estela"],
    [/la\s+cuesta/i,           "La Cuesta"],
    [/praderas\s+de\s+cardales/i, "Praderas de Cardales"],
    [/ecoislandia/i,           "Ecoislandia"],
    [/club\s+bamboo/i,         "Club Bamboo"],
    [/\briberas\b/i,           "Riberas"],
    [/pilar[a]/i,              "Pilará"],
    [/\bmuelles\b/i,           "Muelles"],
  ];

  let neighborhood: string | null = null;
  for (const [pattern, label] of KNOWN_NEIGHBORHOODS) {
    if (pattern.test(title)) { neighborhood = label; break; }
  }

  // Si no matcheó ninguno conocido, intentar extraer del título: "En [Barrio] -"
  if (!neighborhood) {
    const neighMatch = title.match(/(?:^|\s)en\s+(?:barrio\s+)?([^-\n]+?)(?:\s*-|$)/i);
    if (neighMatch) {
      let raw = neighMatch[1].trim();
      raw = raw.replace(/\s+al\s+\d+$/i, "").trim();
      const isZone = KNOWN_ZONES.some(([p]) => p.test(raw));
      if (!isZone && raw.length > 1) neighborhood = raw;
    }
  }

  return {
    bedrooms, coveredArea, semiCoveredArea, lotArea,
    neighborhood, zone,
    pool, financing, mortgageEligible,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function wcAuth() {
  return `consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SEC}`;
}

/** Trae todas las páginas de productos de WooCommerce */
async function fetchAllProducts() {
  const products: WCProduct[] = [];
  let page = 1;
  while (true) {
    const url = `${WC_URL}/wp-json/wc/v3/products?${wcAuth()}&per_page=100&page=${page}&status=publish`;
    const res  = await fetch(url);
    if (!res.ok) {
      console.error("❌ Error al conectar con WooCommerce:", res.status, await res.text());
      process.exit(1);
    }
    const batch: WCProduct[] = await res.json();
    if (batch.length === 0) break;
    products.push(...batch);
    console.log(`  → Página ${page}: ${batch.length} productos`);
    page++;
  }
  return products;
}

/** Busca un valor en los atributos del producto */
function getAttr(product: WCProduct, keys: string[]): string | null {
  for (const key of keys) {
    // Buscar en attributes
    const attr = product.attributes?.find(
      (a) => a.name.toLowerCase().replace(/\s/g, "_") === key.toLowerCase(),
    );
    if (attr?.options?.[0]) return attr.options[0];

    // Buscar en meta_data
    const meta = product.meta_data?.find(
      (m) => m.key.toLowerCase().replace(/\s/g, "_") === key.toLowerCase(),
    );
    if (meta?.value !== undefined && meta.value !== "") return String(meta.value);
  }
  return null;
}

function getBool(product: WCProduct, keys: string[]): boolean {
  const val = getAttr(product, keys);
  if (!val) return false;
  return ["si", "sí", "yes", "true", "1"].includes(val.toLowerCase().trim());
}

function getNum(product: WCProduct, keys: string[]): number | null {
  const val = getAttr(product, keys);
  if (!val) return null;
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : n;
}

function mapCategory(product: WCProduct): "houses" | "lots" | "local" {
  for (const cat of product.categories ?? []) {
    const slug = cat.slug?.toLowerCase();
    const name = cat.name?.toLowerCase();
    if (CATEGORY_MAP[slug]) return CATEGORY_MAP[slug];
    if (CATEGORY_MAP[name]) return CATEGORY_MAP[name];
  }
  return "houses"; // fallback
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Tipos WooCommerce (mínimos) ──────────────────────────────────────────────
interface WCProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  description: string;
  short_description: string;
  featured: boolean;
  images: { src: string }[];
  categories: { slug: string; name: string }[];
  attributes: { name: string; options: string[] }[];
  meta_data: { key: string; value: unknown }[];
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 Migración WooCommerce → Supabase");
  console.log(DRY_RUN ? "   Modo: DRY RUN (solo preview)\n" : "   Modo: INSERCIÓN REAL\n");

  console.log("📦 Trayendo productos de WooCommerce...");
  const products = await fetchAllProducts();
  console.log(`✅ Total: ${products.length} productos encontrados\n`);

  if (products.length === 0) {
    console.log("No hay productos para migrar.");
    return;
  }

  // Mostrar estructura del primer producto para debug
  if (DRY_RUN) {
    console.log("─── Preview primer producto (raw) ───────────────────────────");
    const p = products[0];
    console.log("Nombre:    ", p.name);
    console.log("Slug:      ", p.slug);
    console.log("Precio:    ", p.price);
    console.log("Categorías:", p.categories?.map((c) => `${c.name} (${c.slug})`).join(", "));
    console.log("Atributos: ", p.attributes?.map((a) => `${a.name}: ${a.options.join(", ")}`).join(" | "));
    console.log("Meta keys: ", p.meta_data?.map((m) => m.key).join(", "));
    console.log("Imágenes:  ", p.images?.length, "fotos");
    console.log("─────────────────────────────────────────────────────────────\n");
  }

  // Mapear productos
  const mapped = products.map((p) => {
    const slug = p.slug || slugify(p.name);
    const description =
      p.description?.replace(/<[^>]*>/g, "").trim() ||
      p.short_description?.replace(/<[^>]*>/g, "").trim() ||
      "";

    // Primero intentar atributos WooCommerce, luego parsear del título
    const parsed = parseFromTitle(p.name, p.description ?? "");

    return {
      slug,
      title:            p.name,
      price:            p.price ? parseFloat(p.price) || null : null,
      description,
      category:         mapCategory(p),
      images:           (p.images ?? []).map((img) => img.src),
      featured:         p.featured ?? false,
      bedrooms:         getNum(p, ATTR.bedrooms) ?? parsed.bedrooms,
      coveredArea:      getNum(p, ATTR.coveredArea) ?? parsed.coveredArea,
      semiCoveredArea:  getNum(p, ATTR.semiCoveredArea) ?? parsed.semiCoveredArea,
      lotArea:          getNum(p, ATTR.lotArea) ?? parsed.lotArea,
      neighborhood:     getAttr(p, ATTR.neighborhood) ?? parsed.neighborhood,
      zone:             getAttr(p, ATTR.zone) ?? parsed.zone,
      pool:             getBool(p, ATTR.pool) || parsed.pool,
      financing:        getBool(p, ATTR.financing) || parsed.financing,
      mortgageEligible: getBool(p, ATTR.mortgageEligible) || parsed.mortgageEligible,
    };
  });

  // Preview tabla
  console.log("─── Mapeo de propiedades ────────────────────────────────────");
  console.log(
    mapped.map((m, i) =>
      `${String(i + 1).padStart(3)}. [${m.category.padEnd(6)}] ${m.title.substring(0, 45).padEnd(45)} | $${m.price ?? "—"} | ${m.bedrooms ?? "—"} dorm | ${m.zone ?? "—"}`
    ).join("\n")
  );
  console.log("─────────────────────────────────────────────────────────────\n");

  if (DRY_RUN) {
    console.log("👆 Revisá el mapeo. Si los campos (zona, dormitorios, etc.) están vacíos,");
    console.log("   fijate en los 'Atributos' y 'Meta keys' del primer producto y actualizá");
    console.log("   el objeto ATTR al principio del script con los nombres correctos.\n");
    console.log("▶  Para insertar de verdad: npx tsx scripts/migrate-woo.ts --insert\n");
    return;
  }

  // Insertar en Supabase
  console.log("💾 Insertando en Supabase...");
  let ok = 0, skip = 0;

  for (const prop of mapped) {
    try {
      await prisma.property.upsert({
        where:  { slug: prop.slug },
        update: prop,
        create: prop,
      });
      console.log(`  ✅ ${prop.title}`);
      ok++;
    } catch (err) {
      console.log(`  ⚠️  ${prop.title} — ${(err as Error).message}`);
      skip++;
    }
  }

  console.log(`\n✅ Migración completada: ${ok} insertadas, ${skip} errores`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
