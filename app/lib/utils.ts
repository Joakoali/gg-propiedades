// ── cn: merge class names (inline, no clsx/tailwind-merge needed) ──
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── formatPrice ──
export function formatPrice(price: number | null | undefined): string | null {
  if (!price) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

// ── Category labels ──
export const CATEGORY_LABELS: Record<string, string> = {
  houses: "Casa",
  lots:   "Terreno",
  local:  "Local",
};

export const CATEGORY_LABELS_PLURAL: Record<string, string> = {
  houses: "Casas",
  lots:   "Terrenos",
  local:  "Locales",
};

// ── Max featured properties ──
export const MAX_FEATURED = 9;

// ── Zonas de cobertura ──
export const ZONES = [
  "Pilar",
  "Escobar",
  "San Sebastián",
  "La Cañada",
  "Cardales",
  "Campana",
  "Exaltación de la Cruz",
];
