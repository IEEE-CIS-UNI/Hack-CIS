"use client";

/**
 * Cuántos equipos van en este track, en grande y para cualquiera que mire (con o sin sesión). Aparece cuando la elección
 * está abierta o ya cerró, y se actualiza solo.
 */
import { useEffect, useState } from "react";
import { navegador } from "@/lib/supabase";
import { preguntarCada } from "@/lib/apertura";
import { llamar } from "@/lib/equipos";
import s from "./ContadorTrack.module.css";

type Cupo = { slug: string; tope: number | null; ocupados: number };

export default function ContadorTrack({ slug }: { slug: string }) {
  const [cupo, setCupo] = useState<Cupo | null>(null);

  useEffect(() => {
    let vivo = true, t: ReturnType<typeof setTimeout>;
    const mirar = async () => {
      let espera = 60_000;
      try {
        const { data } = await navegador().from("tracks").select("opens_at").eq("slug", slug).maybeSingle();
        const abre = (data as { opens_at: string | null } | null)?.opens_at;
        if (abre && Date.now() >= Date.parse(abre)) {
          const c = await llamar<Cupo[]>("track_cupos");
          if (vivo && c.ok) setCupo(c.data.find((x) => x.slug === slug) ?? null);
          espera = 5_000 + Math.random() * 2_000;
        } else {
          if (vivo) setCupo(null);
          if (abre) espera = Math.max(1_000, Math.min(preguntarCada(abre, Date.now()), Date.parse(abre) - Date.now() + 1_500));
        }
      } catch { /* se intenta en la siguiente vuelta */ }
      if (vivo) t = setTimeout(mirar, espera);
    };
    mirar();
    return () => { vivo = false; clearTimeout(t); };
  }, [slug]);

  if (!cupo) return null;
  const lleno = cupo.tope !== null && cupo.ocupados >= cupo.tope;
  return (
    <div className={s.contador} role="status" aria-live="polite">
      <p className={s.k}><i aria-hidden /> En vivo</p>
      <p className={s.n}>{cupo.ocupados}{cupo.tope !== null && <small> / {cupo.tope}</small>}</p>
      <p className={s.t}>
        {cupo.ocupados === 1 && cupo.tope === null ? "equipo ya va en este track" : "equipos ya van en este track"}
        {cupo.tope !== null && <><br /><b>{lleno ? "Track lleno" : `Quedan ${cupo.tope - cupo.ocupados} lugares`}</b></>}
      </p>
      {cupo.tope !== null && <div className={s.barra} aria-hidden><span style={{ width: `${Math.min(100, (cupo.ocupados / cupo.tope) * 100)}%` }} /></div>}
    </div>
  );
}
