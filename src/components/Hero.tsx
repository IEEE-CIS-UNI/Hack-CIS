import Image from "next/image";
import AutoTyped from "./AutoTyped";
import Countdown from "./Countdown";

const MESSAGES = [
  "¡Algo grande se acerca!",
  "Cuatro humanos, un agente. Así se construye en la era agéntica.",
  "Solo 15 equipos construyen. ¡Prepárate en el Bootcamp!",
  "¡Inscripciones el 20/10!",
];

const ALLIES = ["IEEE SB UP", "IEEE SB UNI", "IEEE CIS", "DSC PUCP", "DSC UNI"];

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-top">
        <div className="allies" aria-label="Organizan y aliados (logos por confirmar)">
          {ALLIES.map((a) => (
            <span key={a}>Logo · {a}</span>
          ))}
        </div>

        <h1 className="title" aria-label="The Agentic Era">
          <span className="d the" aria-hidden>
            The
          </span>
          <span className="bk" aria-hidden>
            Agentic
          </span>
          <span className="d era" aria-hidden>
            Era
          </span>
        </h1>
        <p className="tagline">Preparados para el despegue…</p>

        <div className="cta-row">
          <a className="cta" href="/registro">
            Inscríbete →
          </a>
          <Countdown />
        </div>
      </div>

      <div className="scenewrap">
        <Image
          className="scene"
          src="/scene.webp"
          width={1190}
          height={607}
          priority
          unoptimized
          alt="Un cohete listo para despegar y el robot de CIS UNI gritando por un megáfono desde la luna"
        />
        <p className="bubble">
          <AutoTyped messages={MESSAGES} />
        </p>
      </div>
    </section>
  );
}
