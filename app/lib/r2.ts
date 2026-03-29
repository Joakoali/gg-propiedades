/**
 * Cloudflare R2 upload utility — AWS SigV4 (no external SDK needed).
 * R2 es S3-compatible, region = "auto".
 */
import { createHmac, createHash } from "node:crypto";

const BUCKET = "propiedades";

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function encodePath(key: string): string {
  // Encode each segment but keep "/" between them
  return key.split("/").map((s) => encodeURIComponent(s)).join("/");
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const accountId  = process.env.R2_ACCOUNT_ID!;
  const accessKey  = process.env.R2_ACCESS_KEY_ID!;
  const secretKey  = process.env.R2_SECRET_ACCESS_KEY!;
  const publicUrl  = process.env.R2_PUBLIC_URL!;

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const urlPath  = `/${BUCKET}/${encodePath(key)}`;
  const url      = `${endpoint}${urlPath}`;

  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const region    = "auto";
  const service   = "s3";
  const bodyHash  = sha256Hex(body);

  // ── Canonical request ──────────────────────────────────────────────────────
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${accountId}.r2.cloudflarestorage.com\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    urlPath,
    "",               // query string (empty)
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");

  // ── String to sign ─────────────────────────────────────────────────────────
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  // ── Signing key ────────────────────────────────────────────────────────────
  const kDate    = hmacSha256("AWS4" + secretKey, dateStamp);
  const kRegion  = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSign    = hmacSha256(kService, "aws4_request");
  const signature = createHmac("sha256", kSign).update(stringToSign, "utf8").digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope},` +
    `SignedHeaders=${signedHeaders},Signature=${signature}`;

  // ── Upload ─────────────────────────────────────────────────────────────────
  const res = await fetch(url, {
    method: "PUT",
    body: new Uint8Array(body),
    headers: {
      Authorization:            authorization,
      "Content-Type":           contentType,
      "x-amz-date":             amzDate,
      "x-amz-content-sha256":   bodyHash,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }

  return `${publicUrl}/${key}`;
}
