import { ArrowUpRight } from "lucide-react";
import { LINKS } from "@/lib/config";
import Logos from "./Logos";

function Row({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={`marq ${reverse ? "rev" : ""}`} aria-hidden={reverse || undefined} aria-label={reverse ? undefined : "Sponsors por confirmar"}>
      <div>
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i}>Tu logo aquí</span>
        ))}
      </div>
    </div>
  );
}

export default function Sponsors() {
  return (
    <section id="sponsors" className="pad">
      <div className="wrap">
        <span className="label">Quiénes lo hacen posible</span>
        <h2 className="h2">
          Marcas que
          <br />
          <span className="lav">apuestan</span> por ti
        </h2>
        <div style={{ marginTop: 40 }}>
          <Logos size="lg" align="left" />
        </div>
        <p className="note">Organiza y comunidades aliadas · falta el logo de IEEE SB UP</p>
      </div>

      <Row />
      <Row reverse />

      <div className="wrap">
        <div className="cta2">
          <a href={LINKS.brochures}>
            <span>
              <h3>Sé sponsor</h3>
              <p>Patrocina un Track y ten tu stand en la mini-feria afuera del auditorio, el día de la Gran Final.</p>
            </span>
            <ArrowUpRight aria-hidden strokeWidth={1.6} />
          </a>
          <a href={LINKS.brochures}>
            <span>
              <h3>Sé mentor o jurado</h3>
              <p>No pedimos dinero: pedimos tu tiempo y tu criterio para guiar a los equipos y evaluar la final.</p>
            </span>
            <ArrowUpRight aria-hidden strokeWidth={1.6} />
          </a>
        </div>
      </div>
    </section>
  );
}
