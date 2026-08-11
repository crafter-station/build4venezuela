import { SouthAmericaMapPanel } from "@/components/south-america-map-panel";
import type { SouthAmericaCountriesContent } from "@/lib/south-america-countries";
import type { SouthAmericaCountryCode } from "@/lib/south-america-map";

type CountrySelectorProps = {
  countries: SouthAmericaCountriesContent;
  copy: {
    chooseHint: string;
    emptyTitle: string;
    explore: string;
    mapLabel: string;
    otherCountries: string;
    submitProject: string;
  };
  hubs: Partial<
    Record<SouthAmericaCountryCode, { exploreHref: string; submitHref: string }>
  >;
  submitLatamHref: string;
};

export function CountrySelector({
  countries,
  copy,
  hubs,
  submitLatamHref,
}: CountrySelectorProps) {
  return (
    <main className="relative flex min-h-0 flex-1 items-center overflow-hidden px-4 py-4 text-foreground sm:px-6 sm:py-5 lg:px-8">
      <div className="relative z-10 w-full">
        <SouthAmericaMapPanel
          copy={copy}
          countries={countries}
          hubs={hubs}
          submitLatamHref={submitLatamHref}
        />
      </div>
    </main>
  );
}
