/**
 * Datos del evento para buscadores y asistentes de IA. Una sola fuente para el sitemap, los metadatos y los datos
 * estructurados (schema.org). Si cambia una fecha o un organizador, cambiarlo aquí y en public/llms.txt.
 */
export const SITIO = "https://hackcis.lat";
export const NOMBRE = "HACK[CIS] UNI 2026";
export const TITULO = "HACK[CIS] UNI 2026 · The Agentic Era | Hackathon de IA en Perú";
export const DESCRIPCION =
  "Hackathon nacional de IA agéntica en Perú, organizada por IEEE CIS UNI y DSC UNI. Bootcamp virtual (23–27 nov), 100 horas de construcción y Gran Final en la UNI (5 dic 2026). Retos de Zeia, Manantial y Millennium.";

const ORGANIZADORES = [
  {
    "@type": "Organization", "@id": `${SITIO}/#ieee-cis-uni`, name: "IEEE CIS UNI",
    alternateName: "IEEE Computational Intelligence Society, capítulo de la Universidad Nacional de Ingeniería",
    sameAs: ["https://www.linkedin.com/company/ieee-cis-uni/", "https://www.instagram.com/ieeecisuni"],
  },
  { "@type": "Organization", "@id": `${SITIO}/#dsc-uni`, name: "DSC UNI", alternateName: "Developer Student Club de la Universidad Nacional de Ingeniería" },
];

const patrocina = (name: string, url: string) => ({ "@type": "Organization", name, url });

export const DATOS_ESTRUCTURADOS = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITIO}/#web`, url: `${SITIO}/`, name: NOMBRE, alternateName: ["HackCIS", "Hack CIS UNI", "hackcis.lat"], inLanguage: "es-PE" },
    ...ORGANIZADORES,
    {
      "@type": "Event", "@id": `${SITIO}/#hackathon`, name: `${NOMBRE} · The Agentic Era`, alternateName: ["HackCIS 2026", "Hack CIS UNI 2026"],
      description: DESCRIPCION, url: `${SITIO}/`, image: [`${SITIO}/opengraph-image.jpg`], inLanguage: "es-PE",
      startDate: "2026-11-28T00:00:00-05:00", endDate: "2026-12-05",
      eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
      location: [
        { "@type": "VirtualLocation", url: `${SITIO}/` },
        { "@type": "Place", name: "Auditorio FIIS, Universidad Nacional de Ingeniería", address: { "@type": "PostalAddress", addressLocality: "Lima", addressCountry: "PE" } },
      ],
      organizer: ORGANIZADORES.map((o) => ({ "@id": o["@id"] })),
      sponsor: [
        patrocina("Zeia", "https://zeia.com.pe/"), patrocina("Manantial", "https://manantial.pe/"), patrocina("Millennium", "https://millennium.ky/"),
        patrocina("Futura", "https://futuradata.pe/"), patrocina("ToDoStudents", "https://todostudents.com/"), patrocina("Sol AI", "https://www.buildsol.ai/"),
      ],
      subEvent: {
        "@type": "Event", name: `Bootcamp ${NOMBRE}`, startDate: "2026-11-23", endDate: "2026-11-27", url: `${SITIO}/bootcamp`,
        eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: { "@type": "VirtualLocation", url: `${SITIO}/bootcamp` }, isAccessibleForFree: true,
        organizer: ORGANIZADORES.map((o) => ({ "@id": o["@id"] })),
      },
    },
  ],
};

/** JSON para incrustar en una etiqueta <script type="application/ld+json">. */
export const jsonLd = (datos: unknown) => JSON.stringify(datos).replace(/</g, "\\u003c");
