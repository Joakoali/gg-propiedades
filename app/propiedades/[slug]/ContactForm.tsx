"use client";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ContactFormProps {
  propertyTitle: string;
  price: string | null;
  slug: string;
}

const INITIAL_FORM = { name: "", email: "", phone: "" };

export default function ContactForm({ propertyTitle, price, slug }: ContactFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const propertyUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/propiedades/${slug}`
        : "";

    const lines = [
      `Hola! Me interesa la propiedad *${propertyTitle}*${price ? ` (${price})` : ""}.`,
      ``,
      `Mi nombre es *${form.name}* y mi teléfono es *${form.phone}*.`,
      form.email ? `Mi email es ${form.email}.` : null,
      ``,
      `¿Podría darme más información?`,
      propertyUrl ? `\nVer propiedad: ${propertyUrl}` : null,
    ].filter((line) => line !== null);

    window.open(
      `https://wa.me/5491166740000?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
    );
    setSent(true);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSent(false);
    setOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 transition-colors"
        style={{ background: "#25d366", color: "white" }}
      >
        <div className="flex items-center gap-3">
          <FaWhatsapp size={20} />
          <div className="text-left">
            <p className="font-semibold text-sm leading-tight">Consultá por esta propiedad</p>
            <p className="text-white/75 text-xs leading-tight">Completá tus datos y te abrimos WhatsApp</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expandable form */}
      {open && (
        <div className="px-5 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                <FaWhatsapp size={22} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">¡Consulta enviada!</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  Se abrió WhatsApp con el mensaje listo.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-xs underline transition-colors"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Hacer otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-xs -mt-1 mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                Te redirigimos a WhatsApp con el mensaje pre-armado.
              </p>

              <input
                name="name"
                placeholder="Tu nombre *"
                required
                value={form.name}
                onChange={handleChange}
                className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: "var(--color-border)",
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": "var(--color-gold)",
                }}
              />
              <input
                name="phone"
                type="tel"
                placeholder="Tu teléfono *"
                required
                value={form.phone}
                onChange={handleChange}
                className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: "var(--color-border)" }}
              />
              <input
                name="email"
                type="email"
                placeholder="Tu email (opcional)"
                value={form.email}
                onChange={handleChange}
                className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition"
                style={{ borderColor: "var(--color-border)" }}
              />

              <button
                type="submit"
                className="py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 mt-1"
                style={{ background: "#25d366", color: "white" }}
              >
                <FaWhatsapp size={16} />
                Enviar por WhatsApp
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
