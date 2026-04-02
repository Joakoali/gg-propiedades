# Cloudflare Worker CPU Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate Error 1102 (Worker CPU time exceeded) caused by Node.js compat overhead on public pages and synchronous crypto saturation on bulk image uploads.

**Architecture:** Replace `node:crypto` with native Web Crypto API in `r2.ts`, add a module-level SigV4 signing key cache, remove the `runtime = "nodejs"` directive from all 7 affected files, and raise ISR TTLs to 1800s to reduce Worker invocations.

**Tech Stack:** Next.js 14 App Router, OpenNext Cloudflare, Supabase JS, Web Crypto API (`crypto.subtle`), Cloudflare Workers free plan.

---

## File Map

| File | Change |
|---|---|
| `app/lib/r2.ts` | Full rewrite: node:crypto → Web Crypto, add signing key cache, make `generatePresignedPutUrl` async |
| `app/api/upload/presign/route.ts` | `.map()` → `await Promise.all(files.map(async ...))` |
| `app/page.tsx` | Remove `export const runtime = "nodejs"`, `revalidate` 300 → 1800 |
| `app/propiedades/page.tsx` | Remove `export const runtime = "nodejs"`, `revalidate` 120 → 1800 |
| `app/propiedades/[slug]/page.tsx` | Remove `export const runtime = "nodejs"` |
| `app/admin/properties/[slug]/edit/page.tsx` | Remove `export const runtime = "nodejs"` |
| `app/api/properties/route.ts` | Remove `export const runtime = "nodejs"` |
| `app/api/properties/[slug]/route.ts` | Remove `export const runtime = "nodejs"` |
| `app/api/test-db/route.ts` | Remove `export const runtime = "nodejs"` |
| `app/lib/public-properties.ts` | `revalidate` 300 → 1800 for home-data, 120 → 1800 for property-list |

---

## Task 1: Rewrite `app/lib/r2.ts` with Web Crypto API and signing key cache

**Files:**
- Modify: `app/lib/r2.ts`

- [ ] **Step 1: Replace the entire file**

Open `app/lib/r2.ts` and replace its full contents with the following:

```ts
/**
 * Cloudflare R2 upload utility — AWS SigV4 via Web Crypto API.
 * R2 is S3-compatible, region = "auto".
 * Uses crypto.subtle (native in Workers) — no node:crypto needed.
 */

const BUCKET = "propiedades";

// ── Web Crypto helpers ────────────────────────────────────────────────────────

const enc = new TextEncoder();

async function importHmacKey(keyData: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function hmacSha256(key: CryptoKey, data: string): Promise<ArrayBuffer> {
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return toHex(buf);
}

// ── Signing key cache (per day, per Worker instance) ─────────────────────────
//
// The SigV4 signing key depends only on secret + dateStamp.
// It never changes within a day, so we derive it once and cache it.
// On a warm Worker instance serving 20-file uploads: 0 derivation ops.
// On a cold instance: 4 HMAC ops once, then 1 per file.

let _signingKeyCache: { dateStamp: string; key: CryptoKey } | null = null;

async function deriveSigningKey(
  secret: string,
  dateStamp: string,
): Promise<CryptoKey> {
  const kDateKey = await importHmacKey(enc.encode("AWS4" + secret));
  const kDate = await hmacSha256(kDateKey, dateStamp);
  const kRegionKey = await importHmacKey(kDate);
  const kRegion = await hmacSha256(kRegionKey, "auto");
  const kServiceKey = await importHmacKey(kRegion);
  const kService = await hmacSha256(kServiceKey, "s3");
  const kSignKey = await importHmacKey(kService);
  const kSign = await hmacSha256(kSignKey, "aws4_request");
  return importHmacKey(kSign);
}

async function getSigningKey(
  secret: string,
  dateStamp: string,
): Promise<CryptoKey> {
  if (_signingKeyCache?.dateStamp === dateStamp) return _signingKeyCache.key;
  const key = await deriveSigningKey(secret, dateStamp);
  _signingKeyCache = { dateStamp, key };
  return key;
}

// ── Path encoding ─────────────────────────────────────────────────────────────

function encodePath(key: string): string {
  return key
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}

// ── Presigned PUT URL ─────────────────────────────────────────────────────────

/**
 * Generate a presigned PUT URL so the browser can upload directly to R2.
 * The Worker only runs HMAC signing — no file data touches it.
 */
export async function generatePresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300,
): Promise<{ presignedUrl: string; publicUrl: string }> {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const publicUrlBase = process.env.R2_PUBLIC_URL!;

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const urlPath = `/${BUCKET}/${encodePath(key)}`;

  const now = new Date();
  const amzDate =
    now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const credential = `${accessKey}/${credentialScope}`;

  const params: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Content-Sha256", "UNSIGNED-PAYLOAD"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresIn)],
    ["X-Amz-SignedHeaders", "content-type;host"],
  ];
  params.sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalQueryString = params
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    urlPath,
    canonicalQueryString,
    `content-type:${contentType}\nhost:${host}\n`,
    "content-type;host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSigningKey(secretKey, dateStamp);
  const sigBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = toHex(sigBuffer);

  return {
    presignedUrl: `https://${host}${urlPath}?${canonicalQueryString}&X-Amz-Signature=${signature}`,
    publicUrl: `${publicUrlBase}/${key}`,
  };
}

