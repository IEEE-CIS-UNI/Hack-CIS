/** El reto completo de un sponsor, como sección de su página de track. Los colores salen de la página (--rc-*). */
import type { CSSProperties } from "react";
import { RETOS } from "@/lib/retos";
import DataTrack from "./DataTrack";
import s from "./RetoCompleto.module.css";

export default function RetoCompleto({ slug, acento, premio }: { slug: keyof typeof RETOS; acento: string; premio: string }) {
  const r = RETOS[slug];
  return (
    <div className={s.reto} style={{ "--rc": acento } as CSSProperties}>
      <p className={s.premio}>{premio}</p>
      <p className={s.destacado}>{r.destacado}</p>
      <div className={s.bloques}>
        {r.bloques.map((b) => (
          <section key={b.titulo} className={`${s.bloque}${slug === "fintech" || (b.lista?.length ?? 0) > 3 || (b.texto?.length ?? 0) > 260 ? ` ${s.ancho}` : ""}`}>
            <h3>{b.titulo}</h3>
            {b.texto && <p>{b.texto}</p>}
            {b.lista && <ul>{b.lista.map((x) => <li key={x}>{x}</li>)}</ul>}
          </section>
        ))}
      </div>
      <DataTrack slug={slug} />
      <a className={s.ir} href="#unete">Elegir este track</a>
    </div>
  );
}
