import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cloud, Lock, Zap } from "lucide-react";
import Sil from "./silhouettes";

/**
 * Energía (Zeia) y Nube (Manantial) ya están revelados. El tercer track todavía no está
 * cerrado y sale como «por revelar» en vez de inventar un nombre. Cuando se anuncie
 * uno, se publica su ficha en /tracks/[slug] (ver app/tracks/[slug]/page.tsx) y se
 * pone `revealed = true` en la tabla `tracks`.
 */
export const ENERGIA = {
  sub: "IA & Energía",
  desc: "Zeia es una empresa peruana de monitoreo energético en tiempo real: sensores IoT y software que muestran dónde se va cada sol de energía. Su reto lo presentan en vivo al cierre del Bootcamp.",
  tone: "#38e5c4",
  tone2: "#0b8f7a",
  sponsor: { name: "Zeia", url: "https://zeia.com.pe/", logo: "/logos/zeia-blanco.png", width: 154, height: 50 },
};

export const NUBE = {
  sub: "IA & Nube",
  desc: "Manantial es una consultora peruana de tecnología, especialista en migración cloud, DevOps y ciberseguridad, partner de AWS, Google Cloud y Oracle. Su reto lo presentan en vivo al cierre del Bootcamp.",
  tone: "#ff6b6b",
  tone2: "#912b2b",
  sponsor: { name: "Manantial", url: "https://manantial.pe/", logo: "/logos/manantial.png", width: 640, height: 192 },
};

const PRONTO = [{ tone: "#8b5cf6", tone2: "#4d17c2" }];

export function TrackList() {
  return (
    <div className="tk-list">
      <article className="tk is-link" style={{ "--tone": ENERGIA.tone, "--tone2": ENERGIA.tone2 } as CSSProperties}>
        <div className="tk-ic">
          <Zap aria-hidden strokeWidth={1.6} />
        </div>
        <div>
          <span className="tk-badge">Track revelado</span>
          <h3 className="tk-title">Energía</h3>
          <p className="tk-sub">{ENERGIA.sub}</p>
          <p className="tk-desc">{ENERGIA.desc}</p>
        </div>
        <div className="tk-meta">
          <Link href="/tracks/energia" className="tk-more" aria-label="Conocer más sobre el track de Energía, con Zeia">
            Click aquí para conocer más <ArrowRight aria-hidden size={13} />
          </Link>
          <span className="tk-power">
            Powered by
            <Image src={ENERGIA.sponsor.logo} width={ENERGIA.sponsor.width} height={ENERGIA.sponsor.height} alt={ENERGIA.sponsor.name} unoptimized />
          </span>
        </div>
      </article>

      <article className="tk is-link" style={{ "--tone": NUBE.tone, "--tone2": NUBE.tone2 } as CSSProperties}>
        <div className="tk-ic">
          <Cloud aria-hidden strokeWidth={1.6} />
        </div>
        <div>
          <span className="tk-badge">Track revelado</span>
          <h3 className="tk-title">Nube</h3>
          <p className="tk-sub">{NUBE.sub}</p>
          <p className="tk-desc">{NUBE.desc}</p>
        </div>
        <div className="tk-meta">
          <Link href="/tracks/nube" className="tk-more" aria-label="Conocer más sobre el track de Nube, con Manantial">
            Click aquí para conocer más <ArrowRight aria-hidden size={13} />
          </Link>
          <span className="tk-power">
            Powered by
            <Image src={NUBE.sponsor.logo} width={NUBE.sponsor.width} height={NUBE.sponsor.height} alt={NUBE.sponsor.name} unoptimized />
          </span>
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
          Tres sponsors, tres retos reales. Ya conoces dos: Energía con Zeia y Nube con Manantial; el tercero todavía es un
          secreto. Cada sponsor presenta su reto al cierre del Bootcamp y tú decides en cuál competir.
        </p>

        <TrackList />

        <Link href="/tracks" className="more">
          Conoce más <ArrowRight aria-hidden size={14} />
        </Link>
      </div>
    </section>
  );
}
