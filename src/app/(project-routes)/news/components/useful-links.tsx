const links = [
  {
    title: "Venezuela Response Hub",
    description:
      "Hub central de respuesta a la emergencia en Venezuela. Información consolidada, recursos y coordinación.",
    href: "https://www.vzlaresponsehub.org/",
    kind: "Hub central",
    highlight: true,
  },
  {
    title: "USGS Earthquakes",
    description:
      "Servicio Geológico de Estados Unidos. Datos oficiales y en tiempo real de actividad sísmica.",
    href: "https://earthquake.usgs.gov/",
    kind: "Fuente oficial",
    highlight: false,
  },
  {
    title: "Desaparecidos Terremoto Venezuela",
    description:
      "Plataforma centralizada para reportar y buscar personas desaparecidas durante la emergencia.",
    href: "https://desaparecidosterremotovenezuela.com/",
    kind: "Ayuda humanitaria",
    highlight: false,
  },
  {
    title: "Protección Civil VE",
    description:
      "Dirección Nacional de Protección Civil y Administración de Desastres.",
    href: "https://twitter.com/PCivil_Ve",
    kind: "Fuente oficial",
    highlight: false,
  },
  {
    title: "Build4Venezuela — Proyectos",
    description:
      "Todos los proyectos del hackathon. Encuentra herramientas ya construidas por la comunidad.",
    href: "/projects",
    kind: "Hackathon",
    highlight: false,
  },
  {
    title: "Reencuentros — Apareció",
    description:
      "Plataforma para centralizar imágenes y videos de personas y animales encontrados. Proyecto del hackathon.",
    href: "/p/reencuentros",
    kind: "Hackathon",
    highlight: false,
  },
];

export function UsefulLinks() {
  return (
    <section className="border-b border-border px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
              Compilado
            </p>
            <h2 className="mt-1 font-mono text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">
              Links útiles
            </h2>
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <a
              className={`group flex flex-col gap-3 p-5 transition sm:p-6 ${
                link.highlight
                  ? "bg-accent/5 hover:bg-accent/10"
                  : "bg-background hover:bg-card"
              }`}
              href={link.href}
              key={link.href}
              rel={link.href.startsWith("/") ? undefined : "noopener noreferrer"}
              target={link.href.startsWith("/") ? undefined : "_blank"}
            >
              <span
                className={`inline-flex self-start border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${
                  link.highlight
                    ? "border-accent/30 bg-accent/15 text-accent"
                    : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                {link.kind}
              </span>
              <h3
                className={`font-mono text-base font-bold uppercase tracking-[0.02em] transition ${
                  link.highlight
                    ? "text-accent group-hover:text-foreground"
                    : "text-foreground group-hover:text-primary"
                }`}
              >
                {link.title}
              </h3>
              <p className="font-mono text-xs font-light leading-relaxed tracking-[0.04em] text-muted-foreground">
                {link.description}
              </p>
              <span className="mt-auto font-mono text-[10px] uppercase tracking-[0.14em] text-primary opacity-0 transition group-hover:opacity-100">
                {link.href.startsWith("/") ? "Ver →" : "Abrir →"}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
