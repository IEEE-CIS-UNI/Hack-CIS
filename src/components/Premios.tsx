import { Briefcase, GraduationCap, Shirt, Trophy } from "lucide-react";

const PREMIOS = [
  { icono: Trophy, tag: "Equipos ganadores", grande: "S/ 500", titulo: "Energía y Cloud", texto: "Para el equipo ganador de cada uno de estos dos tracks." },
  { icono: Briefcase, tag: "★ Track dorado", grande: "S/ 1 000", titulo: "Fintech · Millennium", texto: "Para el equipo ganador, más una carta oferta para cada integrante para entrar a trabajar en Millennium, con una entrevista de por medio.", dorado: true },
  { icono: GraduationCap, tag: "En vivo", grande: "Cursos", titulo: "Sorteo en vivo", texto: "Sorteamos cursos durante la semana y en la Gran Final." },
  { icono: Shirt, tag: "Para ti", grande: "Merch", titulo: "Sorteo de merch", texto: "También sorteamos merch durante el evento." },
];

/** Los premios confirmados. Los criterios, el jurado y los mentores se anuncian aparte. */
export default function Premios() {
  return (
    <section id="premios" className="pad">
      <div className="wrap">
        <span className="label">Premios</span>
        <h2 className="h2">
          Lo que
          <br />
          <span className="lav">te llevas</span>
        </h2>
        <p className="lead">
          Hay premios para los equipos ganadores y sorteos para animar la Gran Final. Los mini-retos también reparten
          premios entre todas las personas que asistan.
        </p>

        <div className="pr-grid cuatro">
          {PREMIOS.map((p) => (
            <article key={p.titulo} className={`pr${p.dorado ? " dorado" : ""}`}>
              <span className="pr-tag">{p.tag}</span>
              <div className="pr-big">{p.grande}</div>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </article>
          ))}
        </div>

        <p className="pr-nota">En la Gran Final, los sorteos son solo para quienes están en la sala.</p>
      </div>
    </section>
  );
}
