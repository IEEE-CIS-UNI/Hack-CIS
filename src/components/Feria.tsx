import { Building2, Handshake, Users } from "lucide-react";

const PUNTOS = [
  {
    icono: Building2,
    titulo: "Conoce a las empresas aliadas",
    texto: "Descubre qué hacen, en qué problemas trabajan y cómo usan la IA en su día a día.",
  },
  {
    icono: Handshake,
    titulo: "Conversa sobre oportunidades laborales",
    texto: "Habla directo con sus equipos sobre prácticas, empleo y cómo entrar a su industria.",
  },
  {
    icono: Users,
    titulo: "Conecta con expertos del rubro",
    texto: "Haz preguntas, pide consejos y suma contactos de especialistas del sector.",
  },
];

/** La feria de stands de la Gran Final (sábado 5 de diciembre, Auditorio FIIS, UNI). */
export default function Feria() {
  return (
    <section id="feria" className="pad">
      <div className="wrap">
        <span className="label">La feria</span>
        <h2 className="h2">
          Feria de
          <br />
          <span className="lav">stands</span>
        </h2>
        <p className="lead">
          El día de la Gran Final, afuera del auditorio, se arma una feria con las empresas aliadas: el espacio para
          conocerlas de cerca, conversar y llevarte contactos para tu carrera. Está abierta a todas las personas que asistan.
        </p>

        <div className="pr-grid">
          {PUNTOS.map((p) => (
            <article key={p.titulo} className="pr">
              <div className="pr-ic"><p.icono aria-hidden strokeWidth={1.6} /></div>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </article>
          ))}
        </div>

        <p className="pr-nota">
          Sábado 5 de diciembre · Auditorio FIIS, UNI. Recibes tu <b>pasaporte de stands</b> al registrarte, desde las 9:00 a. m.
        </p>
      </div>
    </section>
  );
}
