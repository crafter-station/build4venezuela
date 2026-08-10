import type { Metadata } from "next";
import { CountryHub } from "@/components/country-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Venezuela | Build4Latam",
  description:
    "Herramientas, proyectos y recursos abiertos construidos para ayudar a Venezuela.",
};

export default function VenezuelaPage() {
  return <CountryHub country="venezuela" />;
}
