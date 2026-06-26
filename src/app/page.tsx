import Image from "next/image";

const assetPath = "/BFV/assets/";

const projectIdeas = [
  "Directorios verificados de refugios, centros de acopio y atención médica.",
  "Mapas ligeros para reportar necesidades por zona y actualizar estados.",
  "Bots de WhatsApp para orientar a familias, voluntarios y donantes.",
  "Herramientas para coordinar voluntarios, transporte, inventario y entregas.",
  "Páginas simples para traducir información crítica y combatir rumores.",
  "Sistemas de seguimiento para casos, solicitudes de ayuda y contactos locales.",
];

const channels = [
  {
    label: "Luma",
    href: "https://build4venezuela.com/luma",
    text: "Regístrate al evento y recibe actualizaciones oficiales.",
  },
  {
    label: "WhatsApp",
    href: "https://build4venezuela.com/whatsapp",
    text: "Entra al grupo para coordinación rápida y anuncios urgentes.",
  },
  {
    label: "Discord",
    href: "https://build4venezuela.com/discord",
    text: "Encuentra equipo, canal de proyecto, mentores y soporte técnico.",
  },
  {
    label: "GitHub",
    href: "https://github.com/crafter-station/build4venezuela",
    text: "Revisa el repositorio, abre issues y comparte avances del proyecto.",
  },
];

const impactStats = [
  { value: "188+", label: "personas fallecidas" },
  { value: "1,500+", label: "personas heridas" },
  { value: "346+", label: "estructuras dañadas" },
  { value: "200+", label: "personas posiblemente atrapadas" },
];

