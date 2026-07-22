// Contenido de las páginas de zona (GEO / SEO local).
// Los precios de propiedades se calcularon sobre el catálogo real publicado
// en ggpropiedades.com/propiedades (julio 2026), filtrado por zona y categoría.
import type { Metadata } from "next";

export const BASE_URL = "https://ggpropiedades.com";

export type ZoneKey = "pilar" | "escobar" | "zona-norte";

export interface ZoneFaq {
  question: string;
  answer: string;
}

export interface ZoneBarrio {
  name: string;
  blurb: string;
}

export interface ZoneContent {
  slug: string;
  /** Valor para getPropertyList({ zone }); null => usa destacadas del home */
  zoneFilter: string | null;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  tagline: string;
  intro: string[];
  barriosTitle: string;
  barrios: ZoneBarrio[];
  pricingTitle: string;
  pricingUpdated: string;
  pricingRows: { label: string; value: string }[];
  pricingNote: string;
  faqs: ZoneFaq[];
  related: { label: string; href: string }[];
}

export const ZONE_CONTENT: Record<ZoneKey, ZoneContent> = {
  pilar: {
    slug: "inmobiliaria-en-pilar",
    zoneFilter: "Pilar",
    name: "Pilar",
    metaTitle: "Inmobiliaria en Pilar | Casas y terrenos en barrios cerrados",
    metaDescription:
      "Inmobiliaria en Pilar especializada en barrios cerrados y countrys. Casas, terrenos y locales en venta en La Lonja, km 50 de Panamericana y alrededores. Tasación gratuita.",
    h1: "Inmobiliaria en Pilar",
    tagline: "Especialistas en barrios cerrados",
    intro: [
      "GG Propiedades es una inmobiliaria de Pilar con oficina en el km 49,5 de la Panamericana (Edificio Concord Rubí, La Lonja). Trabajamos todos los días en los barrios cerrados y countrys del corredor Pilar: conocemos los reglamentos internos, las expensas reales y los valores a los que efectivamente se cierran las operaciones.",
      "Nos especializamos en compra y venta de casas, terrenos y locales comerciales en barrios cerrados de Pilar y su zona de influencia. Hacemos tasaciones gratuitas y acompañamos todo el proceso: desde la primera visita hasta la escritura.",
    ],
    barriosTitle: "Barrios cerrados y countrys de Pilar",
    barrios: [
      {
        name: "La Lonja y km 50",
        blurb:
          "El corazón del corredor Pilar: barrios consolidados a minutos de la Panamericana, con colegios, comercios y servicios cerca.",
      },
      {
        name: "Ayres de Pilar",
        blurb:
          "Complejo de barrios privados con seguridad central, muy demandado por familias por su ubicación sobre Panamericana.",
      },
      {
        name: "Estancias del Pilar",
        blurb:
          "Emprendimiento de gran escala con barrios internos, colegio y club house; lotes amplios y entorno parquizado.",
      },
      {
        name: "Pilar del Este",
        blurb:
          "Conjunto de barrios con buena relación precio-calidad, popular para primera casa en barrio cerrado.",
      },
      {
        name: "Pilará",
        blurb:
          "Chacras y lotes de gran superficie con polo, golf y entorno de campo, a pocos minutos del centro de Pilar.",
      },
      {
        name: "San Sebastián",
        blurb:
          "Mega-emprendimiento sobre Ruta 25 entre Pilar y Escobar, con áreas ecuestres y náuticas y lotes desde superficies medias.",
      },
      {
        name: "La Cañada de Pilar",
        blurb:
          "Zona de barrios más nuevos al norte del partido, con lotes accesibles y construcción en crecimiento.",
      },
    ],
    pricingTitle: "Precios orientativos en Pilar",
    pricingUpdated: "julio 2026, según publicaciones activas en nuestro catálogo",
    pricingRows: [
      {
        label: "Casa en barrio cerrado (3 dorm.)",
        value: "entre USD 170.000 y USD 359.000",
      },
      {
        label: "Lote en barrio cerrado",
        value: "entre USD 45.000 y USD 85.000",
      },
      {
        label: "Expensas de country o barrio cerrado",
        value: "varían mucho según el barrio y sus servicios — consultanos por el valor exacto",
      },
    ],
    pricingNote:
      "Rangos calculados sobre nuestras propiedades publicadas en Pilar en julio 2026. Varían según barrio, superficie y estado de la propiedad. Pedinos una tasación gratuita para conocer el valor real de tu propiedad hoy.",
    faqs: [
      {
        question: "¿Cuánto cuesta una casa en un barrio cerrado de Pilar?",
        answer:
          "Según nuestro catálogo actual, una casa de 3 dormitorios en un barrio cerrado de Pilar arranca en torno a USD 170.000 en barrios de primera vivienda y supera USD 350.000 en countrys consolidados. Los lotes para construir arrancan alrededor de USD 45.000.",
      },
      {
        question: "¿Qué expensas tiene un country o barrio cerrado en Pilar?",
        answer:
          "Las expensas varían mucho según los servicios del barrio (seguridad, deportes, club house), por eso no publicamos un monto único. Antes de comprar te detallamos la expensa exacta y qué incluye en cada barrio que te interese.",
      },
      {
        question: "¿Qué barrios cerrados de Pilar conviene mirar primero?",
        answer:
          "Para primera casa con presupuesto acotado suelen convenir Pilar del Este, La Cañada de Pilar o los sectores nuevos de San Sebastián. Para lotes amplios y entorno de campo, Pilará o Estancias del Pilar. Para máxima conectividad con Panamericana, Ayres de Pilar y los barrios de La Lonja/km 50.",
      },
      {
        question: "¿Se puede comprar un lote y financiar la construcción?",
        answer:
          "Sí. Varias de nuestras propiedades y lotes admiten financiación directa o son aptos crédito hipotecario; están señalizados en el catálogo con las etiquetas \"Financiación\" y \"Apto crédito\". Consultanos por opciones vigentes en cada barrio.",
      },
      {
        question: "¿A cuánto está Pilar de la Ciudad de Buenos Aires?",
        answer:
          "El centro del corredor (km 50 de Panamericana) está a unos 50 km de la Ciudad de Buenos Aires: entre 45 minutos y una hora en auto por Panamericana ramal Pilar según el horario.",
      },
      {
        question: "¿Hacen tasaciones en Pilar? ¿Cuánto cuesta?",
        answer:
          "Sí, hacemos tasaciones gratuitas y sin compromiso en Pilar y alrededores. Visitamos la propiedad, la comparamos con operaciones reales de la zona y te damos un valor de publicación y un valor esperable de cierre.",
      },
    ],
    related: [
      { label: "Inmobiliaria en Escobar", href: "/inmobiliaria-en-escobar" },
      {
        label: "Inmobiliaria en Zona Norte",
        href: "/inmobiliaria-zona-norte",
      },
    ],
  },

  escobar: {
    slug: "inmobiliaria-en-escobar",
    zoneFilter: "Escobar",
    name: "Escobar",
    metaTitle:
      "Inmobiliaria en Escobar | Casas y terrenos en barrios cerrados",
    metaDescription:
      "Inmobiliaria en Escobar y Maschwitz especializada en barrios cerrados. Casas, terrenos y locales en venta en Puertos, El Cantón, San Sebastián y más. Tasación gratuita.",
    h1: "Inmobiliaria en Escobar",
    tagline: "Barrios cerrados de Escobar y Maschwitz",
    intro: [
      "Trabajamos los barrios cerrados y countrys del partido de Escobar: el corredor de Panamericana ramal Escobar, Ingeniero Maschwitz y los grandes emprendimientos sobre Ruta 25 y Ruta 26. Nuestra oficina está en el km 49,5 de Panamericana, a minutos del acceso a Escobar.",
      "Escobar combina naturaleza, buenos accesos y valores todavía más accesibles que otros corredores de Zona Norte, por lo que es una de las zonas de mayor crecimiento del GBA para mudarse a un barrio cerrado. Hacemos tasaciones gratuitas en todo el partido.",
    ],
    barriosTitle: "Barrios cerrados y countrys de Escobar",
    barrios: [
      {
        name: "Puertos",
        blurb:
          "El mega-emprendimiento del lago en Escobar: barrios internos, bioparque, colegios y centro comercial propio, sobre Ruta 25.",
      },
      {
        name: "El Cantón",
        blurb:
          "Barrio náutico consolidado en Maschwitz con amarras, club house y casas sobre el agua.",
      },
      {
        name: "San Sebastián",
        blurb:
          "Sobre Ruta 25 entre Escobar y Pilar: áreas con perfil ecuestre y náutico, lotes de superficies variadas y fuerte ritmo de construcción.",
      },
      {
        name: "El Cazador",
        blurb:
          "Zona residencial arbolada y tranquila de Escobar, con barrios cerrados chicos y lotes amplios cerca del río Luján.",
      },
      {
        name: "Maschwitz y su corredor",
        blurb:
          "Ingeniero Maschwitz concentra barrios cerrados de escala barrial, polo gastronómico y acceso directo por Panamericana.",
      },
      {
        name: "Loma Verde",
        blurb:
          "Sector de quintas y barrios en crecimiento al norte de Escobar, con valores de entrada más accesibles.",
      },
    ],
    pricingTitle: "Precios orientativos en Escobar",
    pricingUpdated: "julio 2026, según publicaciones activas en nuestro catálogo",
    pricingRows: [
      {
        label: "Casa en barrio cerrado (3 dorm.)",
        value: "entre USD 120.000 y USD 485.000",
      },
      {
        label: "Lote en barrio cerrado",
        value: "entre USD 25.000 y USD 226.000",
      },
      {
        label: "Expensas típicas",
        value: "varían mucho según el barrio y sus servicios — consultanos por el valor exacto",
      },
    ],
    pricingNote:
      "Rangos calculados sobre nuestras propiedades publicadas en Escobar en julio 2026. Varían según barrio, superficie y estado. Pedinos una tasación gratuita para conocer el valor real de tu propiedad.",
    faqs: [
      {
        question: "¿Cuánto cuesta una casa en un barrio cerrado de Escobar?",
        answer:
          "Según nuestro catálogo actual, una casa de 3 dormitorios en barrio cerrado de Escobar o Maschwitz suele ubicarse entre USD 120.000 y USD 485.000 según barrio y superficie. Los lotes para construir arrancan alrededor de USD 25.000, con opciones de mayor superficie que superan los USD 200.000.",
      },
      {
        question: "¿Qué es Puertos y por qué se habla tanto de esa zona?",
        answer:
          "Puertos es el emprendimiento de mayor escala de Escobar: una ciudad-pueblo sobre un lago central con barrios internos, colegios, bioparque y comercios propios. Es una de las zonas con más obras y demanda del corredor, tanto para vivir como para invertir en lotes.",
      },
      {
        question: "¿Conviene Escobar o Pilar para mudarse a un barrio cerrado?",
        answer:
          "Depende de prioridades. Escobar suele ofrecer valores de entrada más bajos y entornos más nuevos; Pilar tiene más oferta consolidada, colegios y servicios maduros. Trabajamos ambos corredores, así que podemos mostrarte opciones comparables en los dos y que decidas viendo.",
      },
      {
        question: "¿Hay opciones con financiación o aptas crédito en Escobar?",
        answer:
          "Sí. Parte de nuestro catálogo en Escobar admite financiación directa del vendedor o es apto crédito hipotecario; están señalizados con etiquetas en cada ficha. Consultanos por las opciones vigentes.",
      },
      {
        question: "¿A cuánto está Escobar de la Ciudad de Buenos Aires?",
        answer:
          "Belén de Escobar está a unos 50 km de la Ciudad de Buenos Aires por Panamericana ramal Escobar: entre 45 minutos y una hora en auto según el horario. Maschwitz queda unos 10 km más cerca.",
      },
      {
        question: "¿Hacen tasaciones en Escobar?",
        answer:
          "Sí, tasamos gratis casas, lotes y locales en todo el partido de Escobar, incluyendo Maschwitz, El Cazador, Loma Verde y los barrios de Ruta 25. La tasación incluye valor de publicación sugerido y valor esperable de cierre.",
      },
    ],
    related: [
      { label: "Inmobiliaria en Pilar", href: "/inmobiliaria-en-pilar" },
      {
        label: "Inmobiliaria en Zona Norte",
        href: "/inmobiliaria-zona-norte",
      },
    ],
  },

  "zona-norte": {
    slug: "inmobiliaria-zona-norte",
    zoneFilter: null,
    name: "Zona Norte",
    metaTitle:
      "Inmobiliaria en Zona Norte de Buenos Aires | Barrios cerrados GBA",
    metaDescription:
      "Inmobiliaria en la Zona Norte del Gran Buenos Aires, especializada en barrios cerrados del corredor Pilar–Escobar. Casas, terrenos y locales. Tasación gratuita.",
    h1: "Inmobiliaria en Zona Norte de Buenos Aires",
    tagline: "Corredor Pilar – Escobar del GBA Norte",
    intro: [
      "La Zona Norte del Gran Buenos Aires concentra la mayor oferta de barrios cerrados y countrys de la Argentina. GG Propiedades se especializa en el tramo de mayor crecimiento de ese mercado: el corredor de Panamericana entre Pilar y Escobar, del km 40 al km 60.",
      "A diferencia de las inmobiliarias generalistas de Capital, trabajamos únicamente esta zona: la recorremos todos los días, conocemos cada barrio por dentro y sabemos a qué valores se están cerrando las operaciones. Nuestra oficina está en el km 49,5 de Panamericana, en Pilar.",
      "Si estás pensando en mudarte de la ciudad a un barrio cerrado, o en invertir en lotes en la zona con más obras del GBA, empezá por nuestras guías de cada partido.",
    ],
    barriosTitle: "Las dos zonas que trabajamos",
    barrios: [
      {
        name: "Pilar",
        blurb:
          "El mercado de barrios cerrados más grande y consolidado del país: desde countrys clásicos hasta barrios nuevos de primera vivienda. Ver la guía completa en /inmobiliaria-en-pilar.",
      },
      {
        name: "Escobar",
        blurb:
          "El corredor de mayor crecimiento: Puertos, Maschwitz y los emprendimientos de Ruta 25, con valores de entrada más accesibles. Ver la guía completa en /inmobiliaria-en-escobar.",
      },
    ],
    pricingTitle: "Precios orientativos en el corredor Pilar–Escobar",
    pricingUpdated: "julio 2026, según publicaciones activas en nuestro catálogo",
    pricingRows: [
      {
        label: "Casa en barrio cerrado (3 dorm.)",
        value: "entre USD 120.000 y USD 485.000",
      },
      {
        label: "Lote en barrio cerrado",
        value: "entre USD 25.000 y USD 226.000",
      },
    ],
    pricingNote:
      "Rangos calculados sobre nuestro catálogo publicado en Pilar y Escobar en julio 2026 y varían según partido y barrio: en las guías de Pilar y Escobar hay rangos más precisos por zona. Tasamos gratis tu propiedad con valores reales de cierre.",
    faqs: [
      {
        question:
          "¿Qué zona del GBA Norte conviene para mudarse a un barrio cerrado?",
        answer:
          "Para la mayoría de las familias que buscan naturaleza y buen acceso a la ciudad, el corredor Pilar–Escobar ofrece la mejor relación entre precio, oferta y servicios: tiene la mayor cantidad de barrios cerrados del país y valores más accesibles que corredores como Nordelta o San Isidro.",
      },
      {
        question:
          "¿Cuánto cuesta entrar a un barrio cerrado en Zona Norte?",
        answer:
          "En el corredor Pilar–Escobar, según nuestro catálogo actual, los lotes arrancan alrededor de USD 25.000 y las casas de 3 dormitorios desde USD 120.000. En corredores más cercanos a Capital los valores de entrada son bastante más altos.",
      },
      {
        question: "¿Trabajan con compradores del exterior o de Capital?",
        answer:
          "Sí, gran parte de nuestros clientes viene de la Ciudad de Buenos Aires buscando mudarse a un barrio cerrado, y también asistimos a argentinos en el exterior que compran a distancia: coordinamos visitas por videollamada y todo el proceso de reserva y escritura.",
      },
      {
        question: "¿Cómo sé cuánto vale mi propiedad en Zona Norte?",
        answer:
          "Pedinos una tasación gratuita: comparamos tu propiedad con operaciones reales cerradas en tu barrio (no con precios de publicación, que suelen estar inflados) y te damos un valor de publicación y un rango esperable de cierre.",
      },
    ],
    related: [
      { label: "Inmobiliaria en Pilar", href: "/inmobiliaria-en-pilar" },
      { label: "Inmobiliaria en Escobar", href: "/inmobiliaria-en-escobar" },
    ],
  },
};

export function zoneMetadata(key: ZoneKey): Metadata {
  const zone = ZONE_CONTENT[key];
  const url = `${BASE_URL}/${zone.slug}`;
  return {
    title: { absolute: zone.metaTitle },
    description: zone.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      siteName: "GG Propiedades",
      title: zone.metaTitle,
      description: zone.metaDescription,
      images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: zone.h1 }],
    },
  };
}
