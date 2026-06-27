// ─── Confidence Levels ───────────────────────────────────────────────
export type ConfidenceLevel = "verified" | "unverified" | "debunked";

export const confidenceConfig: Record<
  ConfidenceLevel,
  { label: string; icon: string; className: string }
> = {
  verified: {
    label: "Verificado",
    icon: "✅",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  unverified: {
    label: "En verificación",
    icon: "⏳",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  debunked: {
    label: "Desmentido",
    icon: "❌",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

// ─── Breaking News Ticker ────────────────────────────────────────────
export type BreakingNewsItem = {
  id: string;
  text: string;
  confidence: ConfidenceLevel;
  timestamp: string; // ISO 8601
};

export const breakingNews: BreakingNewsItem[] = [
  {
    id: "bn-1",
    text: "Equipos de rescate confirman localización de 12 personas con vida en edificio colapsado en Caracas",
    confidence: "verified",
    timestamp: "2026-06-26T23:30:00Z",
  },
  {
    id: "bn-2",
    text: "Ministerio de Salud actualiza cifra oficial: 188 fallecidos y más de 1,500 heridos",
    confidence: "verified",
    timestamp: "2026-06-26T22:15:00Z",
  },
  {
    id: "bn-3",
    text: "Rumor sobre nueva réplica de magnitud 7.0 — NO confirmado por FUNVISIS",
    confidence: "debunked",
    timestamp: "2026-06-26T21:45:00Z",
  },
  {
    id: "bn-4",
    text: "Aeropuerto de Maiquetía recibe primer vuelo con ayuda humanitaria de Colombia",
    confidence: "verified",
    timestamp: "2026-06-26T20:00:00Z",
  },
  {
    id: "bn-5",
    text: "Se reporta posible colapso de estructura en La Guaira — pendiente de verificación",
    confidence: "unverified",
    timestamp: "2026-06-26T19:30:00Z",
  },
  {
    id: "bn-6",
    text: "Cruz Roja despliega 3 hospitales móviles en zonas más afectadas",
    confidence: "verified",
    timestamp: "2026-06-26T18:00:00Z",
  },
  {
    id: "bn-7",
    text: "FALSO: Video viral de edificio cayendo NO es de Venezuela — es material de Turquía 2023",
    confidence: "debunked",
    timestamp: "2026-06-26T17:20:00Z",
  },
  {
    id: "bn-8",
    text: "Gobierno habilita línea 0800-TERREMOTO para reportar emergencias",
    confidence: "verified",
    timestamp: "2026-06-26T16:00:00Z",
  },
];

// ─── Apareció Timeline (External API – Mocked) ──────────────────────
export type AparecioEntry = {
  id: string;
  name: string;
  state: string;
  lastKnownLocation: string;
  source: "familiar" | "voluntario" | "medio";
  foundAt: string; // ISO 8601
  status: "located" | "safe" | "hospitalized";
};

export const aparecioEntries: AparecioEntry[] = [
  {
    id: "ap-1",
    name: "María González",
    state: "Distrito Capital",
    lastKnownLocation: "Av. Libertador, Chacao",
    source: "familiar",
    foundAt: "2026-06-26T22:10:00Z",
    status: "safe",
  },
  {
    id: "ap-2",
    name: "Carlos Mendoza",
    state: "La Guaira",
    lastKnownLocation: "Sector Los Corales",
    source: "voluntario",
    foundAt: "2026-06-26T21:30:00Z",
    status: "hospitalized",
  },
  {
    id: "ap-3",
    name: "Ana Rodríguez",
    state: "Miranda",
    lastKnownLocation: "San Antonio de los Altos",
    source: "medio",
    foundAt: "2026-06-26T20:45:00Z",
    status: "located",
  },
  {
    id: "ap-4",
    name: "Luis Pérez",
    state: "Distrito Capital",
    lastKnownLocation: "Petare, zona 5",
    source: "familiar",
    foundAt: "2026-06-26T19:20:00Z",
    status: "safe",
  },
  {
    id: "ap-5",
    name: "Daniela Hernández",
    state: "Aragua",
    lastKnownLocation: "Maracay Centro",
    source: "voluntario",
    foundAt: "2026-06-26T18:50:00Z",
    status: "safe",
  },
];

// ─── Verified Media Timeline ─────────────────────────────────────────
export type VerifiedMediaEntry = {
  id: string;
  source: string;
  sourceHandle: string;
  content: string;
  url: string;
  publishedAt: string; // ISO 8601
  confidence: ConfidenceLevel;
};

export const verifiedMediaEntries: VerifiedMediaEntry[] = [
  {
    id: "vm-1",
    source: "FUNVISIS",
    sourceHandle: "@FUNVISIS",
    content:
      "Réplica de magnitud 4.2 registrada a las 22:14 HLV. Epicentro a 15km al sur de Caracas. Profundidad: 10km.",
    url: "https://x.com/FUNVISIS/status/example1",
    publishedAt: "2026-06-26T22:20:00Z",
    confidence: "verified",
  },
  {
    id: "vm-2",
    source: "Protección Civil VE",
    sourceHandle: "@PCivil_Ve",
    content:
      "Se mantiene operativo de rescate en los 5 municipios más afectados. 346 estructuras evaluadas hasta el momento.",
    url: "https://x.com/PCivil_Ve/status/example2",
    publishedAt: "2026-06-26T21:00:00Z",
    confidence: "verified",
  },
  {
    id: "vm-3",
    source: "Reuters Latam",
    sourceHandle: "@ReutersLatam",
    content:
      "Venezuela earthquake death toll rises to 188 as rescue operations continue through the night.",
    url: "https://reuters.com/article/example3",
    publishedAt: "2026-06-26T20:30:00Z",
    confidence: "verified",
  },
  {
    id: "vm-4",
    source: "Cruz Roja Venezuela",
    sourceHandle: "@CruzRojaVe",
    content:
      "Desplegamos 3 hospitales móviles y 200 voluntarios en Caracas, La Guaira y Aragua. Necesitamos donaciones de sangre tipo O+ y O-.",
    url: "https://x.com/CruzRojaVe/status/example4",
    publishedAt: "2026-06-26T19:15:00Z",
    confidence: "verified",
  },
  {
    id: "vm-5",
    source: "El Nacional",
    sourceHandle: "@ElNacional",
    content:
      "Vecinos de Catia organizan brigadas de rescate con herramientas propias ante demora de equipos oficiales.",
    url: "https://elnacional.com/article/example5",
    publishedAt: "2026-06-26T18:45:00Z",
    confidence: "verified",
  },
  {
    id: "vm-6",
    source: "OPS/OMS",
    sourceHandle: "@opsabordo",
    content:
      "OPS activa mecanismo de respuesta a emergencias y coordina con autoridades venezolanas el envío de suministros médicos.",
    url: "https://x.com/opsabordo/status/example6",
    publishedAt: "2026-06-26T17:30:00Z",
    confidence: "verified",
  },
];

// ─── Fact-Check Timeline ─────────────────────────────────────────────
export type FactCheckVerdict = "false" | "misleading" | "unverified";

export type FactCheckEntry = {
  id: string;
  claim: string;
  verdict: FactCheckVerdict;
  explanation: string;
  sourceUrl: string;
  sourceName: string;
  checkedAt: string; // ISO 8601
};

export const verdictConfig: Record<
  FactCheckVerdict,
  { label: string; className: string }
> = {
  false: {
    label: "Falso",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  misleading: {
    label: "Engañoso",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  unverified: {
    label: "Sin verificar",
    className: "bg-accent/15 text-accent border-accent/30",
  },
};

export const factCheckEntries: FactCheckEntry[] = [
  {
    id: "fc-1",
    claim:
      "Video viral muestra edificio colapsándose en Caracas durante el terremoto del 24 de junio.",
    verdict: "false",
    explanation:
      "El video corresponde al terremoto de Turquía en febrero de 2023. Fue verificado por Bellingcat y AFP Factual.",
    sourceUrl: "https://factual.afp.com/example1",
    sourceName: "AFP Factual",
    checkedAt: "2026-06-26T22:00:00Z",
  },
  {
    id: "fc-2",
    claim:
      'Se esperan réplicas de magnitud 7.0 o superior "en las próximas horas".',
    verdict: "misleading",
    explanation:
      "FUNVISIS no ha emitido tal pronóstico. Las réplicas son impredecibles. La mayor réplica registrada hasta ahora fue de 5.1.",
    sourceUrl: "https://funvisis.gob.ve",
    sourceName: "FUNVISIS",
    checkedAt: "2026-06-26T21:00:00Z",
  },
  {
    id: "fc-3",
    claim:
      "El gobierno rechazó la ayuda humanitaria internacional.",
    verdict: "false",
    explanation:
      "Múltiples fuentes confirman la llegada de vuelos humanitarios de Colombia, México y organismos internacionales. No hay evidencia de rechazo formal.",
    sourceUrl: "https://reuters.com/article/example-aid",
    sourceName: "Reuters",
    checkedAt: "2026-06-26T20:00:00Z",
  },
  {
    id: "fc-4",
    claim:
      "Audio de WhatsApp asegura que se abrió una grieta de 2km en el Ávila.",
    verdict: "false",
    explanation:
      "No hay reportes geológicos ni imágenes satelitales que confirmen este dato. FUNVISIS desmintió la información.",
    sourceUrl: "https://funvisis.gob.ve",
    sourceName: "FUNVISIS",
    checkedAt: "2026-06-26T19:00:00Z",
  },
  {
    id: "fc-5",
    claim:
      "Supuesto comunicado de USGS advierte sobre mega-terremoto inminente en Venezuela.",
    verdict: "false",
    explanation:
      "USGS no emite pronósticos de terremotos. El comunicado es un documento fabricado con errores de formato.",
    sourceUrl: "https://earthquake.usgs.gov",
    sourceName: "USGS",
    checkedAt: "2026-06-26T17:30:00Z",
  },
];

// ─── Seismic Activity Widget (External API – Mocked) ────────────────
export type SeismicEvent = {
  id: string;
  magnitude: number;
  depth: number; // km
  location: string;
  timestamp: string; // ISO 8601
  source: string;
};

export const seismicEvents: SeismicEvent[] = [
  {
    id: "se-1",
    magnitude: 4.2,
    depth: 10,
    location: "15km S de Caracas",
    timestamp: "2026-06-26T22:14:00Z",
    source: "FUNVISIS",
  },
  {
    id: "se-2",
    magnitude: 3.8,
    depth: 12,
    location: "8km SE de La Guaira",
    timestamp: "2026-06-26T19:45:00Z",
    source: "FUNVISIS",
  },
  {
    id: "se-3",
    magnitude: 5.1,
    depth: 8,
    location: "20km N de Caracas",
    timestamp: "2026-06-26T16:22:00Z",
    source: "FUNVISIS",
  },
  {
    id: "se-4",
    magnitude: 3.2,
    depth: 15,
    location: "12km E de Guarenas",
    timestamp: "2026-06-26T14:10:00Z",
    source: "FUNVISIS",
  },
  {
    id: "se-5",
    magnitude: 2.9,
    depth: 18,
    location: "25km O de Maracay",
    timestamp: "2026-06-26T11:33:00Z",
    source: "USGS",
  },
];

// ─── Aid Centers Widget (External API – Mocked) ─────────────────────
export type AidCenter = {
  id: string;
  name: string;
  type: "refugio" | "acopio" | "medico";
  address: string;
  state: string;
  needs: string[];
  lastUpdated: string; // ISO 8601
  active: boolean;
};

export const aidCenterTypeConfig: Record<
  AidCenter["type"],
  { label: string; className: string }
> = {
  refugio: {
    label: "Refugio",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  acopio: {
    label: "Centro de acopio",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  medico: {
    label: "Atención médica",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export const aidCenters: AidCenter[] = [
  {
    id: "ac-1",
    name: "Polideportivo José María Vargas",
    type: "refugio",
    address: "Av. Principal, La Guaira",
    state: "La Guaira",
    needs: ["colchonetas", "agua potable", "alimentos no perecederos"],
    lastUpdated: "2026-06-26T23:00:00Z",
    active: true,
  },
  {
    id: "ac-2",
    name: "Iglesia Santa Teresa",
    type: "acopio",
    address: "Esq. Santa Teresa, Caracas",
    state: "Distrito Capital",
    needs: ["medicinas", "ropa", "artículos de higiene"],
    lastUpdated: "2026-06-26T22:30:00Z",
    active: true,
  },
  {
    id: "ac-3",
    name: "Hospital Universitario de Caracas",
    type: "medico",
    address: "Ciudad Universitaria, Los Chaguaramos",
    state: "Distrito Capital",
    needs: ["sangre O+ y O-", "insumos quirúrgicos"],
    lastUpdated: "2026-06-26T22:00:00Z",
    active: true,
  },
  {
    id: "ac-4",
    name: "Estadio Brígido Iriarte",
    type: "refugio",
    address: "El Paraíso, Caracas",
    state: "Distrito Capital",
    needs: ["frazadas", "alimentos para bebés"],
    lastUpdated: "2026-06-26T21:00:00Z",
    active: true,
  },
  {
    id: "ac-5",
    name: "Liceo Andrés Bello",
    type: "acopio",
    address: "Calle Real de Maracay",
    state: "Aragua",
    needs: ["agua", "herramientas", "lonas"],
    lastUpdated: "2026-06-26T20:00:00Z",
    active: true,
  },
  {
    id: "ac-6",
    name: "Ambulatorio Los Flores",
    type: "medico",
    address: "Sector Los Flores, Catia La Mar",
    state: "La Guaira",
    needs: ["analgésicos", "vendas", "suero"],
    lastUpdated: "2026-06-26T19:00:00Z",
    active: true,
  },
];

// ─── Utility: Relative Time ─────────────────────────────────────────
export function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = Math.max(0, now - then);

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;

  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}
