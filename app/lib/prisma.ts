import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// In Cloudflare Workers, env vars are NOT available at module init time —
// only inside request handlers. Using a lazy Proxy ensures PrismaClient is
// created on first access (during a request), not at cold-start.
let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (_client) return _client;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is required");

  const adapter = new PrismaPg({
    connectionString: url,
    max: process.env.NODE_ENV === "production" ? 2 : 10,
  });

  _client = new PrismaClient({ adapter });
  return _client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
