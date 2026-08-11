"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MapHotspotLayer } from "@/components/map-hotspot-layer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  SOUTH_AMERICA_COUNTRY_CODES,
  type SouthAmericaCountriesContent,
} from "@/lib/south-america-countries";
import {
  SOUTH_AMERICA_MAP,
  type SouthAmericaCountryCode,
} from "@/lib/south-america-map";
import { cn } from "@/lib/utils";

const MOBILE_HUB_CODES: SouthAmericaCountryCode[] = ["CO", "VE"];
const MOBILE_OTHER_CODES: SouthAmericaCountryCode[] =
  SOUTH_AMERICA_COUNTRY_CODES.filter(
    (code): code is SouthAmericaCountryCode => code !== "CO" && code !== "VE",
  );

function isOtherLatamCountry(code: SouthAmericaCountryCode) {
  return code !== "CO" && code !== "VE";
}

type HubCountry = {
  exploreHref: string;
  submitHref: string;
};

type LeaderLine = {
  d: string;
  key: string;
  x1: number;
  y1: number;
};

type SouthAmericaMapPanelProps = {
  countries: SouthAmericaCountriesContent;
  copy: {
    chooseHint: string;
    emptyTitle: string;
    explore: string;
    mapLabel: string;
    otherCountries: string;
    submitProject: string;
  };
  hubs: Partial<Record<SouthAmericaCountryCode, HubCountry>>;
  submitLatamHref: string;
};

function measureLeader(
  containerEl: HTMLElement,
  countryEl: SVGGraphicsElement,
  panelEl: HTMLElement,
) {
  const container = containerEl.getBoundingClientRect();
  const country = countryEl.getBoundingClientRect();
  const panel = panelEl.getBoundingClientRect();

  const x1 = country.left + country.width * 0.7 - container.left;
  const y1 = country.top + country.height * 0.42 - container.top;
  const x2 = panel.left - container.left + 4;
  const y2 = panel.top + Math.min(64, panel.height * 0.26) - container.top;
  const midX = x1 + Math.max(24, (x2 - x1) * 0.68);

  return {
    d: `M ${x1} ${y1} L ${midX} ${y1} L ${x2} ${y2}`,
    x1,
    y1,
  };
}

