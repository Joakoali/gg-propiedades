export const revalidate = 3600;

import type { Metadata } from "next";
import ZoneLanding from "@/app/components/ZoneLanding";
import { zoneMetadata } from "@/app/lib/zone-content";

export const metadata: Metadata = zoneMetadata("zona-norte");

export default function InmobiliariaZonaNortePage() {
  return <ZoneLanding zoneKey="zona-norte" />;
}
