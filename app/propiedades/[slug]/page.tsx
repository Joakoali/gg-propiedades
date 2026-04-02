import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BedDouble, Ruler, Trees, MapPin, Star } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { supabase, TABLE } from "@/app/lib/db";
import { getCachedPropertyBySlug } from "@/app/lib/public-properties";
import { formatPrice, CATEGORY_LABELS } from "@/app/lib/utils";
import Gallery from "./Gallery";
import ShareButton from "./ShareButton";

export const revalidate = 3600; // Re-generar cada 1 hora

// Pre-genera las páginas de propiedades destacadas en build time
export async function generateStaticParams() {
  const { data } = await supabase()
    .from(TABLE)
    .select("slug")
    .eq("featured", true)
    .limit(12);
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getCachedPropertyBySlug(slug);
  if (!property) return {};

  const location = [property.neighborhood, property.zone]
    .filter(Boolean)
    .join(", ");
  const desc = property.description.slice(0, 155).replace(/\s+/g, " ").trim();
  const title = property.title;
  const url = `https://ggpropiedades.com/propiedades/${slug}`;
  const image = property.images[0] ?? undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      type: "article",
      locale: "es_AR",
      siteName: "GG Propiedades",
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      ...(image && { images: [image] }),
    },
    other: {
      ...(location && { "geo.placename": location }),
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getCachedPropertyBySlug(slug);

  if (!property) notFound();

  const location = [property.neighborhood, property.zone]
    .filter(Boolean)
    .join(" · ");

  const price = formatPrice(property.price);
  const hasFeatures =
    property.pool || property.financing || property.mortgageEligible;

  // JSON-LD: Google Rich Results para inmuebles
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description.slice(0, 300),
    url: `https://ggpropiedades.com/propiedades/${slug}`,
    datePosted: property.createdAt,
    ...(property.images.length > 0 && { image: property.images }),
    ...(property.price && {
      offers: {
        "@type": "Offer",
        price: property.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
    address: {
      "@type": "PostalAddress",
      addressLocality: property.neighborhood ?? "Zona Norte",
      addressRegion: property.zone ?? "Buenos Aires",
      addressCountry: "AR",
    },
    ...(property.lotArea && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: property.lotArea,
        unitCode: "MTK",
      },
    }),
    ...(property.bedrooms != null && { numberOfRooms: property.bedrooms }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://ggpropiedades.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Propiedades",
        item: "https://ggpropiedades.com/propiedades",
      },
      { "@type": "ListItem", position: 3, name: property.title },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* ── Banner header ── */}
      <div
        className="relative flex items-end pb-10 pt-32 overflow-hidden"
        style={{ background: "var(--color-primary)", minHeight: "180px" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "url('/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="section-container relative z-10">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/propiedades"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--color-gold)" }}
            >
              <ArrowLeft size={14} />
              Volver al listado
            </Link>
            <ShareButton title={property.title} slug={slug} />
          </div>

          {/* Breadcrumbs */}
          <nav
            className="text-white/50 text-xs flex items-center gap-1.5 mb-3"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link
              href="/propiedades"
              className="hover:text-white transition-colors"
            >
              Propiedades
            </Link>
            <span>/</span>
            <span className="text-white/70 truncate max-w-[200px] lg:max-w-xs">
              {property.title}
            </span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            {property.featured && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "var(--color-gold)", color: "white" }}
              >
                <Star size={11} fill="white" /> Destacada
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm">
              {CATEGORY_LABELS[property.category] ?? property.category}
            </span>
          </div>
          <h1 className="font-display text-2xl lg:text-4xl font-bold text-white mt-2 leading-snug">
            {property.title}
          </h1>
          {location && (
            <p className="text-white/55 text-sm mt-1.5 flex items-center gap-1.5">
              <MapPin size={13} /> {location}
            </p>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="section-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: gallery + description */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Gallery images={property.images} title={property.title} />

            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h2 className="font-display text-lg font-bold mb-3">
                Descripción
              </h2>
              <p
                className="leading-relaxed whitespace-pre-line text-sm"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {property.description}
              </p>
            </div>
          </div>

          {/* Right: info */}
          <div className="flex flex-col gap-5">
            {/* Price + stats card */}
            <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-5">
              {/* Price */}
              <div>
                {price ? (
                  <p className="font-display text-3xl font-bold">{price}</p>
                ) : (
                  <p
                    className="text-sm italic"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    Consultar precio
                  </p>
                )}
              </div>

              {/* Stats */}
              <div
                className="grid grid-cols-1 gap-3 text-sm border-t pt-5"
                style={{ borderColor: "var(--color-border)" }}
              >
                {property.bedrooms != null && (
                  <div
                    className="flex items-center gap-2.5"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <BedDouble
                      size={16}
                      style={{ color: "var(--color-gold)" }}
                    />
                    <span>
                      {property.bedrooms} dormitorio
                      {property.bedrooms !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {property.coveredArea != null && (
                  <div
                    className="flex items-center gap-2.5"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <Ruler size={16} style={{ color: "var(--color-gold)" }} />
                    <span>{property.coveredArea} m² cubiertos</span>
                  </div>
                )}
                {property.semiCoveredArea != null && (
                  <div
                    className="flex items-center gap-2.5"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <Ruler size={16} style={{ color: "var(--color-gold)" }} />
                    <span>{property.semiCoveredArea} m² semicubiertos</span>
                  </div>
                )}
                {property.lotArea != null && (
                  <div
                    className="flex items-center gap-2.5"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <Trees size={16} style={{ color: "var(--color-gold)" }} />
                    <span>{property.lotArea} m² de lote</span>
                  </div>
                )}
              </div>

              {/* Feature tags */}
              {hasFeatures && (
                <div
                  className="flex flex-wrap gap-2 border-t pt-4"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {property.pool && (
                    <span className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                      Pileta
                    </span>
                  )}
                  {property.financing && (
                    <span className="px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-700">
                      Financiación
                    </span>
                  )}
                  {property.mortgageEligible && (
                    <span className="px-2.5 py-1 rounded-full text-xs bg-purple-50 text-purple-700">
                      Apto crédito
                    </span>
                  )}
                </div>
              )}

              {/* CTA — WhatsApp directo con mensaje pre-cargado */}
              <a
                href={`https://wa.me/5491127177588?text=${encodeURIComponent(`Hola! Me interesa la propiedad "${property.title}". ¿Me podés dar más información?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ background: "#25d366", color: "white" }}
              >
                <FaWhatsapp size={17} />
                Consultar por esta propiedad
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
