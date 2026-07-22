export const revalidate = 3600;

import type { Metadata } from "next";
import ZoneLanding from "@/app/components/ZoneLanding";
import { zoneMetadata } from "@/app/lib/zone-content";

export const metadata: Metadata = zoneMetadata("pilar");

export default function InmobiliariaEnPilarPage() {
  return <ZoneLanding zoneKey="pilar" />;
}
