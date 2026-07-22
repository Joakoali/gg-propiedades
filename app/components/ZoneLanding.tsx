import Link from "next/link";
import { MapPin, ChevronRight, Phone } from "lucide-react";
import {
  BASE_URL,
  ZONE_CONTENT,
  type ZoneKey,
} from "@/app/lib/zone-content";
import {
  getHomeData,
  getPropertyList,
} from "@/app/lib/public-properties";
import PropertyCard from "@/app/components/PropertyCard";

const MAX_PROPERTIES = 6;

async function getZoneProperties(zoneFilter: string | null) {
  // La sección de propiedades es opcional: si la consulta falla, la página
  // se renderiza igual con el contenido estático.
  try {
    if (zoneFilter) {
      const { properties } = await getPropertyList({ zone: zoneFilter }, 1);
      return properties.slice(0, MAX_PROPERTIES);
    }
    const { featured } = await getHomeData();
    return featured.slice(0, MAX_PROPERTIES);
  } catch {
    return [];
  }
}

export default async function ZoneLanding({ zoneKey }: { zoneKey: ZoneKey }) {
  const zone = ZONE_CONTENT[zoneKey];
  const properties = await getZoneProperties(zone.zoneFilter);
  const url = `${BASE_URL}/${zone.slug}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: zone.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: zone.h1, item: url },
    ],
  };

  const catalogHref = zone.zoneFilter
    ? `/propiedades?zone=${encodeURIComponent(zone.zoneFilter)}`
    : "/propiedades";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <div
        className="relative flex items-end pb-10 pt-32 overflow-hidden"
        style={{ background: "var(--color-primary)", minHeight: "220px" }}
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
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--color-gold)" }}
          >
            {zone.tagline}
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white">
            {zone.h1}
          </h1>
        </div>
      </div>

      <div className="section-container py-12 flex flex-col gap-14">
        {/* Intro */}
        <section className="max-w-3xl flex flex-col gap-4">
          {zone.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        {/* Barrios */}
        <section>
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-6">
            {zone.barriosTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zone.barrios.map((barrio) => (
              <div
                key={barrio.name}
                className="bg-white rounded-2xl p-5 card-shadow"
              >
                <h3 className="font-display font-semibold flex items-center gap-2 mb-1.5">
                  <MapPin size={15} style={{ color: "var(--color-gold)" }} />
                  {barrio.name}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {barrio.blurb}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Precios orientativos */}
        <section>
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-2">
            {zone.pricingTitle}
          </h2>
          <p
            className="text-xs mb-6"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Actualizado: {zone.pricingUpdated}
          </p>
          <div className="bg-white rounded-2xl card-shadow divide-y divide-[--color-border] max-w-2xl">
            {zone.pricingRows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-4"
              >
                <span className="text-sm font-medium">{row.label}</span>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <p
            className="text-sm mt-4 max-w-2xl leading-relaxed"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {zone.pricingNote}
          </p>
        </section>

        {/* Propiedades */}
        {properties.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl lg:text-3xl font-bold">
                Propiedades en {zone.name}
              </h2>
              <Link
                href={catalogHref}
                className="hidden sm:flex items-center gap-1 text-sm font-medium"
                style={{ color: "var(--color-gold-dark)" }}
              >
                Ver todas <ChevronRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href={catalogHref}
                className="text-sm font-medium underline"
                style={{ color: "var(--color-gold-dark)" }}
              >
                Ver todas las propiedades en {zone.name}
              </Link>
            </div>
          </section>
        )}

        {/* FAQs */}
        <section>
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-6">
            Preguntas frecuentes
          </h2>
          <div className="flex flex-col gap-3 max-w-3xl">
            {zone.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white rounded-2xl card-shadow px-5 py-4"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-medium text-sm sm:text-base">
                  {faq.question}
                  <ChevronRight
                    size={16}
                    className="shrink-0 transition-transform group-open:rotate-90"
                    style={{ color: "var(--color-gold)" }}
                  />
                </summary>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA + related */}
        <section className="bg-white rounded-2xl card-shadow p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="font-display text-xl lg:text-2xl font-bold mb-1">
              ¿Querés comprar o vender en {zone.name}?
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Tasaciones gratuitas y asesoramiento sin compromiso.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {zone.related.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium underline"
                  style={{ color: "var(--color-gold-dark)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white shrink-0"
            style={{ background: "var(--color-primary)" }}
          >
            <Phone size={15} /> Contactanos
          </Link>
        </section>
      </div>
    </div>
  );
}
