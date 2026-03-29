import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de autenticación — corre en Edge runtime antes de cualquier route handler.
 * Protege todas las rutas /admin/* y los API routes de escritura.
 * Si no hay sesión válida → redirige al login (páginas) o devuelve 401 (API).
 *
 * IMPORTANTE: En Next.js 16, "proxy.ts" corre en Node.js (no soportado por
 * opennextjs-cloudflare). "middleware.ts" corre en Edge, que sí es compatible.
 * Usa getToken (Edge-compatible) en lugar de withAuth (Node.js-only).
 */
export default async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // Rutas API protegidas sin sesión → 401 JSON (los fetch() necesitan JSON, no redirect)
  if (
    (pathname.startsWith("/api/properties") ||
      pathname.startsWith("/api/upload")) &&
    !token
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Rutas /admin/* sin sesión → redirect al login
  // Excluimos /admin/login para evitar loop de redirección
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !token) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/properties/:path*",
    "/api/upload/:path*",
  ],
};
