import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Providers from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const BASE_URL = "https://ggpropiedades.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "GG Propiedades | Casas, Terrenos y Locales en Zona Norte GBA",
    template: "%s | GG Propiedades",
  },
  description:
    "Inmobiliaria especializada en barrios cerrados y countrys de Zona Norte del GBA. Casas, terrenos y locales en Pilar, Escobar y alrededores. Tasación gratuita.",
  keywords: [
    "inmobiliaria",
    "propiedades",
    "Pilar",
    "Escobar",
    "Zona Norte",
    "GBA",
    "casas",
    "terrenos",
    "locales",
    "barrios cerrados",
    "countrys",
    "venta de casas",
    "terrenos en Pilar",
    "inmobiliaria Zona Norte",
  ],
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: BASE_URL,
    siteName: "GG Propiedades",
    title: "GG Propiedades | Inmobiliaria en Zona Norte GBA",
    description:
      "Casas, terrenos y locales en barrios cerrados de Pilar, Escobar y alrededores. Tasación gratuita.",
    images: [
      { url: "/hero.jpg", width: 1200, height: 630, alt: "GG Propiedades" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GG Propiedades | Inmobiliaria en Zona Norte GBA",
    description:
      "Casas, terrenos y locales en barrios cerrados de Pilar, Escobar y alrededores.",
    images: ["/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Cuando tengas Google Search Console, agregar: google: "tu-código-verificación"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "GG Propiedades",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Inmobiliaria especializada en barrios cerrados y countrys de Zona Norte del GBA.",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: -34.46,
        longitude: -58.91,
      },
      geoRadius: "30000",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pilar",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@ggpropiedades.com",
      contactType: "sales",
      availableLanguage: "Spanish",
    },
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {/* Conexión anticipada al CDN de imágenes (Cloudflare R2).
            dns-prefetch resuelve el DNS, preconnect abre el TCP+TLS.
            Juntos eliminan ~200-500ms de latencia en la primera imagen. */}
        <link
          rel="dns-prefetch"
          href="https://pub-bd2ec60177e8464ab87d64b45deb3958.r2.dev"
        />
        <link
          rel="preconnect"
          href="https://pub-bd2ec60177e8464ab87d64b45deb3958.r2.dev"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${playfair.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
