/**
 * migrate-images.ts
 * Migra imágenes de WordPress/WooCommerce → Supabase Storage
 *
 * Uso:
 *   node --experimental-strip-types --env-file=.env scripts/migrate-images.ts
 *   node --experimental-strip-types --env-file=.env scripts/migrate-images.ts --insert
 *
 * Sin --insert: modo dry-run (muestra qué haría sin modificar nada)
 * Con --insert:  descarga, sube y actualiza la base de datos
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL    = process.env.SUPABASE_URL!;       // https://xxx.supabase.co
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY!; // service_role key
const BUCKET          = "propiedades";
const OLD_DOMAIN      = "ggpropiedades.com";
const DRY_RUN         = !process.argv.includes("--insert");
const CONCURRENCY     = 3; // imágenes en paralelo por propiedad

// ── Prisma ──────────────────────────────────────────────────────────────────

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma  = new PrismaClient({ adapter } as any);

// ── Helpers ─────────────────────────────────────────────────────────────────

function isWordPressUrl(url: string): boolean {
  return url.includes(OLD_DOMAIN);
}

/** Extrae la extensión de una URL (jpg, jpeg, png, webp) */
function extFromUrl(url: string): string {
  const match = url.split("?")[0].match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? match[1].toLowerCase() : "jpg";
}

/** Descarga una imagen como ArrayBuffer */
async function downloadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GGProp/1.0)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.warn(`  ⚠️  HTTP ${res.status} descargando: ${url}`);
      return null;
    }
    return await res.arrayBuffer();
  } catch (e) {
    console.warn(`  ⚠️  Error descargando ${url}: ${(e as Error).message}`);
    return null;
  }
}

/** Sube un buffer a Supabase Storage y devuelve la URL pública */
async function uploadToSupabase(
  buffer: ArrayBuffer,
  path: string,
  contentType: string
): Promise<string | null> {
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true", // sobreescribir si ya existe
    },
    body: buffer,
  });

  if (!res.ok) {
    const body = await res.text();
    console.warn(`  ⚠️  Error subiendo ${path}: ${res.status} ${body}`);
    return null;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Procesa un lote de promesas con concurrencia limitada */
async function withConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j)));
    results.push(...batchResults);
  }
  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltan variables: SUPABASE_URL y SUPABASE_SERVICE_KEY en .env");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  Migración de imágenes WP → Supabase Storage                ║`);
  console.log(`║  Modo: ${DRY_RUN ? "DRY RUN (sin cambios)" : "INSERTAR ✅             "}                       ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // 1. Obtener propiedades con imágenes de WordPress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = await (prisma as any).property.findMany({
    select: { id: true, slug: true, images: true },
    orderBy: { createdAt: "asc" },
  });

  const toMigrate = properties.filter((p: { images: string[] }) =>
    p.images.some(isWordPressUrl)
  );

  const alreadyDone = properties.length - toMigrate.length;

  console.log(`📦 Propiedades totales:        ${properties.length}`);
  console.log(`🔄 Con imágenes de WordPress:  ${toMigrate.length}`);
  console.log(`✅ Ya migradas:                ${alreadyDone}`);
  console.log("");

  if (toMigrate.length === 0) {
    console.log("🎉 Todas las imágenes ya están en Supabase. Nada que hacer.");
    return;
  }

  let totalImages = 0;
  let migratedImages = 0;
  let failedImages = 0;
  let skippedImages = 0;

  for (const [propIndex, property] of toMigrate.entries()) {
    const { id, slug, images } = property as { id: string; slug: string; images: string[] };
    const wpImages = images.filter(isWordPressUrl);
    // (variable informativa, solo se usa en dry-run futuro)
    const _alreadyMigrated = images.filter((u: string) => !isWordPressUrl(u)); void _alreadyMigrated;

    console.log(
      `[${propIndex + 1}/${toMigrate.length}] ${slug} — ${wpImages.length} imágen(es) a migrar`
    );

    totalImages += wpImages.length;

    if (DRY_RUN) {
      for (const url of wpImages) {
        console.log(`   📷 ${url.split("/").slice(-2).join("/")}`);
      }
      skippedImages += wpImages.length;
      continue;
    }

    // Migrar imágenes en paralelo (con concurrencia limitada)
    const newUrls = await withConcurrency(
      images, // mantener el orden original del array
      CONCURRENCY,
      async (imgUrl: string, imgIndex: number): Promise<string> => {
        if (!isWordPressUrl(imgUrl)) return imgUrl; // ya migrada

        const ext = extFromUrl(imgUrl);
        const storagePath = `${id}/${imgIndex}.${ext}`;
        const contentType = ext === "png" ? "image/png" : "image/jpeg";

        process.stdout.write(`   ⬇️  Descargando imagen ${imgIndex + 1}...`);
        const buffer = await downloadImage(imgUrl);
        if (!buffer) {
          failedImages++;
          process.stdout.write(" ❌\n");
          return imgUrl; // mantener URL original si falla
        }

        process.stdout.write(` ⬆️  Subiendo...`);
        const newUrl = await uploadToSupabase(buffer, storagePath, contentType);
        if (!newUrl) {
          failedImages++;
          process.stdout.write(" ❌\n");
          return imgUrl;
        }

        migratedImages++;
        process.stdout.write(` ✅\n`);
        return newUrl;
      }
    );

    // Actualizar la propiedad con las nuevas URLs
    const hasChanges = newUrls.some((u: string, i: number) => u !== images[i]);
    if (hasChanges) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).property.update({
        where: { id },
        data: { images: newUrls },
      });
      console.log(`   💾 Propiedad actualizada en la DB\n`);
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════");
  if (DRY_RUN) {
    console.log(`✅ DRY RUN completo.`);
    console.log(`   ${toMigrate.length} propiedades con ${totalImages} imágenes para migrar.`);
    console.log(`\n▶️  Para ejecutar de verdad:`);
    console.log(`   node --experimental-strip-types --env-file=.env scripts/migrate-images.ts --insert`);
  } else {
    console.log(`✅ Migración completa:`);
    console.log(`   ✓ Migradas:  ${migratedImages} imágenes`);
    console.log(`   ✗ Fallidas:  ${failedImages} imágenes (se mantuvo URL original)`);
    console.log(`   ↩ Omitidas:  ${skippedImages} imágenes`);
  }
  console.log("══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error("Error fatal:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
