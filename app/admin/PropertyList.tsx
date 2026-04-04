"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2, X, Star, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFeatured } from "@/app/actions/featured";
import { CATEGORY_LABELS, MAX_FEATURED } from "@/app/lib/utils";

interface Property {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number | null;
  zone: string | null;
  neighborhood: string | null;
  images: string[];
  featured: boolean;
  bedrooms: number | null;
}

type SortKey   = "title" | "category" | "price" | "zone";
type SortDir   = "asc" | "desc";

// ── Delete dialog ────────────────────────────────────────────────────────────
function DeleteDialog({ title, onConfirm, onCancel, loading }: {
  title: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Eliminar propiedad</h3>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              ¿Estás seguro de eliminar <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{title}</span>? Esta acción no se puede deshacer.
            </p>
          </div>
          <button onClick={onCancel} style={{ color: "var(--color-muted-foreground)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm rounded-xl border transition disabled:opacity-50" style={{ borderColor: "var(--color-border)" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50">
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sort header button ────────────────────────────────────────────────────────
function SortHeader({ label, sortKey, current, dir, onClick }: {
  label: string; sortKey: SortKey; current: SortKey | null; dir: SortDir; onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className="flex items-center gap-1 font-medium text-left transition-colors hover:opacity-70"
      style={{ color: active ? "var(--color-gold-dark)" : "var(--color-muted-foreground)" }}
    >
      {label}
      {active
        ? dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
        : <ChevronsUpDown size={13} className="opacity-40" />
      }
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PropertyList() {
  const router = useRouter();
  const [toDelete, setToDelete]         = useState<Property | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();

  // ── Filters state ──
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [featFilter, setFeatFilter] = useState<"all" | "yes" | "no">("all");
  const [sortKey, setSortKey]     = useState<SortKey | null>(null);
  const [sortDir, setSortDir]     = useState<SortDir>("asc");

  const queryClient = useQueryClient();
  const { data: properties = [], isLoading: loadingList } = useQuery<Property[]>({
    queryKey: ["admin-properties"],
    queryFn: () => fetch("/api/properties").then((r) => {
      if (!r.ok) throw new Error("fetch failed");
      return r.json();
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) =>
      fetch(`/api/properties/${slug}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("delete failed");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      setToDelete(null);
    },
  });

  const handleDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.slug);
  };

  const handleToggleFeatured = (property: Property) => {
    setFeaturedError(null);
    startTransition(async () => {
      const result = await toggleFeatured(property.id, property.featured);
      if (result.error) {
        setFeaturedError(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      }
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const featuredCount = properties.filter((p) => p.featured).length;

  // ── Client-side filtering + sorting ──
  const filtered = properties
    .filter((p) => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !(p.zone ?? "").toLowerCase().includes(search.toLowerCase()) &&
          !(p.neighborhood ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.category !== catFilter) return false;
      if (featFilter === "yes" && !p.featured) return false;
      if (featFilter === "no"  &&  p.featured) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortKey) return 0;
      let av: string | number = "", bv: string | number = "";
      if (sortKey === "title")    { av = a.title;    bv = b.title; }
      if (sortKey === "category") { av = CATEGORY_LABELS[a.category] ?? ""; bv = CATEGORY_LABELS[b.category] ?? ""; }
      if (sortKey === "price")    { av = a.price ?? -1; bv = b.price ?? -1; }
      if (sortKey === "zone")     { av = a.zone ?? ""; bv = b.zone ?? ""; }
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "es");
      return sortDir === "asc" ? cmp : -cmp;
    });

  if (loadingList) return (
    <div className="bg-white rounded-2xl card-shadow p-12 text-center">
      <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Cargando propiedades...</p>
    </div>
  );

  if (properties.length === 0) return (
    <div className="bg-white rounded-2xl card-shadow p-12 text-center">
      <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No hay propiedades cargadas.</p>
    </div>
  );

  return (
    <>
      {toDelete && (
        <DeleteDialog title={toDelete.title} onConfirm={handleDelete} onCancel={() => setToDelete(null)} loading={deleteMutation.isPending} />
      )}

      {/* ── Barra de búsqueda y filtros ── */}
      <div className="bg-white rounded-2xl card-shadow p-4 flex flex-wrap gap-3 items-center mb-4">

        {/* Buscador */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-muted-foreground)" }} />
          <input
            type="text"
            placeholder="Buscar por título, zona, barrio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
            style={{ borderColor: "var(--color-border)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted-foreground)" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Categoría */}
        <div className="flex gap-1.5">
          {[{ v: "", l: "Todas" }, { v: "houses", l: "Casas" }, { v: "lots", l: "Terrenos" }, { v: "local", l: "Locales" }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setCatFilter(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: catFilter === v ? "var(--color-primary)" : "white",
                color: catFilter === v ? "white" : "var(--color-foreground)",
                borderColor: catFilter === v ? "var(--color-primary)" : "var(--color-border)",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Destacadas */}
        <div className="flex gap-1.5">
          {[{ v: "all", l: "Todas" }, { v: "yes", l: "⭐ Destacadas" }, { v: "no", l: "Sin destacar" }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFeatFilter(v as "all" | "yes" | "no")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: featFilter === v ? "oklch(95% 0.06 75)" : "white",
                color: featFilter === v ? "oklch(45% 0.12 75)" : "var(--color-foreground)",
                borderColor: featFilter === v ? "oklch(75% 0.1 75)" : "var(--color-border)",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Contador destacadas */}
        <div
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: featuredCount >= MAX_FEATURED ? "oklch(97% 0.05 30)" : "oklch(95% 0.06 75)",
            color: featuredCount >= MAX_FEATURED ? "oklch(48% 0.15 30)" : "oklch(50% 0.12 75)",
          }}
        >
          <Star size={12} fill="currentColor" />
          {featuredCount} / {MAX_FEATURED} destacadas
        </div>
      </div>

      {featuredError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          {featuredError}
          <button onClick={() => setFeaturedError(null)}><X size={14} /></button>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>
              <tr>
                <th className="px-4 py-3 w-14 text-left text-xs">Foto</th>
                <th className="px-4 py-3 text-left text-xs">
                  <SortHeader label="Título"    sortKey="title"    current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 text-left text-xs">
                  <SortHeader label="Categoría" sortKey="category" current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 text-left text-xs">
                  <SortHeader label="Precio"    sortKey="price"    current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 text-left text-xs">
                  <SortHeader label="Zona"      sortKey="zone"     current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  <Star size={12} className="inline mr-1" />Dest.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    No hay propiedades que coincidan con los filtros.
                  </td>
                </tr>
              ) : filtered.map((p) => {
                const canMark = p.featured || featuredCount < MAX_FEATURED;
                return (
                  <tr key={p.id} className="border-t transition-colors hover:bg-[var(--color-muted)]" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-4 py-3">
                      {p.images.length > 0 ? (
                        <Image src={p.images[0]} alt={p.title} width={48} height={48} className="size-12 object-cover rounded-xl" quality={60} />
                      ) : (
                        <div className="size-12 rounded-xl flex items-center justify-center text-xs" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}>—</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-xs">
                      <span className="line-clamp-2">{p.title}</span>
                      {p.neighborhood && (
                        <span className="text-xs block mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{p.neighborhood}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--color-muted)" }}>
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                      {p.price
                        ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(p.price)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--color-muted-foreground)" }}>{p.zone ?? "—"}</td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        disabled={isPending || !canMark}
                        title={!canMark ? `Límite de ${MAX_FEATURED} alcanzado` : p.featured ? "Quitar destacada" : "Marcar como destacada"}
                        className="inline-flex items-center justify-center size-8 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: p.featured ? "oklch(90% 0.08 75)" : "oklch(96% 0.004 260)",
                          color: p.featured ? "oklch(50% 0.12 75)" : "oklch(65% 0.01 260)",
                        }}
                      >
                        <Star size={14} fill={p.featured ? "currentColor" : "none"} />
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/properties/${p.slug}/edit`)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                        >
                          <Pencil size={11} /> Editar
                        </button>
                        <button
                          onClick={() => setToDelete(p)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 size={11} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer con contador */}
        <div className="px-4 py-3 border-t text-xs flex items-center justify-between" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
          <span>
            {filtered.length === properties.length
              ? `${properties.length} propiedades`
              : `${filtered.length} de ${properties.length} propiedades`}
          </span>
          {(search || catFilter || featFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setCatFilter(""); setFeatFilter("all"); }}
              className="flex items-center gap-1 hover:opacity-70 transition"
            >
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </>
  );
}
