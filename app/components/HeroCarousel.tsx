"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BedDouble, Ruler, MapPin } from "lucide-react";
import { formatPrice } from "@/app/lib/utils";

interface FeaturedProperty {
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

interface HeroCarouselProps {
  properties: FeaturedProperty[];
}

const CATEGORY_LABELS: Record<string, string> = {
  houses: "Casa",
  lots: "Terreno",
  local: "Local",
};

export default function HeroCarousel({ properties }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const total = properties.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, total]);

  if (total === 0) {
    return (
      <section className="relative flex items-center justify-center min-h-screen bg-[--color-primary] overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 text-center text-white px-6 max-w-2xl animate-[slide-up_0.6s_ease-out]">
          <p className="text-[--color-gold] text-sm font-semibold uppercase tracking-[0.2em] mb-4">
            Zona Norte GBA · Pilar · Escobar
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Tu próxima propiedad te espera
          </h1>
          <p className="text-white/70 text-lg mb-8 leading-relaxed">
            Casas, terrenos y locales en barrios cerrados y countrys de Zona Norte.
            Más de 10 años acompañando a familias a encontrar su hogar.
          </p>
          <Link
            href="/propiedades"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--color-gold)", color: "white" }}
          >
            Ver propiedades
          </Link>
        </div>
      </section>
    );
  }

  const prop = properties[current];
  const location = [prop.neighborhood, prop.zone].filter(Boolean).join(" · ");
  const price    = formatPrice(prop.price);

  // Evita el flash gris mientras carga la imagen principal.
  const DARK_BLUR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGMQFJQAAABxADsqqQkpAAAAAElFTkSuQmCC";

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{ background: "oklch(10% 0.01 260)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {properties.map((p, i) => (
        <div
          key={p.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {p.images[0] ? (
            <Image
              src={p.images[0]}
              alt={p.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
              quality={85}
              placeholder="blur"
              blurDataURL={DARK_BLUR}
            />
          ) : (
            <div className="w-full h-full bg-[--color-primary]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}

      <div className="relative z-10 flex items-end min-h-screen pb-24 pt-32">
        <div className="section-container w-full">
          <div className="max-w-2xl animate-[fade-in_0.5s_ease-out]" key={current}>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ background: "var(--color-gold)", color: "white" }}
              >
                {CATEGORY_LABELS[prop.category] ?? prop.category}
              </span>
              <span className="text-white/60 text-sm font-medium">
                Propiedad destacada
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {prop.title}
            </h1>

            {location && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm mb-6">
                <MapPin size={14} />
                <span>{location}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-8">
              {prop.bedrooms != null && (
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <BedDouble size={16} className="text-[--color-gold-light]" />
                  {prop.bedrooms} dormitorio{prop.bedrooms !== 1 ? "s" : ""}
                </div>
              )}
              {prop.coveredArea != null && (
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Ruler size={16} className="text-[--color-gold-light]" />
                  {prop.coveredArea} m² cubiertos
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {price && (
                <span className="text-3xl font-bold text-white font-display">
                  {price}
                </span>
              )}
              <Link
                href={`/propiedades/${prop.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--color-gold)", color: "white" }}
              >
                Ver propiedad →
              </Link>
              <Link
                href="/propiedades"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-all"
              >
                Ver todas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1">
            {properties.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="flex items-center justify-center py-2"
                aria-label={`Slide ${i + 1}`}
              >
                <span
                  className="block transition-all duration-300 rounded-full"
                  style={{
                    width: i === current ? "24px" : "8px",
                    height: "8px",
                    background: i === current ? "var(--color-gold)" : "rgba(255,255,255,0.4)",
                  }}
                />
              </button>
            ))}
          </div>

          <div className="absolute bottom-8 right-6 lg:right-10 z-20 text-white/50 text-xs font-medium tabular-nums">
            {current + 1} / {total}
          </div>
        </>
      )}
    </section>
  );
}
