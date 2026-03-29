"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface Props {
  title: string;
  slug: string;
}

export default function ShareButton({ title, slug }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const url = `https://ggpropiedades.com/propiedades/${slug}`;
  const waText = `Mirá esta propiedad: "${title}" ${url}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-[--color-border] card-shadow hover:border-[--color-gold] transition-colors"
      >
        <Share2 size={15} />
        Compartir
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-12 z-50 bg-white rounded-xl card-shadow border border-[--color-border] p-2 flex flex-col gap-1 min-w-[180px]">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <FaWhatsapp size={16} className="text-green-600" />
              WhatsApp
            </a>
            <button
              onClick={() => { copy(); setOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors w-full text-left"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} style={{ color: "var(--color-muted-foreground)" }} />}
              {copied ? "Copiado" : "Copiar link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
