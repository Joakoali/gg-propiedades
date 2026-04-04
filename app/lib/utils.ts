export function formatPrice(price: number | null | undefined): string | null {
  if (!price) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export const CATEGORY_LABELS: Record<string, string> = {
  houses: "Casa",
  lots:   "Terreno",
  local:  "Local",
};

export const MAX_FEATURED = 9;


export const ZONES = [
  "Pilar",
  "Escobar",
  "Cardales",
  "Exaltación de la Cruz",
];

// Mapeo zona → valores en DB (La Cañada=Pilar, Campana=Cardales)
export const ZONE_FILTER_MAP: Record<string, string[]> = {
  "Pilar":                 ["Pilar", "La Cañada"],
  "Escobar":               ["Escobar"],
  "Cardales":              ["Cardales", "Campana"],
  "Exaltación de la Cruz": ["Exaltación de la Cruz"],
};

// Barrios entre zonas (San Sebastián aparece en Pilar y Escobar)
export const CROSS_ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "Pilar":   ["San Sebastián"],
  "Escobar": ["San Sebastián"],
};
