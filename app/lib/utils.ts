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

// ── Zonas de cobertura (display) ──
export const ZONES = [
  "Pilar",
  "Escobar",
  "Cardales",
  "Exaltación de la Cruz",
];

// ── Mapeo zona display → valores reales en la DB ──
// San Sebastián aparece tanto en Pilar como en Escobar.
// La Cañada pertenece a Pilar. Campana pertenece a Cardales.
export const ZONE_FILTER_MAP: Record<string, string[]> = {
  "Pilar":                 ["Pilar", "La Cañada", "San Sebastián"],
  "Escobar":               ["Escobar", "San Sebastián"],
  "Cardales":              ["Cardales", "Campana"],
  "Exaltación de la Cruz": ["Exaltación de la Cruz"],
};

// ── Barrios que cruzan zonas: se muestran en ambas zonas ──
// San Sebastián está entre Pilar y Escobar; al filtrar cualquiera de las dos
// se incluyen todas las propiedades cuyo neighborhood contenga "San Sebastián".
export const CROSS_ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "Pilar":   ["San Sebastián"],
  "Escobar": ["San Sebastián"],
};
