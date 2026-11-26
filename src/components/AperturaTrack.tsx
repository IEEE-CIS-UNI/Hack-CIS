"use client";

/**
 * Cuándo se abre la elección de track. La organización la lanza EN VIVO durante la presentación de sponsors: en la base,
 * `tracks.opens_at` queda en una hora de respaldo y, al lanzar, pasa a «dentro de unos minutos». Mientras no se lance se
 * explica cuándo será; una vez lanzada se muestra la cuenta regresiva. La base es la que manda: esto solo la refleja.
 */
import { useEffect, useRef, useState } from "react";
import { navegador } from "@/lib/supabase";
import { PRESENTACION, lanzada, preguntarCada } from "@/lib/apertura";
import s from "./AperturaTrack.module.css";

export default function AperturaTrack({ abre, alCambiar, nota = "El líder del equipo elige. Fintech tiene cupo limitado: por orden de llegada." }: { abre: string; alCambiar: (opensAt: string) => void; nota?: string }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const avisar = useRef(alCambiar);
  useEffect(() => { avisar.current = alCambiar; });
  const falta = Date.parse(abre) - ahora;
  const enCuenta = lanzada(abre, ahora);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Se pregunta a la base si ya se lanzó (o si cambió la hora). El desfase al azar evita que todos pregunten a la vez.
  useEffect(() => {
    let vivo = true, t: ReturnType<typeof setTimeout>;
    const preguntar = async () => {
      try {
        const { data } = await navegador().from("tracks").select("opens_at").eq("revealed", true).order("opens_at").limit(1).maybeSingle();
        const nueva = (data as { opens_at: string | null } | null)?.opens_at;
        if (vivo && nueva && Date.parse(nueva) !== Date.parse(abre)) avisar.current(nueva);
      } catch { /* se intenta en la siguiente vuelta */ }
      if (vivo) t = setTimeout(preguntar, preguntarCada(abre, Date.now()));
    };
    t = setTimeout(preguntar, preguntarCada(abre, Date.now()));
    return () => { vivo = false; clearTimeout(t); };
  }, [abre]);

  // Al llegar a cero se avisa para que aparezca el botón.
  const cumplida = falta <= 0;
  useEffect(() => { if (cumplida) avisar.current(abre); }, [cumplida, abre]);

  if (!enCuenta) {
    return (
      <div className={s.caja}>
        <p className={s.k}>Se abre en vivo</p>
        <p className={s.t}>La elección de track y los retos se activan <b>cuando los tres sponsors terminen sus pitches</b>, el {PRESENTACION} en adelante (hora de Lima).</p>
        <p className={s.n}>Deja esta página abierta: la cuenta regresiva aparecerá sola.</p>
      </div>
    );
  }
  const seg = Math.max(0, Math.ceil(falta / 1000));
  const mm = String(Math.floor(seg / 60)).padStart(2, "0"), ss = String(seg % 60).padStart(2, "0");
  return (
    <div className={`${s.caja} ${s.viva}`} role="timer" aria-label={`La elección de track se abre en ${Math.floor(seg / 60)} minutos y ${seg % 60} segundos`}>
      <p className={s.k}>La elección se abre en</p>
      <p className={s.reloj}>{mm}<i>:</i>{ss}</p>
      <p className={s.n}>{nota}</p>
    </div>
  );
}
