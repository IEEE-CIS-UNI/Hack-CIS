import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import Sil from "./silhouettes";

/**
 * Hoy los tres tracks están por revelar: todavía no hay un sponsor confirmado
 * ni un reto cerrado. Cuando se anuncie uno, se publica su ficha en
 * /tracks/[slug] (ver app/tracks/[slug]/page.tsx) y se pone `revealed = true`
 * en la tabla `tracks`.
 */
const PRONTO = [
  { tone: "#8b5cf6", tone2: "#4d17c2" },
  { tone: "#22c7ee", tone2: "#0b7a96" },
  { tone: "#d946ef", tone2: "#8d1ba3" },
];

export function TrackList() {
  return (
    <div className="tk-list">
      {PRONTO.map((t, i) => (
        <article
          key={i}
          className="tk is-locked"
          style={{ "--tone": t.tone, "--tone2": t.tone2 } as CSSProperties}
        >
          <div className="tk-ic">
            <Lock aria-hidden strokeWidth={1.6} />
          </div>
          <div>
            <h3 className="tk-title">Por revelar</h3>
            <p className="tk-sub">Track por revelar</p>
            <p className="tk-desc">Muy pronto sabrás de qué va y quién lo presenta.</p>
          </div>
          <div className="tk-meta">
            <span style={{ width: 84, color: t.tone, opacity: 0.55 }}>
              <Sil kind="building" />
            </span>
            <span>
              <Lock size={12} aria-hidden style={{ verticalAlign: -1, marginRight: 4 }} />
              Sponsor por revelar
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Tracks() {
  return (
    <section id="tracks" className="pad">
      <div className="wrap">
        <span className="label">Tracks</span>
        <h2 className="h2">
          Elige tu <span className="lav">batalla</span>
        </h2>
        <p className="lead">
          Tres sponsors, tres retos reales, y todavía son un secreto. Cada sponsor presenta su reto al cierre del
          Bootcamp y tú decides en cuál competir.
        </p>

        <TrackList />

        <Link href="/tracks" className="more">
          Conoce más <ArrowRight aria-hidden size={14} />
        </Link>
      </div>
    </section>
  );
}
