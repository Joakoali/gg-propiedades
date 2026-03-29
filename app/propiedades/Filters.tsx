"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

const CATEGORIES = [
  { value: "",       label: "Todas" },
  { value: "houses", label: "Casas" },
  { value: "lots",   label: "Terrenos" },
  { value: "local",  label: "Locales" },
];

const SORT_OPTIONS = [
  { value: "",           label: "Más recientes" },
  { value: "price_asc",  label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "bedrooms",   label: "Más dormitorios" },
];

const BEDROOMS_OPTIONS = [
  { value: "",  label: "Cualquiera" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

interface FiltersProps {
  zones: string[];
  currentCategory: string;
  currentZone: string;
}

export default function Filters({ zones, currentCategory, currentZone }: FiltersProps) {
  const router     = useRouter();
  const pathname   = usePathname();
  const sp         = useSearchParams();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  // Leer estado actual de todos los params
  const current = {
    q:                sp.get("q") ?? "",
    category:         currentCategory,
    zone:             currentZone,
    minPrice:         sp.get("minPrice") ?? "",
    maxPrice:         sp.get("maxPrice") ?? "",
    minBedrooms:      sp.get("minBedrooms") ?? "",
    pool:             sp.get("pool") === "1",
    financing:        sp.get("financing") === "1",
    mortgageEligible: sp.get("mortgageEligible") === "1",
    sort:             sp.get("sort") ?? "",
  };

  const [q, setQ] = useState(current.q);

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else   params.delete(k);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function toggle(key: string, active: boolean) {
    push({ [key]: active ? "" : "1" });
  }

  function clearAll() {
    setQ("");
    startTransition(() => router.push(pathname));
  }

  const hasFilters = current.q || current.category || current.zone ||
    current.minPrice || current.maxPrice || current.minBedrooms ||
    current.pool || current.financing || current.mortgageEligible || current.sort;

  const inputClass = "w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition";
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div className="bg-white rounded-2xl card-shadow p-5 flex flex-col gap-4">

      {/* ── Fila 1: buscador + limpiar ── */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-muted-foreground)" }} />
          <input
            type="text"
            placeholder="Buscar por título, barrio..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && push({ q })}
            onBlur={() => q !== current.q && push({ q })}
            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition"
            style={{ borderColor: "var(--color-border)" }}
          />
          {q && (
            <button
              onClick={() => { setQ(""); push({ q: "" }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition"
          style={{
            borderColor: expanded ? "var(--color-gold)" : "var(--color-border)",
            color: expanded ? "var(--color-gold-dark)" : "var(--color-foreground)",
            background: expanded ? "var(--color-gold-light)" : "white",
          }}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {hasFilters && !expanded && (
            <span className="size-2 rounded-full" style={{ background: "var(--color-gold)" }} />
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* ── Fila 2: categorías pills ── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = current.category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => push({ category: cat.value })}
              className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
              style={{
                background: active ? "var(--color-primary)" : "white",
                color: active ? "white" : "var(--color-foreground)",
                borderColor: active ? "var(--color-primary)" : "var(--color-border)",
              }}
            >
              {cat.label}
            </button>
          );
        })}

        {/* Zona inline */}
        <div className="relative ml-auto">
          <select
            value={current.zone}
            onChange={(e) => push({ zone: e.target.value })}
            className={`${selectClass} pr-8 min-w-[160px]`}
            style={{ borderColor: current.zone ? "var(--color-gold)" : "var(--color-border)" }}
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-muted-foreground)" }} />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={current.sort}
            onChange={(e) => push({ sort: e.target.value })}
            className={`${selectClass} pr-8 min-w-[150px]`}
            style={{ borderColor: current.sort ? "var(--color-gold)" : "var(--color-border)" }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-muted-foreground)" }} />
        </div>
      </div>

      {/* ── Filtros avanzados (expandibles) ── */}
      {expanded && (
        <div className="border-t pt-4 flex flex-col gap-4" style={{ borderColor: "var(--color-border)" }}>

          {/* Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
                Precio mínimo (USD)
              </label>
              <input
                type="number"
                placeholder="0"
                defaultValue={current.minPrice}
                onBlur={(e) => push({ minPrice: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && push({ minPrice: (e.target as HTMLInputElement).value })}
                className={inputClass}
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
                Precio máximo (USD)
              </label>
              <input
                type="number"
                placeholder="Sin límite"
                defaultValue={current.maxPrice}
                onBlur={(e) => push({ maxPrice: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && push({ maxPrice: (e.target as HTMLInputElement).value })}
                className={inputClass}
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
          </div>

          {/* Dormitorios */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
              Dormitorios mínimos
            </label>
            <div className="flex gap-2 flex-wrap">
              {BEDROOMS_OPTIONS.map((opt) => {
                const active = current.minBedrooms === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => push({ minBedrooms: opt.value })}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={{
                      background: active ? "var(--color-primary)" : "white",
                      color: active ? "white" : "var(--color-foreground)",
                      borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Características */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>
              Características
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "pool",             label: "🏊 Pileta" },
                { key: "financing",        label: "💰 Financiación" },
                { key: "mortgageEligible", label: "🏦 Apto crédito" },
              ].map(({ key, label }) => {
                const active = current[key as keyof typeof current] as boolean;
                return (
                  <button
                    key={key}
                    onClick={() => toggle(key, active)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={{
                      background: active ? "var(--color-gold-light)" : "white",
                      color: active ? "var(--color-gold-dark)" : "var(--color-foreground)",
                      borderColor: active ? "var(--color-gold)" : "var(--color-border)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
