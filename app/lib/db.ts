/**
 * Supabase client for Cloudflare Workers — HTTP-based, zero WebAssembly.
 *
 * Replaces Prisma to avoid the "Wasm code generation disallowed by embedder" error.
 * Requires two env vars:
 *   SUPABASE_URL            — e.g. https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — found in Supabase Dashboard → Settings → API
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Property type (mirrors the Prisma model exactly) ────────────────────────

export type Category = "houses" | "lots" | "local";

export interface Property {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  category: Category;
  description: string;
  images: string[];
  bedrooms: number | null;
  coveredArea: number | null;
  semiCoveredArea: number | null;
  lotArea: number | null;
  neighborhood: string | null;
  zone: string | null;
  pool: boolean;
  financing: boolean;
  mortgageEligible: boolean;
  featured: boolean;
  createdAt: string;
}

export type PropertyInsert = Omit<Property, "id" | "createdAt">;

// ── Lazy singleton (safe for Cloudflare Workers) ────────────────────────────

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _client;
}

// ── Table name constant ─────────────────────────────────────────────────────
// Prisma creates the table with the exact model name — "Property" (PascalCase).
export const TABLE = "Property";

// ── Simple ID generator (replaces Prisma's cuid()) ──────────────────────────

export function generateId(): string {
  return crypto.randomUUID();
}
