import { EVENT } from "@/lib/config";

const ITEMS = [
  {
    q: "¿Quién puede participar?",
    a: "Estudiantes universitarios de la UNI, la PUCP y la Universidad del Pacífico, con carné o código de matrícula. Hay 250 cupos.",
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
    a: "El hackathon es en la 3.ª semana de noviembre. El Bootcamp es virtual la semana previa y la Gran Final es presencial en el Auditorio CTIC de la UNI.",
  },
  {
    q: "¿Cuándo abren las inscripciones?",
    a: `El ${EVENT.registrationOpensLabel}. Los cupos son limitados, así que entra a la comunidad para enterarte primero.`,
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
