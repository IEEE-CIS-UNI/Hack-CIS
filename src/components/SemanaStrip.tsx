import type { CSSProperties } from "react";
import Link from "next/link";
import { SESIONES } from "@/lib/contenido";
import { DATOS_SESION } from "@/lib/sesiones";

/** La semana del bootcamp de un vistazo: cinco días unidos por una línea, cada uno lleva a su sesión. */
export default function SemanaStrip() {
  return (
    <nav className="wk" aria-label="La semana del bootcamp">
      {SESIONES.map((s) => {
        const d = DATOS_SESION[s.n];
        const Icon = s.icon;
        return (
          <Link
            key={s.n}
            href={`/bootcamp/${s.n}`}
            className="wk-it"
            style={{ "--tone": d.tone } as CSSProperties}
            aria-label={`Sesión ${s.n}, ${d.fecha}: ${s.title}`}
          >
            <span className="wk-dot">
              <Icon aria-hidden strokeWidth={1.6} />
            </span>
            <span className="wk-n">{s.n}</span>
            <span className="wk-d">{d.fecha}</span>
          </Link>
        );
      })}
    </nav>
  );
}