// ── Direct server-side upload ─────────────────────────────────────────────────

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const publicUrlBase = process.env.R2_PUBLIC_URL!;

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const urlPath = `/${BUCKET}/${encodePath(key)}`;

  const now = new Date();
  const amzDate =
    now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const bodyHashBuf = await crypto.subtle.digest("SHA-256", body);
  const bodyHash = toHex(bodyHashBuf);

  const canonicalRequest = [
    "PUT",
    urlPath,
    "",
    `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n`,
    "content-type;host;x-amz-content-sha256;x-amz-date",
    bodyHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSigningKey(secretKey, dateStamp);
  const sigBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = toHex(sigBuffer);

  const res = await fetch(`https://${host}${urlPath}`, {
    method: "PUT",
    body: new Uint8Array(body),
    headers: {
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope},` +
        `SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date,` +
        `Signature=${signature}`,
      "Content-Type": contentType,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": bodyHash,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }

  return `${publicUrlBase}/${key}`;
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors in `app/lib/r2.ts`. If you see "Cannot find name 'crypto'" errors, ignore them for now — they go away after the build step since the Workers global is not in the standard TS lib.

- [ ] **Step 3: Commit**

```bash
git add app/lib/r2.ts
git commit -m "perf: replace node:crypto with Web Crypto API in r2.ts, add signing key cache"
```

---

## Task 2: Update presign route to handle async `generatePresignedPutUrl`

**Files:**
- Modify: `app/api/upload/presign/route.ts`

The `results` assignment currently uses synchronous `.map()`. Since `generatePresignedPutUrl` is now async, change it to `await Promise.all(files.map(async ...))`. This also means all 20 URL generations happen concurrently — further reducing wall time.

- [ ] **Step 1: Update the `results` block**

In `app/api/upload/presign/route.ts`, find:

```ts
  const results = files.map((file) => {
    const type = ALLOWED_TYPES.includes(file.type) ? file.type : "image/jpeg";
    const ext =
      type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { presignedUrl, publicUrl } = generatePresignedPutUrl(key, type);

    return { presignedUrl, publicUrl, contentType: type };
  });
```

Replace with:

```ts
  const results = await Promise.all(
    files.map(async (file) => {
      const type = ALLOWED_TYPES.includes(file.type) ? file.type : "image/jpeg";
      const ext =
        type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { presignedUrl, publicUrl } = await generatePresignedPutUrl(key, type);

      return { presignedUrl, publicUrl, contentType: type };
    }),
  );
```

- [ ] **Step 2: Commit**

```bash
git add app/api/upload/presign/route.ts
git commit -m "perf: await async generatePresignedPutUrl in presign route"
```

---

## Task 3: Remove `runtime = "nodejs"` from all 7 files

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/propiedades/page.tsx`
- Modify: `app/propiedades/[slug]/page.tsx`
- Modify: `app/admin/properties/[slug]/edit/page.tsx`
- Modify: `app/api/properties/route.ts`
- Modify: `app/api/properties/[slug]/route.ts`
- Modify: `app/api/test-db/route.ts`

The `runtime = "nodejs"` directive was added as a blanket fix when `node:crypto` was in the dependency chain. With Web Crypto replacing it, these files no longer need the directive. Removing it lets Next.js/OpenNext use the lighter edge runtime path. The `nodejs_compat` flag in `wrangler.toml` still provides Node.js APIs at the Worker level for things like nextauth.

- [ ] **Step 1: Remove the directive from each file**

In each of the 7 files below, delete the line `export const runtime = "nodejs";` (it is always line 1 or 2).

Files to edit:
- `app/page.tsx` — delete line 1: `export const runtime = "nodejs";`
- `app/propiedades/page.tsx` — delete line 1: `export const runtime = "nodejs";`
- `app/propiedades/[slug]/page.tsx` — delete line 1: `export const runtime = "nodejs";`
- `app/admin/properties/[slug]/edit/page.tsx` — delete line 1: `export const runtime = "nodejs";`
- `app/api/properties/route.ts` — delete line 1: `export const runtime = "nodejs";`
- `app/api/properties/[slug]/route.ts` — delete line 1: `export const runtime = "nodejs";`
- `app/api/test-db/route.ts` — delete line 2: `export const runtime = "nodejs";`

- [ ] **Step 2: Verify none remain**

```bash
grep -r "runtime = \"nodejs\"" app/
```

Expected: no output. If any lines appear, delete them too.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/propiedades/page.tsx "app/propiedades/[slug]/page.tsx" "app/admin/properties/[slug]/edit/page.tsx" app/api/properties/route.ts "app/api/properties/[slug]/route.ts" app/api/test-db/route.ts
git commit -m "perf: remove runtime=nodejs from all pages and routes"
```

---

## Task 4: Raise ISR TTLs to 1800s

**Files:**
- Modify: `app/lib/public-properties.ts`
- Modify: `app/page.tsx`
- Modify: `app/propiedades/page.tsx`

Two TTLs to update in `public-properties.ts`: `public-home-data` (currently 300) and `public-property-list` (currently 120). The page-level `revalidate` exports must match to avoid Next.js generating mismatched cache headers. TTLs for slugs, zones, and slugs list remain at 3600 — they already have long enough windows.

- [ ] **Step 1: Update `public-properties.ts`**

In `app/lib/public-properties.ts`, find and replace:

```ts
    { revalidate: 300, tags: ["properties"] },
```
→
```ts
    { revalidate: 1800, tags: ["properties"] },
```

Then find and replace:

```ts
    { revalidate: 120, tags: ["properties"] },
```
→
```ts
    { revalidate: 1800, tags: ["properties"] },
```

Verify the file now has exactly:
- `getCachedHomeData`: `revalidate: 1800`
- `getCachedPropertyList`: `revalidate: 1800`
- `getCachedZones`: `revalidate: 3600` (unchanged)
- `getCachedPropertyBySlug`: `revalidate: 3600` (unchanged)
- `getCachedPropertySlugs`: `revalidate: 3600` (unchanged)

- [ ] **Step 2: Update page-level revalidate in `app/page.tsx`**

Find:
```ts
export const revalidate = 300;
```
Replace with:
```ts
export const revalidate = 1800;
```

- [ ] **Step 3: Update page-level revalidate in `app/propiedades/page.tsx`**

Find:
```ts
export const revalidate = 120;
```
Replace with:
```ts
export const revalidate = 1800;
```

- [ ] **Step 4: Commit**

```bash
git add app/lib/public-properties.ts app/page.tsx app/propiedades/page.tsx
git commit -m "perf: raise ISR revalidate TTL to 1800s for home and property list"
```

---

## Task 5: Build and deploy verification

**Files:** none modified

- [ ] **Step 1: Run the OpenNext build**

```bash
npx @opennextjs/cloudflare build
```

Expected: build completes with no TypeScript or bundling errors. If you see `Cannot find name 'crypto'` in `r2.ts`, add `/// <reference lib="dom" />` at the top of `app/lib/r2.ts` — the Workers `crypto` global is covered by the DOM lib.

- [ ] **Step 2: Deploy to Cloudflare**

```bash
npx @opennextjs/cloudflare deploy
```

Expected: Worker deploys successfully. Note the Worker URL.

- [ ] **Step 3: Smoke test — public pages**

Open 5+ browser tabs simultaneously to:
- `https://ggpropiedades.com/`
- `https://ggpropiedades.com/propiedades`
- `https://ggpropiedades.com/propiedades?zone=Tigre` (or any zone)

Expected: all pages load without Error 1102.

- [ ] **Step 4: Smoke test — bulk image upload**

In the admin panel, try uploading 20–25 images at once on a property.

Expected: presign request succeeds, all images upload directly to R2, no 1102 error. Images appear in the property form.

- [ ] **Step 5: Verify admin cache invalidation still works**

Edit and save any property. Navigate to `/propiedades` and confirm the change is visible immediately (not waiting 30 minutes).

Expected: change appears immediately because `revalidateTag("properties")` fires on save, overriding the TTL.
