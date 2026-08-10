import type { Metadata } from "next";
import { CountryHub } from "@/components/country-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Colombia | Build4Latam",
  description:
    "Herramientas, proyectos y recursos abiertos que pueden ayudar a Colombia.",
};

export default function ColombiaPage() {
  return <CountryHub country="colombia" />;
}
