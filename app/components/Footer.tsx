import Link from "next/link";
import { MapPin, Phone, Clock } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";

const ZONE_LINKS = [
  { label: "Inmobiliaria en Pilar", href: "/inmobiliaria-en-pilar" },
  { label: "Inmobiliaria en Escobar", href: "/inmobiliaria-en-escobar" },
  { label: "Inmobiliaria en Zona Norte", href: "/inmobiliaria-zona-norte" },
];

const SITE_LINKS = [
  { label: "Propiedades en venta", href: "/propiedades" },
  { label: "Casas", href: "/propiedades?category=houses" },
  { label: "Terrenos", href: "/propiedades?category=lots" },
  { label: "Locales", href: "/propiedades?category=local" },
  { label: "Contacto", href: "/contacto" },
];

const SOCIAL = [
  {
    icon: FaWhatsapp,
    href: "https://wa.me/5491127177588",
    label: "WhatsApp",
  },
  {
    icon: FaInstagram,
    href: "https://www.instagram.com/gg.propiedades/",
    label: "Instagram",
  },
  {
    icon: FaFacebook,
    href: "https://www.facebook.com/GGPropiedades.Mariana/",
    label: "Facebook",
  },
];

export default function Footer() {
  return (
    <footer
      className="text-white"
      style={{ background: "var(--color-primary)" }}
    >
      <div className="section-container py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* NAP */}
          <div className="flex flex-col gap-3">
            <p className="font-display text-lg font-bold">GG Propiedades</p>
            <p className="text-sm text-white/70 leading-relaxed flex items-start gap-2">
              <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: "var(--color-gold)" }} />
              Colectora Acceso Norte km 49,5, Edificio Concord Rubí, Of. 302,
              La Lonja, Pilar, Buenos Aires
            </p>
            <a
              href="tel:+541166740000"
              className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
            >
              <Phone size={15} style={{ color: "var(--color-gold)" }} />
              +54 11 6674-0000
            </a>
            <p className="text-sm text-white/70 flex items-center gap-2">
              <Clock size={15} style={{ color: "var(--color-gold)" }} />
              Lunes a sábado de 10 a 18 h
            </p>
            <div className="flex gap-4 mt-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Zonas */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-4">
              Zonas
            </p>
            <ul className="flex flex-col gap-2.5">
              {ZONE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sitio */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-4">
              Navegación
            </p>
            <ul className="flex flex-col gap-2.5">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-white/40">
          © {new Date().getFullYear()} GG Propiedades · Inmobiliaria en Pilar,
          Escobar y Zona Norte del GBA
        </div>
      </div>
    </footer>
  );
}
