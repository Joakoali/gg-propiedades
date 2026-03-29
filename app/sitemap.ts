import { MetadataRoute } from "next";
import { supabase, TABLE } from "@/app/lib/db";

const BASE_URL = "https://ggpropiedades.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/propiedades`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contacto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Páginas dinámicas: una por cada propiedad
  const { data: properties } = await supabase()
    .from(TABLE)
    .select("slug, createdAt");

  const propertyPages: MetadataRoute.Sitemap = (properties ?? []).map(
    (p: { slug: string; createdAt: string }) => ({
      url: `${BASE_URL}/propiedades/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  return [...staticPages, ...propertyPages];
}
