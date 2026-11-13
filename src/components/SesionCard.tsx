import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { SESIONES } from "@/lib/contenido";
import { DATOS_SESION } from "@/lib/sesiones";

type Sesion = (typeof SESIONES)[number];

/** Tarjeta de una sesión en la grilla de /bootcamp. */
export default function SesionCard({ s }: { s: Sesion }) {
  const d = DATOS_SESION[s.n];
  const Icon = s.icon;
  return (
    <article className="sc" style={{ "--tone": d.tone, "--tone2": d.tone2 } as CSSProperties}>
      <i className="sc-corner a" aria-hidden />
      <i className="sc-corner b" aria-hidden />
      <span className="sc-wm" aria-hidden>
        {s.n}
      </span>
      <div className="sc-top">
        <span className="sc-id">
          Sesión {s.n} / {String(SESIONES.length).padStart(2, "0")}
        </span>
        <div className="sc-ic">
          <Icon aria-hidden strokeWidth={1.6} />
        </div>
      </div>
      <p className="sc-day">
        <CalendarDays size={13} aria-hidden />
        {d.fecha}
      </p>
      <h3 className="sc-title">{s.title}</h3>
      <p className="sc-desc">{d.resumen}</p>
      <div className="sc-meta">
        <span>Virtual</span>
        <span>Abierto a todos</span>
      </div>
      <Link href={`/bootcamp/${s.n}`} className="more solid sc-btn" aria-label={`Explorar sesión ${s.n} e inscribirme: ${s.title}`}>
        Explorar sesión e inscribirme <ArrowUpRight aria-hidden size={16} />
      </Link>
    </article>
  );
}
