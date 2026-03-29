import Image from "next/image";
import Link from "next/link";
import { BedDouble, Ruler, Trees, MapPin, Home } from "lucide-react";
import { formatPrice, CATEGORY_LABELS } from "@/app/lib/utils";

export interface PropertyCardData {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  images: string[];
  neighborhood: string | null;
  zone: string | null;
  bedrooms: number | null;
  coveredArea: number | null;
  lotArea?: number | null;
  featured?: boolean;
  category: string;
  pool?: boolean;
  financing?: boolean;
  mortgageEligible?: boolean;
}

interface Props {
  property: PropertyCardData;
  /** Show extra stats (lotArea) and feature tags. Default: false */
  detailed?: boolean;
}

export default function PropertyCard({ property, detailed = false }: Props) {
  const price = formatPrice(property.price);
  const location = [property.neighborhood, property.zone].filter(Boolean).join(" · ");
  const hasFeatures = detailed && (property.pool || property.financing || property.mortgageEligible);

  return (
    <Link
      href={`/propiedades/${property.slug}`}
      className="group bg-white rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 flex flex-col"
    >
      <div className="relative h-52 overflow-hidden img-skeleton">
        {property.images[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={75}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--color-muted-foreground)" }}>
            <Home size={32} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.featured && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-gold)", color: "white" }}>
              Destacada
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              property.featured && !detailed ? "" : "bg-black/60 text-white backdrop-blur-sm"
            }`}
            style={property.featured && !detailed ? { background: "var(--color-gold)", color: "white" } : undefined}
          >
            {CATEGORY_LABELS[property.category] ?? property.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-display text-base font-semibold leading-snug line-clamp-2 group-hover:text-[--color-gold-dark] transition-colors">
            {property.title}
          </h3>
          {location && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
              <MapPin size={11} />{location}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble size={12} style={{ color: "var(--color-gold)" }} />
              {property.bedrooms} dorm.
            </span>
          )}
          {property.coveredArea != null && (
            <span className="flex items-center gap-1">
              <Ruler size={12} style={{ color: "var(--color-gold)" }} />
              {property.coveredArea} m²{detailed ? " cub." : ""}
            </span>
          )}
          {detailed && property.lotArea != null && (
            <span className="flex items-center gap-1">
              <Trees size={12} style={{ color: "var(--color-gold)" }} />
              {property.lotArea} m² lote
            </span>
          )}
        </div>

        {hasFeatures && (
          <div className="flex flex-wrap gap-1.5">
            {property.pool && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">Pileta</span>}
            {property.financing && <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">Financiación</span>}
            {property.mortgageEligible && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">Apto crédito</span>}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-[--color-border]">
          {price
            ? <p className="font-display text-xl font-bold">{price}</p>
            : <p className="text-sm italic" style={{ color: "var(--color-muted-foreground)" }}>Consultar precio</p>
          }
        </div>
      </div>
    </Link>
  );
}
