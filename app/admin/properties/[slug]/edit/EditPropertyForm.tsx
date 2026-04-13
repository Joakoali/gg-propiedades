"use client";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ZONES } from "@/app/lib/utils";
import { compressImages, uploadWithPresignedUrls } from "@/app/lib/image-utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  featuredOrder: number | null;
}

type ExistingItem = { type: "existing"; id: string; url: string };
type NewItem = { type: "new"; id: string; file: File; preview: string };
type DisplayItem = ExistingItem | NewItem;

function SortablePhoto({
  item,
  isFirst,
  onRemove,
  onMoveLeft,
  onMoveRight,
  showLeft,
  showRight,
}: {
  item: DisplayItem;
  isFirst: boolean;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  showLeft: boolean;
  showRight: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const src = item.type === "existing" ? item.url : item.preview;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-xl overflow-hidden touch-none select-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-24 object-cover" />

      {/* Drag handle overlay (desktop) */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing hidden sm:block"
      />

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 size-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
      >
        <X size={12} />
      </button>

      {/* Principal badge */}
      {isFirst && (
        <span
          className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 pointer-events-none"
          style={{ background: "var(--color-gold)", color: "white" }}
        >
          Principal
        </span>
      )}

      {/* New badge */}
      {item.type === "new" && (
        <span
          className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 pointer-events-none"
          style={{ background: "oklch(60% 0.15 145)", color: "white" }}
        >
          Nueva
        </span>
      )}

      {/* Mobile move buttons */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-1 sm:hidden z-10">
        {showLeft && (
          <button
            type="button"
            onClick={onMoveLeft}
            className="size-5 rounded flex items-center justify-center text-white"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <ChevronLeft size={10} />
          </button>
        )}
        {showRight && (
          <button
            type="button"
            onClick={onMoveRight}
            className="size-5 rounded flex items-center justify-center text-white"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <ChevronRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function EditPropertyForm({ property }: { property: Property }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");

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
      setLoading(false);
      router.push("/admin");
    },
    onError: () => {
      setError("Hubo un error al guardar los cambios");
      setLoading(false);
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayItems, setDisplayItems] = useState<DisplayItem[]>(
    property.images.map((url, i) => ({
      type: "existing" as const,
      id: `existing-${i}-${url.slice(-8)}`,
      url,
    })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDisplayItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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
    featuredOrder: property.featuredOrder?.toString() ?? "",
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

  const removeItem = (id: string) => {
    const item = displayItems.find((i) => i.id === id);
    if (item?.type === "new") URL.revokeObjectURL(item.preview);
    setDisplayItems((prev) => prev.filter((i) => i.id !== id));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newItems: NewItem[] = files.map((file) => ({
      type: "new" as const,
      id: `new-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setDisplayItems((prev) => [...prev, ...newItems]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUploadStatus("");

    // Upload new files in display order
    const newItems = displayItems.filter((i): i is NewItem => i.type === "new");
    let uploadedUrls: string[] = [];
    if (newItems.length > 0) {
      setUploadStatus("Comprimiendo imágenes...");
      let compressed: File[];
      try {
        compressed = await compressImages(
          newItems.map((i) => i.file),
          (done, total) => { setUploadStatus(`Comprimiendo ${done}/${total}...`); },
        );
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

    // Assemble final images in display order
    let newUrlIndex = 0;
    const finalImages = displayItems
      .map((item) => {
        if (item.type === "existing") return item.url;
        return uploadedUrls[newUrlIndex++] ?? null;
      })
      .filter(Boolean) as string[];

    setUploadStatus("Guardando...");
    saveMutation.mutate({
      ...form,
      featuredOrder: form.featured && form.featuredOrder !== ""
        ? parseInt(form.featuredOrder, 10)
        : null,
      images: finalImages,
    });
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
              Imágenes{displayItems.length > 0 && (
                <span className="text-sm font-normal ml-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                  ({displayItems.length})
                </span>
              )}
            </h2>

            {displayItems.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayItems.map((i) => i.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {displayItems.map((item, index) => (
                      <SortablePhoto
                        key={item.id}
                        item={item}
                        isFirst={index === 0}
                        onRemove={() => removeItem(item.id)}
                        onMoveLeft={() =>
                          setDisplayItems((items) => arrayMove(items, index, index - 1))
                        }
                        onMoveRight={() =>
                          setDisplayItems((items) => arrayMove(items, index, index + 1))
                        }
                        showLeft={index > 0}
                        showRight={index < displayItems.length - 1}
                      />
                    ))}
                    <div
                      className="border-2 border-dashed rounded-xl h-24 flex items-center justify-center cursor-pointer transition-colors"
                      style={{ borderColor: "var(--color-border)" }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={20} style={{ color: "var(--color-muted-foreground)" }} />
                    </div>
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4" style={{ color: "var(--color-muted-foreground)" }}>
                <ImageIcon size={24} />
                <p className="text-xs">Sin imágenes cargadas</p>
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
            {form.featured && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="featuredOrder" className={labelClass} style={{ color: "var(--color-muted-foreground)" }}>
                  Posición en hero (1–9)
                </label>
                <input
                  id="featuredOrder"
                  name="featuredOrder"
                  type="number"
                  min={1}
                  max={9}
                  placeholder="Ej: 1"
                  value={form.featuredOrder}
                  onChange={handleChange}
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
            )}
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
