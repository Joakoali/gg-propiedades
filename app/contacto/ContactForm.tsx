"use client";
import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({})) as { error?: string };

      if (!res.ok) {
        setErrorMsg(data.error ?? "Error desconocido. Intentá de nuevo.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("No se pudo conectar con el servidor. Revisá tu conexión.");
      setStatus("error");
    }
  };

  const inputClass = "border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition w-full";
  const inputStyle = { borderColor: "var(--color-border)" };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div
          className="size-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--color-gold-light)" }}
        >
          <CheckCircle size={28} style={{ color: "var(--color-gold-dark)" }} />
        </div>
        <div>
          <p className="font-display text-lg font-bold">¡Mensaje enviado!</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Nos comunicaremos a la brevedad a <strong>{form.email}</strong>.
          </p>
        </div>
        <button
          onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "", message: "" }); }}
          className="text-sm underline transition-colors mt-1"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
            Nombre *
          </label>
          <input
            id="name" name="name" placeholder="Tu nombre completo"
            required value={form.name} onChange={handleChange}
            className={inputClass} style={inputStyle}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
            Email *
          </label>
          <input
            id="email" name="email" type="email" placeholder="tu@email.com"
            required value={form.email} onChange={handleChange}
            className={inputClass} style={inputStyle}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
          Teléfono <span className="font-normal normal-case">(opcional)</span>
        </label>
        <input
          id="phone" name="phone" type="tel" placeholder="+54 11 0000-0000"
          value={form.phone} onChange={handleChange}
          className={inputClass} style={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
          Mensaje *
        </label>
        <textarea
          id="message" name="message" placeholder="¿En qué podemos ayudarte?"
          required value={form.message} onChange={handleChange}
          className={`${inputClass} h-32 resize-none`} style={inputStyle}
        />
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#b91c1c" }}>
          <AlertCircle size={16} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: "var(--color-primary)", color: "white" }}
      >
        {status === "loading" ? (
          <><Loader2 size={15} className="animate-spin" /> Enviando…</>
        ) : (
          <><Send size={15} /> Enviar mensaje</>
        )}
      </button>
    </form>
  );
}
