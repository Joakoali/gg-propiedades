export const runtime = "nodejs";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import HeroCarousel from "@/app/components/HeroCarousel";
import PropertyCard from "@/app/components/PropertyCard";
import { ZONES } from "@/app/lib/utils";
import {
  ShieldCheck,
  Search,
  Calculator,
  ArrowRight,
  Phone,
  MapPin,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface FeaturedPropertyCard {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  images: string[];
  neighborhood: string | null;
  zone: string | null;
  bedrooms: number | null;
  coveredArea: number | null;
  category: string;
}

// ── Data fetching (Server Component — sin waterfalls, Promise.all) ─────────────

async function getHomeData() {
  const [featured, stats] = await Promise.all([
    prisma.property.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        images: true,
        neighborhood: true,
        zone: true,
        bedrooms: true,
        coveredArea: true,
        category: true,
      },
    }),
    prisma.property.aggregate({ _count: { id: true } }),
  ]);
  return { featured, totalProperties: stats._count.id };
}

// ── Constantes estáticas ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Transparencia total",
    desc: "Sin comisiones sorpresa. Te brindamos información clara y detallada desde el primer contacto.",
  },
  {
    icon: Search,
    title: "Encontrá lo que buscás",
    desc: "Más de 100 propiedades activas en barrios cerrados y countrys de toda la Zona Norte.",
  },
  {
    icon: Calculator,
    title: "Tasación gratuita",
    desc: "Nuestro equipo evalúa el valor de tu propiedad sin costo ni compromiso.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { featured, totalProperties } = await getHomeData();

  const STATS = [
    { value: `${totalProperties}+`, label: "Propiedades activas" },
    { value: "10+", label: "Años de experiencia" },
    { value: "500+", label: "Familias asesoradas" },
    { value: "100%", label: "Transparencia" },
  ];

  // Preload de la primera imagen del hero desde el servidor.
  const heroPreloadUrl =
    (featured[0] as FeaturedPropertyCard | undefined)?.images?.[0] ?? null;

  return (
    <main>
      {/* Preload de la imagen LCP del hero (generado server-side) */}
      {heroPreloadUrl && (
        <link
          rel="preload"
          as="image"
          href={heroPreloadUrl}
          fetchPriority="high"
        />
      )}

      {/* ══ 1. HERO CAROUSEL ══ */}
      <HeroCarousel properties={featured} />

      {/* ══ 2. ZONAS DE COBERTURA ══ */}
      <section
        className="py-14 bg-white border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="section-container">
          <div className="text-center mb-8">
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: "var(--color-gold)" }}
            >
              Cobertura
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold">
              Zonas donde operamos
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {ZONES.map((zone) => (
              <Link
                key={zone}
                href={`/propiedades?zone=${encodeURIComponent(zone)}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-sm font-medium border border-[--color-border] hover:border-[--color-gold] hover:text-[--color-gold-dark] transition-all card-shadow"
              >
                <MapPin size={13} style={{ color: "var(--color-gold)" }} />
                {zone}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. PROPIEDADES DESTACADAS ══ */}
      {featured.length > 0 && (
        <section className="py-20 bg-[--color-muted]">
          <div className="section-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p
                  className="text-sm font-semibold uppercase tracking-[0.2em] mb-2"
                  style={{ color: "var(--color-gold)" }}
                >
                  Selección especial
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-[--color-foreground]">
                  Propiedades destacadas
                </h2>
              </div>
              <Link
                href="/propiedades"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium transition-all hover:gap-3"
                style={{ color: "var(--color-gold-dark)" }}
              >
                Ver todas <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(featured.slice(0, 6) as FeaturedPropertyCard[]).map(
                (property) => (
                  <PropertyCard key={property.id} property={property} />
                ),
              )}
            </div>

            <div className="text-center mt-10 sm:hidden">
              <Link
                href="/propiedades"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                Ver todas las propiedades <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ 4. POR QUÉ ELEGIRNOS ══ */}
      <section className="py-20 bg-white">
        <div className="section-container">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: "var(--color-gold)" }}
            >
              Nuestra propuesta
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Nos dedicamos a la comercialización de casas y lotes en barrios
              cerrados y countrys de Zona Norte del GBA, con un servicio
              personalizado y transparente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group flex flex-col items-center text-center p-8 rounded-2xl border border-[--color-border] hover:border-[--color-gold-light] card-shadow hover:card-shadow-hover transition-all duration-300"
              >
                <div
                  className="size-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: "var(--color-gold-light)" }}
                >
                  <Icon size={24} style={{ color: "var(--color-gold-dark)" }} />
                </div>
                <h3 className="font-display text-lg font-bold mb-3">{title}</h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. ESTADÍSTICAS ══ */}
      <section
        className="py-14 border-t border-b"
        style={{
          background: "var(--color-muted)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="section-container">
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x"
            style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}
          >
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center px-4"
              >
                <span
                  className="font-display text-4xl font-bold mb-1"
                  style={{ color: "var(--color-gold)" }}
                >
                  {value}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. CTA FINAL ══ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "var(--color-primary)" }}
      >
        <div
          className="absolute -right-40 -top-40 size-96 rounded-full opacity-[0.04]"
          style={{ background: "var(--color-gold)" }}
        />
        <div
          className="absolute -left-20 -bottom-20 size-64 rounded-full opacity-[0.04]"
          style={{ background: "var(--color-gold)" }}
        />

        <div className="section-container relative z-10 text-center max-w-2xl mx-auto">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--color-gold)" }}
          >
            Estamos para ayudarte
          </p>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            ¿Necesitás asesoramiento?
          </h2>
          <p className="text-white/55 text-lg mb-10 leading-relaxed">
            Ya sea que quieras comprar, vender o tasar una propiedad, nuestro
            equipo te acompaña en cada paso del proceso.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/5491166740000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--color-gold)", color: "white" }}
            >
              <Phone size={16} />
              Consultanos por WhatsApp
            </a>
            <Link
              href="/propiedades"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Explorar propiedades
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer
        style={{
          background: "var(--color-primary)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
        className="py-8"
      >
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-black text-xl text-white">
              GG
            </span>
            <span
              className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "var(--color-gold)" }}
            >
              Propiedades
            </span>
          </div>
          <p className="text-white/25 text-xs text-center">
            © {new Date().getFullYear()} GG Propiedades · CMCPSI 6583 · Zona
            Norte GBA
          </p>
          <div className="flex gap-1">
            {[
              { label: "Propiedades", href: "/propiedades" },
              { label: "Contacto", href: "/contacto" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-white/35 hover:text-white/70 text-xs transition-colors px-2"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
