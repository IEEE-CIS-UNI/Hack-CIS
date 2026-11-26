import { EVENT } from "@/lib/config";
import { jsonLd } from "@/lib/seo";

const ITEMS = [
  {
    q: "¿Qué es HACK[CIS] UNI 2026 y quién lo organiza?",
    a: "Es una hackathon nacional de IA agéntica en el Perú: The Agentic Era. La organizan IEEE CIS UNI y DSC UNI. Reúne un Bootcamp virtual, unas 100 horas de construcción y una Gran Final presencial en la UNI, en Lima.",
  },
  {
    q: "¿Quién puede participar?",
    a: "Estudiantes universitarios y de institutos de todo el país, con carné o código de matrícula. Hay 250 cupos y, al llenarse, una lista de espera de hasta 50 personas.",
  },
  {
    q: "¿Me inscribo solo o con mi equipo?",
    a: "Te inscribes solo. Armas tu equipo durante el Bootcamp: de 2 a 4 integrantes, de las carreras o facultades que quieran (nuevo: a pedido de ustedes, ya no es obligatorio que sean distintas).",
  },
  {
    q: "¿Qué pasa si no paso a finalista?",
    a: "Pasan 25 equipos al build: 5 de Energía, 5 de Cloud y 15 de Fintech, el track dorado. Al final hacen pitch 15 finalistas, 5 por track. Si no pasas, igual te llevas el Bootcamp: entrenamiento en prototipado rápido y pitch, además de la comunidad.",
  },
  {
    q: "¿Necesito experiencia con IA?",
    a: "No. En el Bootcamp te enseñamos a usar herramientas de IA gratuitas para estudiantes.",
  },
  {
    q: "¿De quién es la solución que construyo?",
    a: "La autoría es de tu equipo. Las soluciones quedan como repositorio open source con licencia MIT, a total disposición de los sponsors para pilotearlas sin comprarlas.",
  },
  {
    q: "¿Cuándo y dónde es?",
    a: "El Bootcamp es virtual, del 23 al 27 de noviembre. El hackathon va del 30 de noviembre al 5 de diciembre, y la Gran Final es presencial el sábado 5 en el Auditorio de la FIIS de la UNI.",
  },
  {
    q: "¿Cómo me inscribo?",
    a: `En hackcis.lat/registro; las inscripciones abrieron el ${EVENT.registrationOpensLabel}. El Bootcamp está abierto a todos; la hackathon tiene cupos limitados y lista de espera, y sus inscripciones cierran el miércoles 25 de noviembre a las 11:59 p. m.`,
  },
  {
    q: "¿Cuánto dura el build?",
    a: "Unas 100 horas, desde el lunes 30 de noviembre por la noche hasta la Gran Final del sábado 5 de diciembre. Solo construyen los 25 equipos que pasan.",
  },
  {
    q: "¿Cuáles son los tracks?",
    a: "Hay tres: IA & Energía, con Zeia como sponsor; IA & Cloud, con Manantial; e IA & Fintech, con Millennium, el track dorado. Cada sponsor presenta su reto el viernes 27 de noviembre a las 8:30 p. m.",
  },
  {
    q: "¿Y si no vivo en Lima?",
    a: "Puedes participar desde cualquier parte del país. La Gran Final es presencial en Lima, así que lo ideal es que tu equipo tenga al menos una persona que pueda asistir.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="pad">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: ITEMS.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) }) }} />
      <div className="wrap faq">
        <div>
          <span className="label">Dudas</span>
          <h2 className="h2">
            Preguntas
            <br />
            <span className="lav">frecuentes</span>
          </h2>
        </div>
        <div>
          {ITEMS.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
