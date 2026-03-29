import ContactForm from "./ContactForm";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";
import { MapPin, Phone, Mail } from "lucide-react";

export const metadata = {
  title: "Contacto",
  description: "Contactate con GG Propiedades para comprar, vender o tasar una propiedad en Zona Norte GBA.",
};

const CONTACT_INFO = [
  {
    icon: Phone,
    label: "Teléfono / WhatsApp",
    value: "+54 9 11 6674-0000",
    href: "https://wa.me/5491166740000",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@ggpropiedades.com",
    href: "mailto:info@ggpropiedades.com",
  },
  {
    icon: MapPin,
    label: "Zona de cobertura",
    value: "Zona Norte",
    href: null,
  },
] as const;

const SOCIAL_LINKS = [
  {
    icon: FaWhatsapp,
    label: "WhatsApp",
    href: "https://wa.me/5491166740000",
    color: "#25d366",
  },
  {
    icon: FaInstagram,
    label: "Instagram",
    href: "https://instagram.com/gg.propiedades",
    color: "#e1306c",
  },
  {
    icon: FaFacebook,
    label: "Facebook",
    href: "https://www.facebook.com/GGPropiedades.Mariana",
    color: "#1877f2",
  },
] as const;

export default function ContactoPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>

      {/* ── Banner header ── */}
      <div
        className="relative flex items-end pb-10 pt-32 overflow-hidden"
        style={{ background: "var(--color-primary)", minHeight: "220px" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "url('/hero.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="section-container relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-gold)" }}>
            Estamos para ayudarte
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white">Contacto</h1>
          <p className="text-white/50 mt-2 text-sm">
            Encontrá tu próxima propiedad con nuestro equipo especializado.
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="section-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: contact form */}
          <div className="bg-white rounded-2xl card-shadow p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-gold)" }}>
              Escribinos
            </p>
            <h2 className="font-display text-2xl font-bold mb-6">Envianos un mensaje</h2>
            <ContactForm />
          </div>

          {/* Right: info + social */}
          <div className="flex flex-col gap-6">

            {/* Contact info card */}
            <div className="bg-white rounded-2xl card-shadow p-8 flex flex-col gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-gold)" }}>
                  Datos de contacto
                </p>
                <h2 className="font-display text-xl font-bold">Información</h2>
              </div>

              <ul className="flex flex-col gap-4">
                {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-3">
                    <div
                      className="size-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--color-gold-light)" }}
                    >
                      <Icon size={17} style={{ color: "var(--color-gold-dark)" }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium mt-0.5 block transition-colors hover:underline"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm mt-0.5" style={{ color: "var(--color-foreground)" }}>{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Social links */}
              <div className="border-t pt-5" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-muted-foreground)" }}>
                  Redes sociales
                </p>
                <div className="flex gap-3">
                  {SOCIAL_LINKS.map(({ icon: Icon, label, href, color }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="size-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: "var(--color-muted)", color }}
                    >
                      <Icon size={20} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: "var(--color-primary)", borderTop: "1px solid rgba(255,255,255,0.08)" }} className="py-8">
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-black text-xl text-white">GG</span>
            <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--color-gold)" }}>
              Propiedades
            </span>
          </div>
          <p className="text-white/25 text-xs text-center">
            © {new Date().getFullYear()} GG Propiedades · CMCPSI 6583 · Zona Norte GBA
          </p>
          <div className="flex gap-1">
            {[{ label: "Propiedades", href: "/propiedades" }, { label: "Contacto", href: "/contacto" }].map((l) => (
              <a key={l.href} href={l.href} className="text-white/35 hover:text-white/70 text-xs transition-colors px-2">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
