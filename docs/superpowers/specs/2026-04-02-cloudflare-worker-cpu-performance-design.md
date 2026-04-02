# Cloudflare Worker CPU Performance — Design Spec
**Date:** 2026-04-02
**Problem:** Error 1102 (Worker exceeded CPU time limit) on Cloudflare free plan (10ms CPU/request)

---

## Problem Summary

Two distinct scenarios trigger Error 1102:

1. **Public pages** — When 3–4 concurrent users open 10+ tabs, Worker CPU spikes due to the Node.js compat layer loaded by every page (caused by `node:crypto` import in `r2.ts`).
2. **Admin image upload** — Uploading 20+ images at once triggers 140+ synchronous HMAC/SHA256 operations in a single Worker request (7 crypto ops × 20 files), plus `getServerSession` JWT decode on top.

---

## Solution Overview

Three complementary changes that together eliminate both failure modes:

1. **Replace `node:crypto` with Web Crypto API** — removes the Node.js compat layer from all pages
2. **Cache the SigV4 signing key** — reduces 80 HMAC ops per upload request to 4 (or 0 on warm instances)
3. **Raise ISR TTL to 1800s** — dramatically reduces the number of requests that do real CPU work

---

## Section 1 — Replace `node:crypto` with Web Crypto API

### Why this matters
`r2.ts` imports `createHmac` and `createHash` from `node:crypto`. This is the sole reason every page and API route declares `export const runtime = "nodejs"`, forcing the heavy Node.js compatibility shim to load on every Worker invocation. Cloudflare Workers have `crypto.subtle` (SubtleCrypto) natively — it's a global with no compat overhead.

### Changes

**`app/lib/r2.ts`**
- Remove: `import { createHmac, createHash } from "node:crypto"`
- Add two helpers using `crypto.subtle`:
  - `async function hmacSha256(key: CryptoKey | BufferSource, data: string): Promise<ArrayBuffer>`
  - `async function sha256Hex(data: string): Promise<string>`
- `generatePresignedPutUrl` becomes `async` (returns `Promise<{ presignedUrl, publicUrl }>`)
- `uploadToR2` already async — just update internal calls

**All files with `export const runtime = "nodejs"`**
- `app/page.tsx`
- `app/propiedades/page.tsx`
- `app/propiedades/[slug]/page.tsx`
- `app/admin/properties/[slug]/edit/page.tsx`
- `app/api/properties/route.ts`
- `app/api/properties/[slug]/route.ts`
- `app/api/test-db/route.ts`
- Remove the export entirely — they will run on the native edge runtime

---

## Section 2 — SigV4 Signing Key Cache

### Why this matters
The SigV4 signing key is derived via a 4-step HMAC chain:
```
kDate    = HMAC(  "AWS4" + secret,  dateStamp  )
kRegion  = HMAC(  kDate,            "auto"     )
kService = HMAC(  kRegion,          "s3"       )
kSign    = HMAC(  kService,         "aws4_request" )
```
This chain only depends on `secret + dateStamp` — it never changes within a day. Currently it is recomputed for every file in every presign request.

### Changes

**`app/lib/r2.ts`**
- Add a `deriveSigningKey(secret, dateStamp)` async function that runs the 4-step chain and returns a `CryptoKey`
- Add a module-level cache:
  ```ts
  let _signingKeyCache: { dateStamp: string; key: CryptoKey } | null = null;
  ```
- Before deriving: check if `_signingKeyCache?.dateStamp === dateStamp`. If yes, return cached key. If no, derive and store.
- Pass the derived key into `generatePresignedPutUrl` so each file only runs a single HMAC signing op

**Result:** For 20 files on a warm Worker instance — 0 key-derivation ops (cached). On a cold instance — 4 HMAC ops once, then 20 lightweight signing ops.

---

## Section 3 — ISR TTL Increase to 1800s

### Why this matters
More frequent cache revalidations = more Worker CPU invocations for DB queries + RSC rendering. A real estate listing catalogue changes rarely; 30-minute staleness is acceptable. Admin saves bust the cache immediately via `revalidateTag("properties")` regardless of TTL.

### Changes

**`app/lib/public-properties.ts`**

| Cache key | Current TTL | New TTL |
|---|---|---|
| `public-home-data` | 300s | 1800s |
| `public-property-list` | 120s | 1800s |
| `public-property-zones` | 3600s | 3600s (unchanged) |
| `public-property-detail` | 3600s | 3600s (unchanged) |
| `public-property-slugs` | 3600s | 3600s (unchanged) |

**Page-level `revalidate` exports**

| File | Current | New |
|---|---|---|
| `app/page.tsx` | `export const revalidate = 300` | `1800` |
| `app/propiedades/page.tsx` | `export const revalidate = 120` | `1800` |

---

## Files Changed

| File | Change |
|---|---|
| `app/lib/r2.ts` | Replace `node:crypto` with Web Crypto; add signing key cache |
| `app/lib/public-properties.ts` | Raise TTLs for home-data and property-list caches |
| `app/page.tsx` | Remove `runtime = "nodejs"`, raise `revalidate` to 1800 |
| `app/propiedades/page.tsx` | Remove `runtime = "nodejs"`, raise `revalidate` to 1800 |
| `app/propiedades/[slug]/page.tsx` | Remove `runtime = "nodejs"` |
| `app/admin/properties/[slug]/edit/page.tsx` | Remove `runtime = "nodejs"` |
| `app/api/properties/route.ts` | Remove `runtime = "nodejs"` |
| `app/api/properties/[slug]/route.ts` | Remove `runtime = "nodejs"` |
| `app/api/test-db/route.ts` | Remove `runtime = "nodejs"` |

**Files NOT changed:**
- `app/api/upload/presign/route.ts` — logic unchanged, just benefits from async `generatePresignedPutUrl`
- `app/lib/db.ts` — already edge-compatible
- `wrangler.toml` — no changes needed
- `open-next.config.ts` — no changes needed

---

## Expected Outcome

| Scenario | Before | After |
|---|---|---|
| 20-file presign (cold Worker) | ~140 crypto ops | 4 key-derivation + 20 signing ops |
| 20-file presign (warm Worker) | ~140 crypto ops | 20 signing ops only |
| Public page load (cache hit) | Node.js compat layer loaded | Native edge runtime, zero compat overhead |
| Property list revalidation | Every 2 minutes | Every 30 minutes |
| Admin save invalidation | Immediate (`revalidateTag`) | Immediate (unchanged) |