function VMark({ className }: { className: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      height={46}
      src={`${assetPath}v-mark.svg`}
      width={45}
    />
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <section className="relative isolate flex min-h-screen items-center justify-center px-4 py-4 sm:px-8 lg:px-10">
        <div className="absolute inset-0 -z-20 bg-black" />
        <div className="absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:48px_48px]" />

        <VMark className="absolute top-5 left-4 h-8 w-8 opacity-70 sm:top-8 sm:left-8 sm:h-10 sm:w-10 lg:left-14" />
        <VMark className="absolute top-5 right-4 h-8 w-8 opacity-70 sm:top-8 sm:right-8 sm:h-10 sm:w-10 lg:right-14" />
        <VMark className="absolute bottom-5 left-4 h-8 w-8 opacity-70 sm:bottom-8 sm:left-8 sm:h-10 sm:w-10 lg:left-14" />
        <VMark className="absolute right-4 bottom-5 h-8 w-8 opacity-70 sm:right-8 sm:bottom-8 sm:h-10 sm:w-10 lg:right-14" />

        <article className="poster-frame relative flex min-h-[calc(100svh-2rem)] w-full max-w-[1120px] flex-col items-center justify-center gap-[clamp(1.75rem,4svh,3.5rem)] py-10 sm:min-h-[calc(100svh-2rem)] sm:py-12 lg:gap-[clamp(1.6rem,3svh,3rem)] lg:py-10">
          <header className="flex w-full flex-col items-center">
            <Image
              alt="Build for Venezuela"
              className="w-[min(82vw,520px)] select-none sm:w-[min(70vw,600px)] lg:w-[min(58vw,620px)]"
              draggable="false"
              height={285}
              src={`${assetPath}B4V.svg`}
              priority
              width={731}
            />
          </header>

          <div className="poster-map relative flex w-full items-center justify-center">
            <Image
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[34vw] max-w-[390px] -translate-x-[112%] -translate-y-1/2 select-none opacity-95 md:block xl:w-[32vw]"
              draggable="false"
              height={322}
              src={`${assetPath}left-hand@2x.png`}
              width={940}
            />
            <Image
              alt="Map of Venezuela"
              className="relative z-10 w-[min(34vw,180px)] min-w-28 select-none drop-shadow-[0_0_30px_rgba(255,255,255,0.14)] sm:w-[min(26vw,210px)] lg:w-[min(16vw,190px)]"
              draggable="false"
              height={309}
              src={`${assetPath}venezuelan_map.svg`}
              width={321}
            />
            <Image
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[34vw] max-w-[390px] -translate-y-1/2 translate-x-[13%] select-none opacity-95 md:block xl:w-[32vw]"
              draggable="false"
              height={322}
              src={`${assetPath}right-hand@2x.png`}
              width={940}
            />
          </div>

          <div className="w-full text-center font-mono uppercase">
            <p className="mx-auto max-w-[920px] text-balance text-[clamp(1.1rem,2.3vw,2rem)] font-light leading-[1.15] tracking-[0.14em] text-white">
              Una hackathon humanitaria para
            </p>
            <p className="mx-auto mt-3 max-w-[920px] text-balance text-[clamp(1.2rem,2.35vw,2.1rem)] font-black leading-[1.2] tracking-[0.04em] text-white">
              construir soluciones tech por Venezuela.
            </p>
          </div>

          <div className="w-full max-w-[860px] text-center font-mono uppercase">
            <a
              className="inline-block text-[clamp(0.95rem,1.75vw,1.45rem)] font-light leading-snug tracking-[0.24em] text-white transition hover:text-[#fcd43d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fcd43d] focus-visible:ring-offset-4 focus-visible:ring-offset-black"
              href="https://build4venezuela.com/luma"
            >
              {"26,27,28 de junio // online // luma.com"}
            </a>
            <div className="mt-4 flex justify-center gap-4 text-xs font-light tracking-[0.24em] text-white/65 sm:gap-6 sm:text-sm">
              <a
                className="transition hover:text-[#6fcaef] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcaef] focus-visible:ring-offset-4 focus-visible:ring-offset-black"
                href="https://build4venezuela.com/whatsapp"
              >
                WhatsApp
              </a>
              <span aria-hidden="true">{"//"}</span>
              <a
                className="transition hover:text-[#ef3b56] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3b56] focus-visible:ring-offset-4 focus-visible:ring-offset-black"
                href="https://build4venezuela.com/discord"
              >
                Discord
              </a>
            </div>
            <div className="mt-8 h-px w-full bg-white/35 sm:mt-10" />
            <p className="mx-auto mt-6 max-w-[760px] text-balance text-center text-[clamp(1rem,1.8vw,1.5rem)] font-light leading-[1.35] tracking-[0.12em] text-white sm:mt-7">
              Porque en momentos de crisis, la tecnología también puede ser una
              forma de solidaridad.
            </p>
            <div className="mt-8 h-px w-full bg-white/35 sm:mt-10" />
          </div>
        </article>
      </section>

      <section className="border-white/10 border-t px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-[#6fcaef]">
              Contexto
            </p>
            <h2 className="mt-5 text-balance font-mono text-[clamp(2.25rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.04em]">
              Construir con urgencia, no con ruido.
            </h2>
          </div>

          <div className="space-y-7 font-mono text-[clamp(1.05rem,1.8vw,1.45rem)] font-light leading-relaxed tracking-[0.06em] text-white/78">
            <p>
              Venezuela enfrenta una emergencia mayor después de dos fuertes
              terremotos el 24 de junio. Los reportes más recientes hablan de al
              menos 188 personas fallecidas y más de 1,500 heridas.
            </p>
            <p>
              Equipos de rescate siguen buscando sobrevivientes. Vuelos de ayuda
              internacional y equipos de apoyo ya comenzaron a llegar, mientras
              hospitales, edificios y comunidades afectadas enfrentan una crisis
              humanitaria en desarrollo.
            </p>
            <a
              className="inline-flex border border-[#6fcaef]/60 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#6fcaef] transition hover:border-white hover:bg-white hover:text-black"
              href="https://www.perplexity.ai/?q=What%E2%80%99s%20the%20latest%20on%20the%20Venezuela%20earthquakes?"
              rel="noreferrer"
              target="_blank"
            >
              Ver información más reciente
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
          {impactStats.map((stat) => (
            <article className="bg-black p-6 sm:p-7" key={stat.label}>
              <p className="font-mono text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-[-0.06em] text-white">
                {stat.value}
              </p>
              <p className="mt-4 font-mono text-xs uppercase leading-5 tracking-[0.2em] text-white/50">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col justify-between gap-5 border-white/15 border-b pb-8 sm:mb-12 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-[#fcd43d]">
                Ideas de proyectos
              </p>
              <h2 className="mt-4 font-mono text-[clamp(2rem,4vw,3.75rem)] font-black uppercase leading-none tracking-[-0.04em]">
                Qué puedes construir
              </h2>
            </div>
            <p className="max-w-md font-mono text-sm uppercase leading-6 tracking-[0.16em] text-white/55">
              Elige un problema concreto. Reduce el alcance. Deja algo que otra
              persona pueda usar el lunes.
            </p>
          </div>

          <div className="grid gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
            {projectIdeas.map((idea, index) => (
              <article className="bg-black p-6 sm:p-7" key={idea}>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/35">
                  0{index + 1}
                </p>
                <p className="mt-6 font-mono text-xl font-light leading-snug tracking-[0.04em] text-white sm:text-2xl">
                  {idea}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-white/10 border-y bg-white px-5 py-16 text-black sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-start">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-black/45">
                Únete
              </p>
              <h2 className="mt-4 font-mono text-[clamp(2.3rem,5vw,5.5rem)] font-black uppercase leading-[0.88] tracking-[-0.06em]">
                Ven con una habilidad. Sal con un proyecto.
              </h2>
            </div>

            <div className="grid gap-3">
              {channels.map((channel) => (
                <a
                  className="group grid gap-3 border border-black/12 p-5 font-mono transition hover:border-black hover:bg-black hover:text-white sm:grid-cols-[10rem_1fr] sm:items-center sm:p-6"
                  href={channel.href}
                  key={channel.label}
                >
                  <span className="text-xl font-black uppercase tracking-[0.08em]">
                    {channel.label}
                  </span>
                  <span className="text-base leading-7 tracking-[0.05em] text-black/65 transition group-hover:text-white/75">
                    {channel.text}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black px-5 py-14 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col-reverse gap-10 border-white/15 border-t pt-12 md:flex-row md:items-center md:justify-between">
          <p className="max-w-md font-mono text-xs uppercase leading-6 tracking-[0.2em] text-white/45">
            Build for Venezuela es organizado por una comunidad de builders,
            diseñadores y aliados que creen que la tecnología también puede ser
            una forma de solidaridad.
          </p>

          <div className="grid w-full max-w-[340px] grid-cols-3 items-center gap-3 sm:max-w-[560px] sm:gap-10 md:w-auto">
            <a
              className="transition hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"
              href="https://moraleja.co"
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt="Moraleja Studio"
                className="mx-auto h-auto w-full max-w-[88px] select-none sm:max-w-[105px]"
                draggable="false"
                height={52}
                src={`${assetPath}moraleja-studio.svg`}
                width={65}
              />
            </a>
            <a
              className="transition hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"
              href="https://crafterstation.com"
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt="Crafter Station"
                className="mx-auto h-auto w-full max-w-[140px] select-none sm:max-w-[190px]"
                draggable="false"
                height={34}
                src={`${assetPath}CS.svg`}
                width={140}
              />
            </a>
            <a
              className="transition hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"
              href="https://hackathon.lat"
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt="The Hackathon Company"
                className="mx-auto h-auto w-full max-w-[104px] select-none sm:max-w-[130px]"
                draggable="false"
                height={52}
                src={`${assetPath}THC.svg`}
                width={92}
              />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
