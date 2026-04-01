import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/wp-admin/",
          "/wp-content/",
          "/wp-includes/",
          "/wordpress/",
          "/xmlrpc.php",
        ],
      },
    ],
    sitemap: "https://ggpropiedades.com/sitemap.xml",
  };
}
