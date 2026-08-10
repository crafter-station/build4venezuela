import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Build4Latam | Technology in solidarity",
  description:
    "Open tools and builder communities responding to urgent needs across Latin America.",
};

const countries = [
  {
    code: "VE",
    href: "/ve",
    name: "Venezuela",
    description: "Herramientas creadas tras los terremotos en Venezuela.",
    colors: ["#ffd83d", "#16c7e8", "#ff4a63"],
  },
  {
    code: "CO",
    href: "/co",
    name: "Colombia",
    description:
      "Ayuda para Colombia y herramientas regionales listas para adaptarse.",
    colors: ["#ffd83d", "#16c7e8", "#ff4a63"],
  },
] as const;

export default function LatamHome() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-5 py-10 text-foreground sm:px-8 lg:px-10">
      <div className="bg-grid absolute inset-0 opacity-[0.06]" />
      <section className="relative mx-auto w-full max-w-6xl border border-border bg-background/95">
        <header className="border-border border-b px-6 py-5 sm:px-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {"Build4Latam // tecnología en solidaridad"}
          </p>
        </header>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between border-border border-b p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
                Elige dónde ayudar
              </p>
              <h1 className="mt-6 text-balance font-mono text-[clamp(3.8rem,10vw,8rem)] font-black uppercase leading-[0.72] tracking-[-0.08em]">
                Build4
                <span className="block text-primary">Latam</span>
              </h1>
            </div>
            <p className="mt-12 max-w-lg font-mono text-base uppercase leading-7 tracking-[0.1em] text-foreground/70">
              Una red abierta de herramientas, builders y recursos para
              responder a emergencias en América Latina. Lo que funciona en un
              país puede ayudar al siguiente.
            </p>
          </div>

          <div className="grid sm:grid-cols-2">
            {countries.map((country, index) => (
              <Link
                className={`group flex min-h-[22rem] flex-col justify-between p-6 transition hover:bg-foreground hover:text-background sm:p-8 ${
                  index === 0
                    ? "border-border border-b sm:border-r sm:border-b-0"
                    : ""
                }`}
                href={country.href}
                key={country.code}
              >
                <div>
                  <div className="flex gap-1" aria-hidden="true">
                    {country.colors.map((color) => (
                      <span
                        className="h-2 flex-1"
                        key={color}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="mt-7 font-mono text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground transition group-hover:text-background/55">
                    /{country.code.toLowerCase()}
                  </p>
                  <h2 className="mt-3 font-mono text-[clamp(2.5rem,5vw,4.5rem)] font-black uppercase leading-none tracking-[-0.06em]">
                    {country.name}
                  </h2>
                </div>
                <div>
                  <p className="font-mono text-sm uppercase leading-6 tracking-[0.1em] text-foreground/65 transition group-hover:text-background/70">
                    {country.description}
                  </p>
                  <p className="mt-6 font-mono text-sm font-black uppercase tracking-[0.22em] text-primary group-hover:text-background">
                    Entrar →
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
