import type { Metadata } from "next";
import { CountryHub } from "@/components/country-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Venezuela | Build4Latam",
  description:
    "Herramientas, proyectos y recursos abiertos construidos para ayudar a Venezuela.",
  alternates: {
    canonical: "/ve",
  },
  openGraph: {
    title: "Venezuela | Build4Latam",
    description:
      "Herramientas, proyectos y recursos abiertos construidos para ayudar a Venezuela.",
    url: "/ve",
    images: [
      {
        url: "/assets/og-venezuela.jpg",
        width: 1200,
        height: 630,
        alt: "Build4Latam Venezuela",
      },
    ],
  },
};

export default function VenezuelaPage() {
  return <CountryHub country="venezuela" />;
}
