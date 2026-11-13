import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, Handshake } from "lucide-react";
import { WA_MENTOR, WA_SPONSOR } from "@/lib/config";
import { APOYO_ROLES, SPONSOR_OFRECE } from "@/lib/contenido";
import { LOGOS } from "./Logos";

const [CIS, PUCP, DSC] = LOGOS;

function Logo({ l }: { l: (typeof LOGOS)[number] }) {
  return <Image src={l.src} width={l.width} height={l.height} alt={l.alt} className={l.cls} unoptimized />;
}

type Sponsor = {
  name: string;
  url: string;
  logo: { src: string; width: number; height: number };
  /** Para marcas cuyo logo es solo el ícono y el nombre va en texto. */
  text?: { name: string; sub?: string };
  /** Logo con nombre y lema apilados: necesita más altura para leerse. */
  tall?: boolean;
};

/**
 * Sponsors confirmados. Los logos son sus versiones en negativo (claras),
 * sin ficha de fondo, para que se vean sobre el fondo oscuro del sitio.
 */
const GENERALES: Sponsor[] = [
  {
    name: "Manantial",
    url: "https://manantial.pe/",
    logo: { src: "/logos/manantial.png", width: 640, height: 192 },
  },
  {
    name: "Futura",
    url: "https://futuradata.pe/",
    logo: { src: "/logos/futura.png", width: 340, height: 203 },
    tall: true,
  },
];

const APOYAN: Sponsor[] = [
  {
    name: "We Educación Ejecutiva",
    url: "https://www.we-educacion.com/",
    logo: { src: "/logos/we-educacion.png", width: 420, height: 181 },
  },
  {
    name: "MayuGo",
    url: "https://www.mayugo.net/",
    logo: { src: "/logos/mayugo.png", width: 144, height: 144 },
    text: { name: "MayuGo" },
  },
];

function Chip({ s }: { s: Sponsor }) {
  return (
    <a className={`sp-chip${s.tall ? " tall" : ""}`} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
      <Image
        src={s.logo.src}
        width={s.logo.width}
        height={s.logo.height}
        alt={s.text ? "" : s.name}
        className={s.text ? "sp-mark" : undefined}
        unoptimized
      />
      {s.text && (
        <span>
          <b>{s.text.name}</b>
          {s.text.sub && <small>{s.text.sub}</small>}
        </span>
      )}
    </a>
  );
}

/**
 * Niveles de logos: quienes organizan (las tres comunidades), los sponsors
 * del evento y quienes apoyan.
 */
export function Niveles() {
  return (
    <div className="sp-tiers">
      <div className="sp-tier org">
        <p className="note">Organizan</p>
        <div className="sp-logos">
          <Logo l={CIS} />
          <Logo l={PUCP} />
          <Logo l={DSC} />
        </div>
      </div>
      <div className="sp-tier gen">
        <p className="note">Sponsors del evento</p>
        <div className="sp-logos">
          {GENERALES.map((s) => (
            <Chip key={s.name} s={s} />
          ))}
        </div>
      </div>
      <div className="sp-tier sup">
        <p className="note">Con el apoyo de</p>
        <div className="sp-logos">
          {APOYAN.map((s) => (
            <Chip key={s.name} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Convocatoria() {
  return (
    <div className="sp-cards">
      <article className="sp-card">
        <Handshake aria-hidden strokeWidth={1.5} />
        <h3>Sé sponsor</h3>
        <p>Patrocina un track, plantea tu reto y conoce a quienes lo resuelven.</p>
        <ul>
          {SPONSOR_OFRECE.slice(0, 4).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <a href={WA_SPONSOR} target="_blank" rel="noopener noreferrer" className="more">
          Quiero ser sponsor <ArrowRight aria-hidden size={14} />
        </a>
      </article>

      <article className="sp-card">
        <GraduationCap aria-hidden strokeWidth={1.5} />
        <h3>Sé mentor o jurado</h3>
        <p>No pedimos dinero: pedimos tu tiempo y tu criterio.</p>
        <ul>
          {APOYO_ROLES.map((r) => (
            <li key={r.role}>
              <b>{r.role}.</b> {r.text}
            </li>
          ))}
        </ul>
        <a href={WA_MENTOR} target="_blank" rel="noopener noreferrer" className="more">
          Quiero ser mentor o jurado <ArrowRight aria-hidden size={14} />
        </a>
      </article>
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
        <Niveles />
        <Link href="/sponsors" className="more">
          Conoce más de ellos <ArrowRight aria-hidden size={14} />
        </Link>
        <Convocatoria />
      </div>
    </section>
  );
}
