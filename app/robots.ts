import { MetadataRoute } from "next";

const DISALLOWED = [
  "/admin",
  "/api/",
  "/wp-admin/",
  "/wp-content/",
  "/wp-includes/",
  "/wordpress/",
  "/xmlrpc.php",
];

// Crawlers de asistentes de IA (ChatGPT, Claude, Gemini, Perplexity).
// Hoy ya están permitidos por el wildcard; se explicitan para que un
// cambio futuro en las reglas generales no los bloquee sin querer.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended",
  "PerplexityBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: DISALLOWED,
      })),
    ],
    sitemap: "https://ggpropiedades.com/sitemap.xml",
  };
}
