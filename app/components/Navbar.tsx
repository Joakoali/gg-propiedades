"use client";

import { startTransition, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Home, Building2, Phone } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";

const CATEGORIES = [
  { label: "Todas las propiedades", href: "/propiedades" },
  { label: "Casas", href: "/propiedades?category=houses" },
  { label: "Terrenos", href: "/propiedades?category=lots" },
  { label: "Locales", href: "/propiedades?category=local" },
];

const SOCIAL = [
  {
    icon: FaWhatsapp,
    href: "https://wa.me/5491127177588",
    label: "WhatsApp",
    brandColor: "#25d366",
  },
  {
    icon: FaInstagram,
    href: "https://instagram.com/gg.propiedades",
    label: "Instagram",
    brandColor: "#e1306c",
  },
  {
    icon: FaFacebook,
    href: "https://www.facebook.com/GGPropiedades.Mariana",
    label: "Facebook",
    brandColor: "#1877f2",
  },
];

const NAVBAR_LOGOS = {
  light: "/LOGO - GG PROPIEDADES SIN FONDO-02.png",
  dark: "/LOGO - GG PROPIEDADES SIN FONDO-01.png",
} as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    startTransition(() => {
      setMobileOpen(false);
      setDropdownOpen(false);
    });
  }, [pathname]);

  const transparent = isHome && !scrolled;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: transparent ? "transparent" : "rgba(255,255,255,0.96)",
          backdropFilter: transparent ? "none" : "blur(12px)",
          borderBottom: transparent ? "none" : "1px solid var(--color-border)",
          boxShadow: transparent ? "none" : "0 1px 20px oklch(10% 0 0 / 0.07)",
        }}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center select-none">
              <Image
                src={transparent ? NAVBAR_LOGOS.light : NAVBAR_LOGOS.dark}
                alt="GG Propiedades"
                width={210}
                height={68}
                priority
                className="h-14 w-auto sm:h-16 lg:h-[72px] transition-opacity duration-300"
              />
            </Link>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-0.5">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: transparent
                    ? "rgba(255,255,255,0.9)"
                    : "var(--color-foreground)",
                }}
              >
                Inicio
              </Link>

              {/* Dropdown Propiedades */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    color: transparent
                      ? "rgba(255,255,255,0.9)"
                      : "var(--color-foreground)",
                  }}
                >
                  Propiedades
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white rounded-2xl py-2 z-50 animate-[scale-in_0.18s_ease-out]"
                    style={{
                      boxShadow: "0 8px 40px oklch(10% 0 0 / 0.14)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[--color-muted] transition-colors"
                      >
                        <Building2
                          size={14}
                          style={{ color: "var(--color-gold)" }}
                        />
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/contacto"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: transparent
                    ? "rgba(255,255,255,0.9)"
                    : "var(--color-foreground)",
                }}
              >
                Contacto
              </Link>
            </nav>

            {/* Redes sociales desktop — color de marca, blanco en hero */}
            <div className="hidden lg:flex items-center gap-3">
              {SOCIAL.map(({ icon: Icon, href, label, brandColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="transition-all hover:scale-110"
                  style={{
                    color: transparent ? "rgba(255,255,255,0.75)" : brandColor,
                  }}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>

            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{
                color: transparent ? "white" : "var(--color-foreground)",
              }}
              aria-label="Menú"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ══ Menú mobile ══ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col pt-20 pb-8 px-6 overflow-y-auto animate-[fade-in_0.2s_ease-out]">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-xl hover:bg-[--color-muted] transition-colors"
            >
              <Home size={18} style={{ color: "var(--color-gold)" }} />
              Inicio
            </Link>

            <div className="px-4 py-3">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Propiedades
              </p>
              <div className="flex flex-col gap-0.5">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-[--color-muted] transition-colors"
                  >
                    <Building2
                      size={14}
                      style={{ color: "var(--color-gold)" }}
                    />
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/contacto"
              className="flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-xl hover:bg-[--color-muted] transition-colors"
            >
              <Phone size={18} style={{ color: "var(--color-gold)" }} />
              Contacto
            </Link>
          </nav>

          <div className="mt-auto pt-8 border-t border-[--color-border]">
            <div className="flex justify-center gap-6">
              {SOCIAL.map(({ icon: Icon, href, label, brandColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="transition-transform hover:scale-110"
                  style={{ color: brandColor }}
                >
                  <Icon size={26} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
