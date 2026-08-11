import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

type Country = {
  code: "VE" | "CO";
  description: string;
  href: string;
  index: string;
  name: string;
};

type CountrySelectorProps = {
  addProjectHref: string;
  countries: Country[];
  copy: {
    addProject: string;
    choose: string;
    description: string;
    enter: string;
    networkActive: string;
    solidarity: string;
    statement: string;
    themeToggle: string;
  };
};

export function CountrySelector({
  addProjectHref,
  countries,
  copy,
}: CountrySelectorProps) {
  return (
    <main className="relative flex min-h-svh items-center overflow-hidden bg-background px-4 py-4 text-foreground sm:px-6 sm:py-6 lg:px-10 lg:py-10">
      <div
        aria-hidden="true"
        className="bg-grid absolute inset-0 opacity-[0.055]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-[8vw] hidden w-px bg-line/40 lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-[8vw] hidden w-px bg-line/40 lg:block"
      />

      <section className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-xl border border-line bg-background/96 shadow-panel">
        <header className="flex items-center justify-between gap-6 border-line border-b px-5 py-4 sm:px-7 sm:py-5 lg:px-9">
          <p className="ui-eyebrow text-primary">
            Build4Latam <span aria-hidden="true">{"//"}</span>{" "}
            <span className="hidden sm:inline">{copy.solidarity}</span>
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <p className="ui-eyebrow hidden items-center gap-2 text-ink-muted sm:flex">
              <span
                aria-hidden="true"
                className="size-1.5 bg-accent shadow-[0_0_12px_var(--accent)]"
              />
              {copy.networkActive}
            </p>
            <ThemeToggle label={copy.themeToggle} />
            <Link
              className={buttonVariants({ size: "sm" })}
              href={addProjectHref}
            >
              {copy.addProject}
            </Link>
          </div>
        </header>

        <div className="grid lg:min-h-[36rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col justify-between border-line border-b p-6 sm:p-9 lg:border-r lg:border-b-0 lg:p-12">
            <div>
              <p className="ui-eyebrow text-accent">{copy.choose}</p>
              <h1 className="type-display mt-8 max-w-xl text-balance font-mono">
                Build4
                <span className="block text-primary">Latam</span>
              </h1>
            </div>

            <div className="mt-16 border-line border-t pt-6 lg:mt-12">
              <p className="max-w-xl font-mono text-sm uppercase leading-6 tracking-[0.095em] text-ink-muted sm:text-base sm:leading-7">
                {copy.description}
              </p>
              <p className="ui-eyebrow mt-5 text-foreground">
                {copy.statement}
              </p>
            </div>
          </div>

          <div className="grid grid-rows-2">
            {countries.map((country) => (
              <Link
                aria-label={`${copy.enter} Build4${country.name}`}
                className="country-card ui-focus group grid min-h-[17rem] gap-8 overflow-hidden border-line border-b p-6 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.75fr)] sm:items-end sm:p-9 lg:min-h-0 lg:p-10"
                data-country={country.code.toLowerCase()}
                href={country.href}
                key={country.code}
              >
                <span aria-hidden="true" className="country-card__fill" />

                <div className="country-card__content self-start sm:self-auto">
                  <div
                    className="mb-8 flex items-center gap-4"
                    aria-hidden="true"
                  >
                    <span className="ui-eyebrow text-current/55">
                      {country.index}
                    </span>
                    <div className="flex w-full max-w-56 gap-1">
                      {["bg-brand-yellow", "bg-accent", "bg-brand-red"].map(
                        (color) => (
                          <span
                            className={`h-1.5 flex-1 ${color}`}
                            key={color}
                          />
                        ),
                      )}
                    </div>
                  </div>
                  <p className="country-card__meta ui-eyebrow text-ink-muted">
                    /{country.code.toLowerCase()}
                  </p>
                  <h2 className="type-section mt-2 font-mono">
                    {country.name}
                  </h2>
                </div>

                <div className="country-card__content sm:border-current/20 sm:border-l sm:pl-7">
                  <p className="country-card__meta font-mono text-sm uppercase leading-6 tracking-[0.09em] text-ink-muted">
                    {country.description}
                  </p>
                  <p className="country-card__action ui-eyebrow mt-8 flex items-center gap-3 text-primary">
                    {copy.enter}
                    <span aria-hidden="true" className="country-card__arrow">
                      →
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
