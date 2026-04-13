import { MetadataRoute } from "next";
import { getPropertySlugs } from "@/app/lib/public-properties";

const BASE_URL = "https://ggpropiedades.com";
export const revalidate = 3600;

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
  const properties = await getPropertySlugs();

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
