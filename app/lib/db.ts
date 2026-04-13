import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  featuredOrder: number | null;
  createdAt: string;
}

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

export const TABLE = "Property";

export function generateId(): string {
  return crypto.randomUUID();
}
