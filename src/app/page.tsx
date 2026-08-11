import type { Metadata } from "next";
import { CountrySelector } from "@/components/country-selector";
import { HudCapsule } from "@/components/hud-capsule";
import { LandingSplash } from "@/components/landing-splash";
import { SiteFooter } from "@/components/site-footer";
import type { SouthAmericaCountriesContent } from "@/lib/south-america-countries";

export const metadata: Metadata = {
  title: "Build4Latam | Technology in solidarity",
  description:
    "Open tools and builder communities responding to urgent needs across Latin America.",
};

const countries = {
  AR: {
    name: "Argentina",
    disaster:
      "No active emergency hub yet. Submit tools that can adapt across Latam when the next crisis hits.",
    tags: ["Aid Coordination", "Verified Info", "Data & APIs"],
  },
  BO: {
    name: "Bolivia",
    disaster:
      "No active emergency hub yet. Build reusable response tools the network can activate fast.",
    tags: ["Aid Coordination", "Verified Info", "Connectivity & Infra"],
  },
  BR: {
    name: "Brazil",
    disaster:
      "No active emergency hub yet. Contribute projects that scale across languages and regions.",
    tags: ["Aid Coordination", "Data & APIs", "Verified Info"],
  },
  CL: {
    name: "Chile",
    disaster:
      "No active emergency hub yet. Earthquake-ready tools for alerts, damage, and coordination are welcome.",
    tags: ["Damage Assessment", "Verified Info", "Connectivity & Infra"],
  },
  CO: {
    name: "Colombia",
    disaster:
      "Magnitude 7.4 earthquake near San José del Palmar, Chocó (August 10, 2026). Communities need verified information, shelters, and coordination tools.",
    tags: ["Aid Coordination", "Verified Info", "Connectivity & Infra"],
  },
  EC: {
    name: "Ecuador",
    disaster:
      "No active emergency hub yet. Submit tools ready for seismic response and low-connectivity use.",
    tags: ["Damage Assessment", "Aid Coordination", "Verified Info"],
  },
  GY: {
    name: "Guyana",
    disaster:
      "No active emergency hub yet. Build lightweight tools the wider Latam network can reuse.",
    tags: ["Aid Coordination", "Verified Info"],
  },
  PE: {
    name: "Peru",
    disaster:
      "No active emergency hub yet. Contribute projects for aid routing, alerts, and verified updates.",
    tags: ["Aid Coordination", "Verified Info", "Damage Assessment"],
  },
  PY: {
    name: "Paraguay",
    disaster:
      "No active emergency hub yet. Submit adaptable tools for coordination and public information.",
    tags: ["Aid Coordination", "Verified Info"],
  },
  SR: {
    name: "Suriname",
    disaster:
      "No active emergency hub yet. Build reusable response tools for the Latam network.",
    tags: ["Aid Coordination", "Verified Info"],
  },
  UY: {
    name: "Uruguay",
    disaster:
      "No active emergency hub yet. Contribute tools that can transfer to neighboring emergencies.",
    tags: ["Data & APIs", "Verified Info", "Aid Coordination"],
  },
  VE: {
    name: "Venezuela",
    disaster:
      "After the June 24 earthquakes, families and volunteers still need reliable information, aid coordination, and tools that work with limited connectivity.",
    tags: [
      "Find People",
      "Aid Coordination",
      "Verified Info",
      "Damage Assessment",
    ],
  },
} satisfies SouthAmericaCountriesContent;

export default function LatamHome() {
  return (
    <div className="landing-type flex min-h-full flex-col bg-background">
      <LandingSplash />
      <div className="relative flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-5">
        <div
          aria-hidden="true"
          className="bg-grid absolute inset-0 opacity-[0.05]"
        />
        <HudCapsule className="flex min-h-[calc(100svh-8.5rem)] flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <CountrySelector
              countries={countries}
              copy={{
                chooseHint: "Choose a country",
                emptyTitle: "Choose where to help.",
                explore: "Explore",
                mapLabel: "Interactive map of South America",
                otherCountries: "Other Latam",
                submitProject: "Submit project",
              }}
              hubs={{
                VE: {
                  exploreHref: "/en/ve",
                  submitHref: "/en/submit?country=venezuela",
                },
                CO: {
                  exploreHref: "/en/co",
                  submitHref: "/en/submit?country=colombia",
                },
              }}
              submitLatamHref="/en/submit"
            />
          </div>
        </HudCapsule>
        <HudCapsule className="shrink-0">
          <SiteFooter locale="en" />
        </HudCapsule>
      </div>
    </div>
  );
}
