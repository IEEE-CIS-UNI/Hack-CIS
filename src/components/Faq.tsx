import { Plus } from "lucide-react";
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
    <section id="faq" className="relative px-5 py-28 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="hud text-lavender">Dudas</p>
          <h2 className="display mt-4 text-[clamp(2.6rem,7vw,6rem)]">
            Preguntas
            <br />
            <span className="text-lavender">frecuentes</span>
          </h2>
        </div>
        <div className="border-t border-white/15">
          {ITEMS.map((item) => (
            <details key={item.q} className="group border-b border-white/15">
              <summary className="flex cursor-pointer items-center gap-4 py-6 sm:gap-6">
                <span className="flex-1 text-lg font-semibold transition-colors group-hover:text-lavender sm:text-xl">{item.q}</span>
                <Plus className="size-6 shrink-0 text-lavender transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="max-w-xl pr-10 pb-7 text-mist/80">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