export function SouthAmericaMapPanel({
  countries,
  copy,
  hubs,
  submitLatamHref,
}: SouthAmericaMapPanelProps) {
  const listboxId = useId();
  const layoutRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pathRefs = useRef<
    Partial<Record<SouthAmericaCountryCode, SVGPathElement>>
  >({});

  const [selected, setSelected] = useState<SouthAmericaCountryCode | null>(
    null,
  );
  const [hovered, setHovered] = useState<SouthAmericaCountryCode | null>(null);
  const [drawToken, setDrawToken] = useState(0);
  const [leader, setLeader] = useState<LeaderLine | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);

  // Mobile: Colombia starts selected with its brief open under the row
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)");
    const syncDefault = () => {
      if (mobile.matches) {
        setSelected((current) => current ?? "CO");
      }
    };
    syncDefault();
    mobile.addEventListener("change", syncDefault);
    return () => mobile.removeEventListener("change", syncDefault);
  }, []);

  // Brief / leader follow selection; hover only paints map feedback
  const briefCode = selected ?? hovered;
  const content = briefCode ? countries[briefCode] : null;
  const otherSelected = selected !== null && isOtherLatamCountry(selected);

  function showCountry(code: SouthAmericaCountryCode, animate: boolean) {
    // Only redraw the leader when the brief is still in preview mode
    if (!selected && animate) {
      setDrawToken((token) => token + 1);
    }
    setHovered(code);
  }

  function selectCountry(code: SouthAmericaCountryCode) {
    setDrawToken((token) => token + 1);
    setSelected(code);
    setHovered(null);
    if (isOtherLatamCountry(code)) {
      setOtherOpen(true);
    }
  }

  useEffect(() => {
    if (!selected) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    document
      .getElementById(`${listboxId}-mobile-brief`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected, listboxId]);

  function renderBrief(code: SouthAmericaCountryCode, mobileInline = false) {
    const brief = countries[code];
    const briefHub = hubs[code];
    const briefSubmit = briefHub?.submitHref ?? submitLatamHref;

    return (
      <div
        className={cn(
          "sa-map__brief sa-map__panel-in",
          mobileInline && "sa-map__brief--mobile-inline",
        )}
        id={mobileInline ? `${listboxId}-mobile-brief` : undefined}
        key={code}
      >
        <div className="sa-map__brief-frame" aria-hidden="true" />

        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.22em] text-ink-muted">
          Target <span aria-hidden="true">{"//"}</span> /{code.toLowerCase()}
        </p>
        <h2 className="mt-3 font-mono text-2xl font-black uppercase tracking-[-0.04em] text-primary sm:text-3xl">
          {brief.name}
        </h2>
        <p className="mt-4 max-w-sm font-mono text-xs leading-5 tracking-[0.04em] text-foreground/85 sm:text-[0.8rem] sm:leading-6">
          {brief.disaster}
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {brief.tags.map((tag) => (
            <Badge
              className="rounded-none border-foreground/25 bg-transparent px-1.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-muted"
              key={tag}
              variant="outline"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {briefHub ? (
            <>
              <Link
                className={buttonVariants({ size: "sm" })}
                href={briefHub.exploreHref}
              >
                {copy.explore}
              </Link>
              <Link
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                })}
                href={briefHub.submitHref}
              >
                {copy.submitProject}
              </Link>
            </>
          ) : (
            <Link className={buttonVariants({ size: "sm" })} href={briefSubmit}>
              {copy.submitProject}
            </Link>
          )}
        </div>
      </div>
    );
  }

  function renderMobileCountry(code: SouthAmericaCountryCode, nested = false) {
    const isHub = Boolean(hubs[code]);
    const isActive = selected === code;
    return (
      <div className="sa-mobile-list__row" key={code}>
        <button
          aria-expanded={isActive}
          aria-pressed={isActive}
          className={cn(
            "sa-mobile-list__item ui-focus",
            nested && "sa-mobile-list__item--nested",
            isActive && "is-active",
            isHub && "is-hub",
          )}
          onClick={() => selectCountry(code)}
          type="button"
        >
          <span className="sa-mobile-list__code">{code}</span>
          <span className="sa-mobile-list__name">{countries[code].name}</span>
          {isHub ? (
            <span className="sa-mobile-list__tag">Active</span>
          ) : (
            <span className="sa-mobile-list__tag sa-mobile-list__tag--muted">
              Latam
            </span>
          )}
        </button>
        {isActive ? renderBrief(code, true) : null}
      </div>
    );
  }

  useLayoutEffect(() => {
    if (!briefCode) {
      setLeader(null);
      return;
    }

    const containerEl = layoutRef.current;
    const countryEl = pathRefs.current[briefCode];
    const panelEl = panelRef.current;
    if (!containerEl || !countryEl || !panelEl) return;

    const measured = measureLeader(containerEl, countryEl, panelEl);
    setLeader({
      ...measured,
      key: `${briefCode}-${drawToken}`,
    });

    const onResize = () => {
      const next = measureLeader(containerEl, countryEl, panelEl);
      setLeader((current) =>
        current
          ? { ...current, ...next }
          : { ...next, key: `${briefCode}-${drawToken}` },
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [briefCode, drawToken]);

  return (
    <div
      className="relative grid min-h-0 w-full flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,7fr)_minmax(18rem,5fr)] lg:items-center lg:gap-0"
      ref={layoutRef}
    >
      {leader ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full overflow-visible lg:block"
        >
          <path
            className="sa-map__leader-line"
            d={leader.d}
            fill="none"
            key={leader.key}
            pathLength={1}
          />
          <circle
            className="sa-map__leader-dot"
            cx={leader.x1}
            cy={leader.y1}
            key={`${leader.key}-dot`}
            r={3}
          />
        </svg>
      ) : null}

      {/* Mobile: hubs first, other Latam in a dropdown — map stays desktop-only */}
      <div className="order-1 min-h-0 overflow-y-auto lg:hidden">
        <nav aria-label={copy.mapLabel} className="sa-mobile-list">
          {MOBILE_HUB_CODES.map((code) => renderMobileCountry(code))}

          <div className="sa-mobile-list__dropdown">
            <button
              aria-controls={`${listboxId}-other`}
              aria-expanded={otherOpen || otherSelected}
              className={cn(
                "sa-mobile-list__toggle ui-focus",
                (otherOpen || otherSelected) && "is-open",
                otherSelected && "is-active",
              )}
              onClick={() => setOtherOpen((open) => !open)}
              type="button"
            >
              <span className="sa-mobile-list__code">+</span>
              <span className="sa-mobile-list__name">
                {copy.otherCountries}
              </span>
              <CaretDownIcon
                aria-hidden="true"
                className="sa-mobile-list__caret"
                size={14}
                weight="bold"
              />
            </button>

            {otherOpen || otherSelected ? (
              <div className="sa-mobile-list__panel" id={`${listboxId}-other`}>
                {MOBILE_OTHER_CODES.map((code) =>
                  renderMobileCountry(code, true),
                )}
              </div>
            ) : null}
          </div>
        </nav>
      </div>

      <div className="relative order-1 hidden min-h-0 h-full items-center justify-center lg:flex lg:order-1">
        <div
          aria-label={copy.mapLabel}
          className="relative flex h-full max-h-full w-full max-w-[min(34rem,100%)] items-center justify-center"
          role="listbox"
        >
          <svg
            aria-hidden="true"
            className="sa-map max-h-full w-auto max-w-full select-none overflow-visible"
            viewBox={SOUTH_AMERICA_MAP.viewBox}
          >
            {SOUTH_AMERICA_MAP.countries.map((country) => {
              const isSelected = selected === country.code;
              const isHovered = hovered === country.code && !isSelected;
              return (
                <path
                  aria-label={countries[country.code].name}
                  aria-selected={isSelected}
                  className={cn(
                    "sa-map__country ui-focus cursor-pointer outline-none",
                    isSelected && "sa-map__country--selected",
                    isHovered && "sa-map__country--hovered",
                    selected && !isSelected && "sa-map__country--dimmed",
                    !selected &&
                      briefCode &&
                      briefCode !== country.code &&
                      "sa-map__country--dimmed",
                  )}
                  d={country.d}
                  id={`${listboxId}-${country.code}`}
                  key={country.code}
                  onBlur={() => {
                    if (hovered === country.code) {
                      setHovered(null);
                    }
                  }}
                  onClick={() => selectCountry(country.code)}
                  onFocus={() => showCountry(country.code, true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectCountry(country.code);
                    }
                  }}
                  onMouseEnter={() => showCountry(country.code, true)}
                  onMouseLeave={() => {
                    if (hovered === country.code) {
                      setHovered(null);
                    }
                  }}
                  ref={(node) => {
                    if (node) {
                      pathRefs.current[country.code] = node;
                    } else {
                      delete pathRefs.current[country.code];
                    }
                  }}
                  role="option"
                  tabIndex={0}
                />
              );
            })}
            <MapHotspotLayer active={briefCode} pathRefs={pathRefs} />
          </svg>
        </div>
      </div>

      <aside
        className="relative z-10 order-2 hidden min-h-0 flex-col justify-center lg:flex lg:pt-0 lg:pl-4 xl:pl-8"
        ref={panelRef}
      >
        {content && briefCode ? (
          renderBrief(briefCode)
        ) : (
          <div className="sa-map__brief sa-map__brief--idle">
            <div className="sa-map__brief-frame" aria-hidden="true" />
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.22em] text-ink-muted">
              {copy.chooseHint}
            </p>
            <p className="mt-3 max-w-xs font-mono text-xs uppercase leading-5 tracking-[0.12em] text-ink-muted">
              {copy.emptyTitle}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
