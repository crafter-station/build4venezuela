import type { Metadata } from "next";
import { CountrySelector } from "@/components/country-selector";

export const metadata: Metadata = {
  title: "Build4Latam | Technology in solidarity",
  description:
    "Open tools and builder communities responding to urgent needs across Latin America.",
};

export default function LatamHome() {
  return (
    <CountrySelector
      addProjectHref="/en/submit"
      countries={[
        {
          code: "VE",
          index: "01",
          href: "/en/ve",
          name: "Venezuela",
          description: "Tools built after the earthquakes in Venezuela.",
        },
        {
          code: "CO",
          index: "02",
          href: "/en/co",
          name: "Colombia",
          description:
            "Emergency support for Colombia and regional tools ready to adapt.",
        },
      ]}
      copy={{
        addProject: "Add a project",
        choose: "Choose where to help",
        description:
          "An open network of tools, builders, and resources responding to emergencies across Latin America.",
        enter: "Enter",
        networkActive: "Network active",
        solidarity: "technology in solidarity",
        statement: "What works in one country can help the next.",
        themeToggle: "Switch color theme",
      }}
    />
  );
}
