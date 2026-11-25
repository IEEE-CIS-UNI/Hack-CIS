import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, Handshake } from "lucide-react";
import { WA_MENTOR, WA_SPONSOR } from "@/lib/config";
import { APOYO_ROLES, SPONSOR_OFRECE } from "@/lib/contenido";
import { LOGOS } from "./Logos";
import SponsorMensaje from "./SponsorMensaje";
import { desde } from "@/lib/enlaces";

const [CIS, DSC] = LOGOS;

function Logo({ l }: { l: (typeof LOGOS)[number] }) {
  return <Image src={l.src} width={l.width} height={l.height} alt={l.alt} className={l.cls} unoptimized />;
}

type Sponsor = {
  name: string;
  /** Sin enlace, el logo se muestra sin link. */
  url?: string;
  logo: { src: string; width: number; height: number };
  /** Para marcas cuyo logo es solo el ícono y el nombre va en texto. */
  text?: { name: string; sub?: string };
  /** Logo con nombre y lema apilados: necesita más altura para leerse. */
  tall?: boolean;
  /** Logos apilados (ícono sobre el nombre): necesitan más altura para leerse igual que los demás. */
  grande?: boolean;
  /** Un globo de conversación sobre el logo: a qué viene este sponsor. */
  saludo?: { mensaje: string; color: string };
  /** Alto del logo con saludo (px, en computadora): menor que los de track; según lo compacto que sea cada logo. */
  alto?: number;
};

/**
 * Sponsors confirmados. Los logos son sus versiones en negativo (claras),
 * sin ficha de fondo, para que se vean sobre el fondo oscuro del sitio.
 */
const GENERALES: Sponsor[] = [
  {
    name: "Futura",
    url: desde("https://futuradata.pe/"),
    logo: { src: "/logos/futura.png", width: 340, height: 203 },
    tall: true,
    saludo: { mensaje: "¡Vengo con cursos y más!", color: "#5FD4FF" },
    alto: 64,
  },
  {
    name: "ToDoStudents",
    url: desde("https://todostudents.com/"),
    logo: { src: "/logos/todostudents-blanco.png", width: 640, height: 216 },
    tall: true,
    saludo: { mensaje: "¡Vengo con la merch y mucho más!", color: "#EF5F18" },
    alto: 48,
  },
  {
    name: "Sol AI",
    url: desde("https://www.buildsol.ai/"),
    logo: { src: "/logos/sol-ai-blanco.svg", width: 990, height: 465 },
    tall: true,
    saludo: { mensaje: "¡Vengo a hacer hablar a tu proyecto!", color: "#FFC93C" },
    alto: 64,
  },
];

const APOYAN: Sponsor[] = [
  {
    name: "We Educación Ejecutiva",
    url: desde("https://www.we-educacion.com/"),
    logo: { src: "/logos/we-educacion.png", width: 420, height: 181 },
  },
  {
    name: "MayuGo",
    url: desde("https://www.mayugo.net/"),
    logo: { src: "/logos/mayugo.png", width: 144, height: 144 },
    text: { name: "MayuGo" },
  },
  {
    name: "Datux Perú",
    url: desde("https://www.datuxonline.com/"),
    logo: { src: "/logos/datux.png", width: 640, height: 218 },
  },
  {
    name: "DSC PUCP",
    logo: { src: "/logos/dsc-pucp.webp", width: 852, height: 410 },
  },
];

/**
 * Sponsors de track: uno por track. Los tres están revelados: Energía (Zeia), Cloud (Manantial) y Fintech (Millennium).
 */
const DE_TRACK: Sponsor[] = [
  {
    name: "Zeia · Track Energía",
    url: desde("https://zeia.com.pe/"),
    logo: { src: "/logos/zeia-blanco.png", width: 154, height: 50 },
  },
  {
    name: "Manantial · Track Cloud",
    url: desde("https://manantial.pe/"),
    logo: { src: "/logos/manantial.png", width: 640, height: 192 },
  },
  {
    name: "Millennium · Track Fintech",
    url: desde("https://millennium.ky/"),
    logo: { src: "/logos/millennium-blanco.png", width: 640, height: 274 },
    grande: true,
  },
];

/** Comunidades aliadas que ayudan a difundir el evento. */
const DIFUSION: Sponsor[] = [
  {
    name: "START Perú",
    url: desde("https://www.startperu.org/"),
    logo: { src: "/logos/start-peru.svg", width: 1111, height: 286 },
  },
];

function Chip({ s }: { s: Sponsor }) {
  const Envoltura = s.url ? "a" : "div";
  const enlace = s.url ? { href: s.url, target: "_blank", rel: "noopener" } : {};
  return (
    <Envoltura className={`sp-chip${s.tall ? " tall" : ""}${s.grande ? " grande" : ""}`} aria-label={s.name} {...enlace}>
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
    </Envoltura>
  );
}

/**
 * Niveles de logos: quienes organizan (IEEE CIS UNI y DSC UNI), los sponsors de
 * track, los sponsors del evento, quienes apoyan y los aliados de difusión.
 */
export function Niveles() {
  return (
    <div className="sp-tiers">
      <div className="sp-tier org">
        <p className="note">Organizan</p>
        <div className="sp-logos">
          <Logo l={CIS} />
          <Logo l={DSC} />
        </div>
      </div>
      <div className="sp-tier trk">
        <p className="note">Sponsors de track</p>
        <div className="sp-logos">
          {DE_TRACK.map((s) => (
            <Chip key={s.name} s={s} />
          ))}
        </div>
      </div>
      <div className="sp-tier gen">
        <p className="note">Sponsors del evento</p>
        <div className="sp-logos">
          {GENERALES.map((s) =>
            s.saludo && s.url ? (
              <SponsorMensaje key={s.name} nombre={s.name} url={s.url} logo={s.logo} mensaje={s.saludo.mensaje} color={s.saludo.color} alto={s.alto} />
            ) : (
              <Chip key={s.name} s={s} />
            ),
          )}
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
      <div className="sp-tier dif">
        <p className="note">Aliados de difusión</p>
        <div className="sp-logos">
          {DIFUSION.map((s) => (
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
