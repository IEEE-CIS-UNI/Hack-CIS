import { EVENT } from "@/lib/config";

const ITEMS = [
  {
    q: "¿Quién puede participar?",
    a: "Estudiantes universitarios y de institutos de todo el país, con carné o código de matrícula. Hay 250 cupos.",
  },
  {
    q: "¿Me inscribo solo o con mi equipo?",
    a: "Te inscribes solo. Armas tu equipo durante el Bootcamp: de 2 a 4 integrantes, de al menos 2 carreras o facultades distintas.",
  },
  {
    q: "¿Qué pasa si no paso a finalista?",
    a: "Pasan 15 equipos al build. Si no pasas, igual te llevas el Bootcamp: entrenamiento en prototipado rápido y pitch, además de la comunidad.",
  },
  {
    q: "¿Necesito experiencia con IA?",
    a: "No. En el Bootcamp te enseñamos a usar herramientas de IA gratuitas para estudiantes.",
  },
  {
    q: "¿De quién es la solución que construyo?",
    a: "De tu equipo. Los sponsors reciben solo una licencia no exclusiva para evaluar y pilotear la solución ganadora de su Track.",
  },
  {
    q: "¿Cuándo y dónde es?",
    a: "El Bootcamp es virtual, del 23 al 27 de noviembre. El hackathon va del 30 de noviembre al 5 de diciembre, y la Gran Final es presencial el sábado 5 en el Auditorio CTIC de la UNI.",
  },
  {
    q: "¿Cuándo abren las inscripciones?",
    a: `El ${EVENT.registrationOpensLabel}. Los cupos son limitados, así que entra a la comunidad para enterarte primero.`,
  },
  {
    q: "¿Cuánto dura el build?",
    a: "Unas 100 horas, desde el lunes 30 de noviembre por la noche hasta la Gran Final del sábado 5 de diciembre. Solo construyen los 15 equipos finalistas.",
  },
  {
    q: "¿Cuáles son los tracks?",
    a: "Todavía son un secreto: los tres tracks y sus sponsors se revelan muy pronto. Cada sponsor presenta su reto al cierre del Bootcamp, el 27 de noviembre.",
  },
  {
    q: "¿Y si no vivo en Lima?",
    a: "Puedes participar desde cualquier parte del país. La Gran Final es presencial en Lima, así que lo ideal es que tu equipo tenga al menos una persona que pueda asistir.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="pad">
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
