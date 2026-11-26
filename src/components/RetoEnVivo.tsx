"use client";

/**
 * La sección «El reto» de la página de cada sponsor. Mientras el track no abra muestra lo que reciba como contenido
 * («se presenta en vivo…»); al abrirse, la base entrega el reto y aparece solo, sin recargar (supabase/037).
 */
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { preguntarCada } from "@/lib/apertura";
import s from "./RetoEnVivo.module.css";

type Reto = { titulo: string | null; detalle: string | null; enlace: string | null };

export default function RetoEnVivo({ slug, sponsor, children }: { slug: string; sponsor: string; children: React.ReactNode }) {
  const [reto, setReto] = useState<Reto | null>(null);

  useEffect(() => {
    let vivo = true, t: ReturnType<typeof setTimeout>;
    const mirar = async () => {
      let hay = false;
      try {
        const { data } = await navegador().rpc("track_reto", { p_slug: slug });
        if (vivo && data) { setReto(data as Reto); hay = true; }
      } catch { /* se intenta en la siguiente vuelta */ }
      // alrededor de la presentación se pregunta seguido; una vez revelado, de vez en cuando por si se corrige
      if (vivo) t = setTimeout(mirar, hay ? 90_000 : preguntarCada("2026-11-27T23:59:00-05:00", Date.now()));
    };
    mirar();
    return () => { vivo = false; clearTimeout(t); };
  }, [slug]);

  if (!reto) return <>{children}</>;
  return (
    <div className={s.reto} aria-live="polite">
      <p className={s.k}>Reto revelado · {sponsor}</p>
      {reto.titulo && <h3 className={s.titulo}>{reto.titulo}</h3>}
      {reto.detalle && <p className={s.detalle}>{reto.detalle}</p>}
      {reto.enlace && <a className={s.enlace} href={reto.enlace} target="_blank" rel="noopener noreferrer">Ver el documento del reto <ExternalLink size={15} aria-hidden /></a>}
      <a className={s.ir} href="#unete">Elegir este track</a>
    </div>
  );
}
