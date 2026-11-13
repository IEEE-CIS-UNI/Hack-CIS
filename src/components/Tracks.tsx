import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Zap } from "lucide-react";
import Sil from "./silhouettes";

/**
 * Energía es el único track revelado. Su sponsor todavía no está confirmado:
 * cuando lo esté, se agrega aquí `sponsor` con su logo y vuelve el «Powered by».
 */
export const ENERGIA = {
  icon: Zap,
  title: <>Energía</>,
  sub: "IA & Energía",
  desc: "Un reto real del sector energético, resuelto con un agente de IA como quinto miembro de tu equipo. Su sponsor se anuncia pronto.",
  tone: "#4de3ff",
  tone2: "#0b7a96",
  sponsor: null as null | { name: string; url: string; logo: string; width: number; height: number },
};

const PRONTO = [
  { tone: "#8b5cf6", tone2: "#4d17c2" },
  { tone: "#d946ef", tone2: "#8d1ba3" },
];

export function TrackList() {
  return (
    <div className="tk-list">
      <article className="tk" style={{ "--tone": ENERGIA.tone, "--tone2": ENERGIA.tone2 } as CSSProperties}>
        <div className="tk-ic">
          <ENERGIA.icon aria-hidden strokeWidth={1.6} />
        </div>
        <div>
          <span className="tk-badge">Track revelado</span>
          <h3 className="tk-title">{ENERGIA.title}</h3>
          <p className="tk-sub">{ENERGIA.sub}</p>
          <p className="tk-desc">{ENERGIA.desc}</p>
        </div>
        <div className="tk-meta">
          <Link href="/tracks/energia" className="more" style={{ marginTop: 0, padding: "9px 18px" }}>
            Ver el reto <ArrowRight aria-hidden size={14} />
          </Link>
          {ENERGIA.sponsor ? (
            <a
              className="tk-power"
              href={ENERGIA.sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Powered by ${ENERGIA.sponsor.name}`}
            >
              Powered by
              <Image
                src={ENERGIA.sponsor.logo}
                width={ENERGIA.sponsor.width}
                height={ENERGIA.sponsor.height}
                alt={ENERGIA.sponsor.name}
                unoptimized
              />
            </a>
          ) : (
            <span>
              <Lock size={12} aria-hidden style={{ verticalAlign: -1, marginRight: 4 }} />
              Sponsor por revelar
            </span>
          )}
        </div>
      </article>

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
            <h3 className="tk-title">Pronto</h3>
            <p className="tk-sub">Track por revelar</p>
            <p className="tk-desc">Muy pronto sabrás de qué va.</p>
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
          Tres sponsors, tres retos reales. Ya conoces el primero; los otros dos se revelan pronto. Cada sponsor
          presenta su reto al cierre del Bootcamp y tú decides en cuál competir.
        </p>

        <TrackList />

        <Link href="/tracks" className="more">
          Conoce más <ArrowRight aria-hidden size={14} />
        </Link>
      </div>
    </section>
  );
}
