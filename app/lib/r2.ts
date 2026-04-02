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
    now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
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
    now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const dateStamp = amzDate.slice(0, 8);

  const bodyHashBuf = await crypto.subtle.digest("SHA-256", new Uint8Array(body));
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
