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
    <main className="relative flex min-h-0 flex-1 items-stretch overflow-hidden px-3 py-2 text-foreground sm:px-5 sm:py-3 lg:px-6 lg:py-3">
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">
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
