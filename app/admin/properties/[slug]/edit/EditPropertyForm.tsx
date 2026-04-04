"use client";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import { ZONES } from "@/app/lib/utils";
import { compressImages, uploadWithPresignedUrls } from "@/app/lib/image-utils";

interface Property {
  slug: string;
  title: string;
  price: number | null;
  category: string;
  description: string;
  images: string[];
  bedrooms: number | null;
  coveredArea: number | null;
  semiCoveredArea: number | null;
  lotArea: number | null;
  neighborhood: string | null;
  zone: string | null;
  pool: boolean;
  financing: boolean;
  mortgageEligible: boolean;
  featured: boolean;
}

export default function EditPropertyForm({ property }: { property: Property }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/properties/${property.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("save failed");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      router.push("/admin");
    },
    onError: () => {
      setError("Hubo un error al guardar los cambios");
      setLoading(false);
    },
  });

  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [existingImages, setExistingImages] = useState<string[]>(property.images);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: property.title,
    price: property.price?.toString() ?? "",
    category: property.category,
    description: property.description,
    bedrooms: property.bedrooms?.toString() ?? "",
    coveredArea: property.coveredArea?.toString() ?? "",
    semiCoveredArea: property.semiCoveredArea?.toString() ?? "",
    lotArea: property.lotArea?.toString() ?? "",
    neighborhood: property.neighborhood ?? "",
    zone: property.zone ?? "",
    pool: property.pool,
    financing: property.financing,
    mortgageEligible: property.mortgageEligible,
    featured: property.featured,
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

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUploadStatus("");

    let uploadedUrls: string[] = [];
    if (newFiles.length > 0) {
      setUploadStatus("Comprimiendo imágenes...");
      let compressed: File[];
      try {
        compressed = await compressImages(newFiles, (done, total) => {
          setUploadStatus(`Comprimiendo ${done}/${total}...`);
        });
      } catch {
        setError("Error al comprimir las imágenes");
        setLoading(false);
        return;
      }

      setUploadStatus("Subiendo imágenes...");
      const result = await uploadWithPresignedUrls(compressed, (uploaded, total) => {
        setUploadStatus(`Subiendo ${uploaded}/${total}...`);
      });

      if (result.urls.length === 0) {
        setError("Error al subir las imágenes: " + (result.errors[0] ?? "error desconocido"));
        setLoading(false);
        return;
      }
      uploadedUrls = result.urls;

      if (result.errors.length > 0) {
        console.warn("Algunas imágenes fallaron:", result.errors);
      }
    }

    setUploadStatus("Guardando...");
    const finalImages = [...existingImages, ...uploadedUrls];
    saveMutation.mutate({ ...form, images: finalImages });
  }

  const totalImages = existingImages.length + newPreviews.length;
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

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "var(--color-gold-dark)" }}
        >
          <ArrowLeft size={14} /> Volver al panel
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--color-gold-dark)" }}>
            Editar propiedad
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold line-clamp-1">{property.title}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Información básica */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-5">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Información básica
            </h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>Título *</label>
              <input id="title" name="title" placeholder="Título de la propiedad" value={form.title} onChange={handleChange} className={inputClass} style={{ borderColor: "var(--color-border)" }} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="price" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>Precio (USD, opcional)</label>
                <input id="price" name="price" placeholder="Ej: 350000" type="number" value={form.price} onChange={handleChange} className={inputClass} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>Categoría *</label>
                <select id="category" name="category" value={form.category} onChange={handleChange} className={inputClass} style={{ borderColor: "var(--color-border)" }}>
                  <option value="houses">Casa</option>
                  <option value="lots">Terreno</option>
                  <option value="local">Local</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>Descripción *</label>
              <textarea id="description" name="description" placeholder="Descripción de la propiedad" value={form.description} onChange={handleChange} className={`${inputClass} h-36 resize-none`} style={{ borderColor: "var(--color-border)" }} required />
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-5">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Ubicación
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="neighborhood" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>Barrio</label>
                <input id="neighborhood" name="neighborhood" placeholder="Ej: El Cantón" value={form.neighborhood} onChange={handleChange} className={inputClass} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="zone" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>Zona</label>
                <select id="zone" name="zone" value={form.zone} onChange={handleChange} className={inputClass} style={{ borderColor: "var(--color-border)" }}>
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
              {[
                { id: "bedrooms", label: "Dormitorios", placeholder: "4" },
                { id: "coveredArea", label: "M² cub.", placeholder: "280" },
                { id: "semiCoveredArea", label: "M² semi", placeholder: "30" },
                { id: "lotArea", label: "M² lote", placeholder: "600" },
              ].map(({ id, label, placeholder }) => (
                <div key={id} className="flex flex-col gap-1.5">
                  <label htmlFor={id} className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
                  <input
                    id={id}
                    name={id}
                    placeholder={placeholder}
                    type="number"
                    value={form[id as keyof typeof form] as string}
                    onChange={handleChange}
                    className={inputClass}
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-2xl p-6 card-shadow flex flex-col gap-4">
            <h2 className="font-display text-base font-bold border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              Imágenes{totalImages > 0 && <span className="text-sm font-normal ml-1.5" style={{ color: "var(--color-muted-foreground)" }}>({totalImages})</span>}
            </h2>

            {existingImages.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>Fotos actuales</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {existingImages.map((src, i) => (
                    <div key={src} className="relative group rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`foto-${i + 1}`} className="w-full h-24 object-cover" />
                      <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1.5 right-1.5 size-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newPreviews.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-muted-foreground)" }}>Fotos nuevas</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {newPreviews.map((src, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-dashed" style={{ borderColor: "var(--color-gold)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`nueva-${i + 1}`} className="w-full h-24 object-cover" />
                      <button type="button" onClick={() => removeNewFile(i)} className="absolute top-1.5 right-1.5 size-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
              style={{ borderColor: "var(--color-border)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-gold-light)" }}>
                  <Upload size={16} style={{ color: "var(--color-gold-dark)" }} />
                </div>
                <p className="text-sm font-medium">+ Agregar más imágenes</p>
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>PNG, JPG, WEBP</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleNewFiles} className="hidden" />
            </div>

            {(existingImages.length === 0 && newPreviews.length === 0) && (
              <div className="flex flex-col items-center gap-2 py-4" style={{ color: "var(--color-muted-foreground)" }}>
                <ImageIcon size={24} />
                <p className="text-xs">Sin imágenes cargadas</p>
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
                { name: "pool", label: "Pileta", checked: form.pool },
                { name: "financing", label: "Financiación", checked: form.financing },
                { name: "mortgageEligible", label: "Apto crédito", checked: form.mortgageEligible },
                { name: "featured", label: "Destacada", checked: form.featured },
              ].map(({ name, label, checked }) => (
                <label key={name} className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors" style={{ borderColor: checked ? "var(--color-gold)" : "var(--color-border)", background: checked ? "var(--color-gold-light)" : "transparent" }}>
                  <input name={name} type="checkbox" checked={checked} onChange={handleChange} className="size-4 rounded" style={{ accentColor: "var(--color-gold)" }} />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/admin")} className="px-6 py-3 rounded-xl text-sm font-medium border transition" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ background: "var(--color-primary)", color: "white" }}>
              {loading ? (uploadStatus || "Guardando...") : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
