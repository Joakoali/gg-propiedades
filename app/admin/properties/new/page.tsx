"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import { ZONES } from "@/app/lib/utils";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "houses",
    description: "",
    bedrooms: "",
    coveredArea: "",
    semiCoveredArea: "",
    lotArea: "",
    neighborhood: "",
    zone: "",
    pool: false,
    financing: false,
    mortgageEligible: false,
    featured: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let imageUrls: string[] = [];
    if (images.length > 0) {
      const fd = new FormData();
      images.forEach((file) => fd.append("images", file));
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Error al subir las imágenes");
        setLoading(false);
        return;
      }
      const { urls } = await uploadRes.json();
      imageUrls = urls;
    }

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, images: imageUrls }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Hubo un error al cargar la propiedad");
    }
    setLoading(false);
  }

  const inputClass = "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition";
  const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>

      {/* Header bar */}
      <div style={{ background: "var(--color-primary)" }} className="sticky top-0 z-30">
        <div className="section-container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg text-white">GG</span>
              <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--color-gold)" }}>
                Propiedades
              </span>
            </div>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Admin</span>
          </div>
        </div>
      </div>

      <div className="section-container py-10 max-w-3xl">

        {/* Back + title */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "var(--color-gold-dark)" }}
        >
          <ArrowLeft size={14} /> Volver al panel
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--color-gold-dark)" }}>
            Nueva propiedad
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Cargar propiedad</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Información básica */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-5">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Información básica
            </h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                Título *
              </label>
              <input
                id="title"
                name="title"
                placeholder="Ej: Casa en San Sebastián, 4 dormitorios"
                onChange={handleChange}
                className={inputClass}
                style={{ borderColor: "var(--color-border)" }}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="price" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  Precio (USD, opcional)
                </label>
                <input
                  id="price"
                  name="price"
                  placeholder="Ej: 350000"
                  type="number"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  Categoría *
                </label>
                <select
                  id="category"
                  name="category"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <option value="houses">Casa</option>
                  <option value="lots">Terreno</option>
                  <option value="local">Local</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                Descripción *
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Describí la propiedad en detalle..."
                onChange={handleChange}
                className={`${inputClass} h-36 resize-none`}
                style={{ borderColor: "var(--color-border)" }}
                required
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-5">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Ubicación
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="neighborhood" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  Barrio
                </label>
                <input
                  id="neighborhood"
                  name="neighborhood"
                  placeholder="Ej: El Cantón"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="zone" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  Zona
                </label>
                <select
                  id="zone"
                  name="zone"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <option value="">— Sin zona —</option>
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Medidas */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-5">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Medidas y ambientes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bedrooms" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  Dormitorios
                </label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  placeholder="4"
                  type="number"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="coveredArea" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  M² cub.
                </label>
                <input
                  id="coveredArea"
                  name="coveredArea"
                  placeholder="280"
                  type="number"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="semiCoveredArea" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  M² semi
                </label>
                <input
                  id="semiCoveredArea"
                  name="semiCoveredArea"
                  placeholder="30"
                  type="number"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lotArea" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  M² lote
                </label>
                <input
                  id="lotArea"
                  name="lotArea"
                  placeholder="600"
                  type="number"
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-4">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Imágenes
            </h2>
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
              style={{ borderColor: "var(--color-border)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="size-12 rounded-xl flex items-center justify-center mb-1"
                  style={{ background: "var(--color-gold-light)" }}
                >
                  <Upload size={20} style={{ color: "var(--color-gold-dark)" }} />
                </div>
                <p className="text-sm font-medium">Hacé clic para seleccionar imágenes</p>
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  PNG, JPG, WEBP — podés agregar varias a la vez
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`preview-${i}`}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 size-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-gold)", color: "white" }}>
                        Principal
                      </span>
                    )}
                  </div>
                ))}
                <div
                  className="border-2 border-dashed rounded-xl h-24 flex items-center justify-center cursor-pointer transition-colors"
                  style={{ borderColor: "var(--color-border)" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={20} style={{ color: "var(--color-muted-foreground)" }} />
                </div>
              </div>
            )}
          </div>

          {/* Características */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-4">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Características
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "pool", label: "Pileta" },
                { name: "financing", label: "Financiación" },
                { name: "mortgageEligible", label: "Apto crédito" },
                { name: "featured", label: "Destacada" },
              ].map(({ name, label }) => (
                <label
                  key={name}
                  className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors hover:border-[--color-gold]"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <input
                    name={name}
                    type="checkbox"
                    onChange={handleChange}
                    className="size-4 rounded"
                    style={{ accentColor: "var(--color-gold)" }}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-6 py-3 rounded-xl text-sm font-medium border transition"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--color-primary)", color: "white" }}
            >
              {loading ? "Guardando..." : "Guardar propiedad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
