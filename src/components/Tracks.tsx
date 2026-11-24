import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cloud, Landmark, Zap } from "lucide-react";

/**
 * Los tres tracks están revelados: Energía (Zeia), Cloud (Manantial) y Fintech (Millennium). Cada ficha vive en
 * /tracks/[slug] (ver app/tracks/[slug]/page.tsx) y su fila en la tabla `tracks` tiene `revealed = true`.
 */
export const ENERGIA = {
  sub: "IA & Energía",
  desc: "Zeia es una empresa peruana de monitoreo energético en tiempo real: sensores IoT y software que muestran dónde se va cada sol de energía. Su reto lo presentan en vivo al cierre del Bootcamp.",
  tone: "#38e5c4",
  tone2: "#0b8f7a",
  sponsor: { name: "Zeia", url: "https://zeia.com.pe/", logo: "/logos/zeia-blanco.png", width: 154, height: 50 },
};

export const CLOUD = {
  sub: "IA & Cloud",
  desc: "Manantial es una consultora peruana de tecnología, especialista en migración cloud, DevOps y ciberseguridad, partner de AWS, Google Cloud y Oracle. Su reto lo presentan en vivo al cierre del Bootcamp.",
  tone: "#ff6b6b",
  tone2: "#912b2b",
  sponsor: { name: "Manantial", url: "https://manantial.pe/", logo: "/logos/manantial.png", width: 640, height: 192 },
};

export const FINTECH = {
  sub: "IA & Fintech",
  desc: "Millennium es un grupo peruano de finanzas con foco en la inclusión financiera impulsada por IA, con las marcas Lima Bikes y Lizzo. Su reto lo presentan en vivo al cierre del Bootcamp. El equipo ganador se lleva S/ 1 000 y cada integrante, una carta oferta para trabajar en Millennium.",
  tone: "#ffc93c",
  tone2: "#b8860b",
  sponsor: { name: "Millennium", url: "https://millennium.ky/", logo: "/logos/millennium-blanco.png", width: 640, height: 274 },
};

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

      <article className="tk is-link" style={{ "--tone": CLOUD.tone, "--tone2": CLOUD.tone2 } as CSSProperties}>
        <div className="tk-ic">
          <Cloud aria-hidden strokeWidth={1.6} />
        </div>
        <div>
          <span className="tk-badge">Track revelado</span>
          <h3 className="tk-title">Cloud</h3>
          <p className="tk-sub">{CLOUD.sub}</p>
          <p className="tk-desc">{CLOUD.desc}</p>
        </div>
        <div className="tk-meta">
          <Link href="/tracks/cloud" className="tk-more" aria-label="Conocer más sobre el track de Cloud, con Manantial">
            Click aquí para conocer más <ArrowRight aria-hidden size={13} />
          </Link>
          <span className="tk-power">
            Powered by
            <Image src={CLOUD.sponsor.logo} width={CLOUD.sponsor.width} height={CLOUD.sponsor.height} alt={CLOUD.sponsor.name} unoptimized />
          </span>
        </div>
      </article>

      <article className="tk is-link is-gold" style={{ "--tone": FINTECH.tone, "--tone2": FINTECH.tone2 } as CSSProperties}>
        <div className="tk-ic">
          <Landmark aria-hidden strokeWidth={1.6} />
        </div>
        <div>
          <span className="tk-badge">★ Track dorado</span>
          <h3 className="tk-title">Fintech</h3>
          <p className="tk-sub">{FINTECH.sub}</p>
          <p className="tk-desc">{FINTECH.desc}</p>
        </div>
        <div className="tk-meta">
          <Link href="/tracks/fintech" className="tk-more" aria-label="Conocer más sobre el track de Fintech, con Millennium">
            Click aquí para conocer más <ArrowRight aria-hidden size={13} />
          </Link>
          <span className="tk-power">
            Powered by
            <Image src={FINTECH.sponsor.logo} width={FINTECH.sponsor.width} height={FINTECH.sponsor.height} alt={FINTECH.sponsor.name} unoptimized />
          </span>
        </div>
      </article>
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
          Tres sponsors, tres retos reales: Energía con Zeia, Cloud con Manantial y Fintech con Millennium, el track dorado. Cada sponsor
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
