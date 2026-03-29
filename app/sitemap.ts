import { MetadataRoute } from "next";
import { prisma } from "@/app/lib/prisma";

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
  if (!process.env.DATABASE_URL) return staticPages;

  try {
    const properties = await prisma.property.findMany({
      select: { slug: true, createdAt: true },
    });

    const propertyPages: MetadataRoute.Sitemap = properties.map((p) => ({
      url: `${BASE_URL}/propiedades/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...propertyPages];
  } catch {
    return staticPages;
  }
}
