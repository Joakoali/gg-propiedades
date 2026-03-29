/**
 * Migración: Supabase Storage → Cloudflare R2
 *
 * Dry-run (sin cambios):  node --env-file=.env --experimental-strip-types scripts/migrate-to-r2.ts
 * Ejecutar migración:     node --env-file=.env --experimental-strip-types scripts/migrate-to-r2.ts --insert
 */
import { createHmac, createHash } from "node:crypto";
import { Pool } from "pg";

const INSERT = process.argv.includes("--insert");
const CONCURRENCY = 4;
const SUPABASE_PUBLIC_PREFIX = "supabase.co/storage/v1/object/public/propiedades/";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// ── R2 SigV4 (igual que app/lib/r2.ts pero standalone para el script) ─────────

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}
function hexHash(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;

  const urlPath  = `/propiedades/${key.split("/").map(encodeURIComponent).join("/")}`;
  const url      = `https://${accountId}.r2.cloudflarestorage.com${urlPath}`;
  const now      = new Date();
  const amzDate  = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const datestamp = amzDate.slice(0, 8);
  const bodyHash = hexHash(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${accountId}.r2.cloudflarestorage.com\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", urlPath, "", canonicalHeaders, signedHeaders, bodyHash].join("\n");

  const scope = `${datestamp}/auto/s3/aws4_request`;
  const sts   = ["AWS4-HMAC-SHA256", amzDate, scope, hexHash(canonicalRequest)].join("\n");

  const kDate = hmac("AWS4" + secretKey, datestamp);
  const kSig  = hmac(hmac(hmac(kDate, "auto"), "s3"), "aws4_request");
  const sig   = createHmac("sha256", kSig).update(sts, "utf8").digest("hex");

  const res = await fetch(url, {
    method: "PUT",
    body: new Uint8Array(body),
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope},SignedHeaders=${signedHeaders},Signature=${sig}`,
      "Content-Type": contentType,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": bodyHash,
    },
  });

  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${await res.text()}`);
  return `${R2_PUBLIC_URL}/${key}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseImages(raw: any): string[] {
  if (!raw) return [];
  // Postgres puede devolver el campo ya como array JS (tipo JSON/jsonb)
  if (Array.isArray(raw)) return raw.filter((u) => typeof u === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((u: unknown) => typeof u === "string");
      if (typeof parsed === "string" && parsed) return [parsed];
      return [];
    } catch {
      return raw.startsWith("http") ? [raw] : [];
    }
  }
  return [];
}

function extractKey(url: string): string | null {
  const idx = url.indexOf(SUPABASE_PUBLIC_PREFIX);
  if (idx === -1) return null;
  return url.slice(idx + SUPABASE_PUBLIC_PREFIX.length);
}

function isAlreadyR2(url: string): boolean {
  return url.startsWith(R2_PUBLIC_URL);
}

async function migrateOne(url: string): Promise<string> {
  if (isAlreadyR2(url)) return url; // already migrated

  const key = extractKey(url);
  if (!key) return url; // unknown URL, skip

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return uploadToR2(key, buffer, contentType);
}

async function runPool<T>(items: T[], fn: (item: T) => Promise<T>, concurrency: number): Promise<T[]> {
  const results: T[] = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!R2_PUBLIC_URL) throw new Error("R2_PUBLIC_URL no configurado en .env");
  if (!process.env.R2_ACCOUNT_ID) throw new Error("R2_ACCOUNT_ID no configurado en .env");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { rows } = await pool.query<{ id: string; images: any }>(
    `SELECT id, images FROM "Property"`
  );

  console.log(`\n📦 ${rows.length} propiedades encontradas`);
  console.log(INSERT ? "🚀 MODO REAL — se modificará la base de datos\n" : "🔍 DRY-RUN — sin cambios en la BD\n");

  let totalImages = 0, migrated = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    const images = parseImages(row.images);
    totalImages += images.length;

    if (images.length === 0) continue;

    const newImages = await runPool(images, async (url) => {
      if (isAlreadyR2(url)) { skipped++; return url; }
      try {
        const newUrl = await migrateOne(url);
        migrated++;
        process.stdout.write("✓");
        return newUrl;
      } catch (e) {
        errors++;
        process.stdout.write("✗");
        console.error(`\nError con ${url}:`, (e as Error).message);
        return url; // keep original on error
      }
    }, CONCURRENCY);

    if (INSERT) {
      await pool.query(
        `UPDATE "Property" SET images = $1 WHERE id = $2`,
        [newImages, row.id]
      );
    }
  }

  await pool.end();

  console.log(`\n\n── Resumen ──────────────────────────────`);
  console.log(`Total imágenes:  ${totalImages}`);
  console.log(`Migradas a R2:   ${migrated}`);
  console.log(`Ya en R2:        ${skipped}`);
  console.log(`Errores:         ${errors}`);

  if (!INSERT && migrated > 0) {
    console.log(`\n✅ Dry-run OK. Corré con --insert para aplicar los cambios.`);
  } else if (INSERT) {
    console.log(`\n✅ Migración completa. Podés borrar el bucket de Supabase Storage.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
