import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers no soporta el Image Optimization de Next.js.
    // Las imágenes se sirven directamente desde R2 (ya optimizadas en upload).
    unoptimized: true,
  },

  // ── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Evita que el sitio sea embebido en iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Evita que el browser adivine el Content-Type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Política de referrer: no filtrar la URL a sitios externos
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No indexar en Wayback Machine ni similares
          { key: "X-Robots-Tag", value: "noarchive" },
          // HSTS: forzar HTTPS por 1 año en producción
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Permisos de APIs del browser (cámara, micrófono, etc.)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "img-src 'self' https: data: blob:",
              "font-src 'self' fonts.gstatic.com",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
