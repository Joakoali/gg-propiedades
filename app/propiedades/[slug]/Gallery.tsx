"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Home, X, ZoomIn } from "lucide-react";

interface GalleryProps {
  images: string[];
  title: string;
}

export default function Gallery({ images, title }: GalleryProps) {
  const [selected, setSelected]     = useState(0);
  const [lightbox, setLightbox]     = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightbox(true);
  };

  const closeLightbox = () => setLightbox(false);

  const lbPrev = useCallback(() => setLightboxIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const lbNext = useCallback(() => setLightboxIdx((i) => (i + 1) % images.length), [images.length]);

  // Teclado: ← → Esc
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  lbPrev();
      if (e.key === "ArrowRight") lbNext();
      if (e.key === "Escape")     closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, lbPrev, lbNext]);

  // Bloquear scroll cuando el lightbox está abierto
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  if (images.length === 0) {
    return (
      <div
        className="rounded-2xl aspect-[4/3] sm:h-80 flex items-center justify-center card-shadow"
        style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
      >
        <div className="flex flex-col items-center gap-2">
          <Home size={32} />
          <span className="text-sm">Sin imágenes</span>
        </div>
      </div>
    );
  }

  const prev = () => setSelected((i) => (i - 1 + images.length) % images.length);
  const next = () => setSelected((i) => (i + 1) % images.length);

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Imagen principal — click abre lightbox */}
        <div
          className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-auto sm:h-[420px] card-shadow img-skeleton cursor-zoom-in group"
          onClick={() => openLightbox(selected)}
          role="button"
          aria-label="Ver imagen ampliada"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(selected); } }}
        >
          <Image
            src={images[selected]}
            alt={`${title} - foto ${selected + 1}`}
            fill
            className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 55vw"
            priority={selected === 0}
            quality={85}
          />
          {/* Indicador de zoom */}
          <div className="absolute top-3 right-3 size-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={15} />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Siguiente foto"
                className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
              >
                <ChevronRight size={18} />
              </button>
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium tabular-nums">
                {selected + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                aria-label={`Ver foto ${i + 1}`}
                className="relative shrink-0 size-20 rounded-xl overflow-hidden border-2 transition-all"
                style={{
                  borderColor: i === selected ? "var(--color-gold)" : "transparent",
                  opacity: i === selected ? 1 : 0.55,
                }}
              >
                <Image
                  src={src}
                  alt={`miniatura ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  quality={60}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.93)" }}
          onClick={closeLightbox}
        >
          {/* Imagen centrada */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] mx-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIdx]}
              alt={`${title} - foto ${lightboxIdx + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              quality={90}
            />
          </div>

          {/* Cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Contador */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
            {lightboxIdx + 1} / {images.length}
          </div>

          {/* Flechas */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lbPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition"
                aria-label="Anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition"
                aria-label="Siguiente"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
