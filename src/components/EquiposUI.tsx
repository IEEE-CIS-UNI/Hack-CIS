"use client";

/** Piezas compartidas de la plataforma de equipos: selector de habilidades y tarjeta de persona. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { HABILIDADES, etiquetaHabilidad, type PersonaBusca } from "@/lib/equipos";
import s from "./Equipos.module.css";

export function SelectorHabilidades({ valor, alCambiar, max = 5 }: { valor: string[]; alCambiar: (v: string[]) => void; max?: number }) {
  return (
    <div className={s.chips} role="group" aria-label="Habilidades">
      {HABILIDADES.map((h) => {
        const on = valor.includes(h.id);
        return (
          <button
            key={h.id} type="button" className={s.chip} aria-pressed={on}
            onClick={() => alCambiar(on ? valor.filter((x) => x !== h.id) : valor.length < max ? [...valor, h.id] : valor)}
          >
            {h.et}
          </button>
        );
      })}
    </div>
  );
}

export function Habilidades({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return <div className={s.chips} style={{ marginTop: 2 }}>{ids.map((h) => <span key={h} className={`${s.chip} ${s.fija}`}>{etiquetaHabilidad(h)}</span>)}</div>;
}

export const fechaLima = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Lima" });

export function Boton({ ocupado, alClick, children, solido = false, peligro = false, deshabilitado = false }: { ocupado?: boolean; alClick: () => void; children: React.ReactNode; solido?: boolean; peligro?: boolean; deshabilitado?: boolean }) {
  return (
    <button type="button" className={`more${solido ? " solid" : ""}${peligro ? ` ${s.peligro}` : ""}`} style={{ marginTop: 0 }} disabled={ocupado || deshabilitado} onClick={alClick}>
      {ocupado && <Loader2 className="size-4 animate-spin" aria-hidden />} {children}
    </button>
  );
}

export function TarjetaPersona({ p, acciones }: { p: PersonaBusca; acciones?: React.ReactNode }) {
  return (
    <article className={s.tarjeta}>
      <h3>{p.nombre}</h3>
      <p className="meta" style={{ fontSize: ".85rem", color: "var(--mist)" }}>
        {[p.universidad, p.carrera, p.ciclo ? `ciclo ${p.ciclo}` : null, p.nivel].filter(Boolean).join(" · ")}
      </p>
      <Habilidades ids={p.habilidades} />
      {p.frase && <p className={s.frase}>«{p.frase}»</p>}
      {acciones && <div className={s.acc}>{acciones}</div>}
    </article>
  );
}

/** Pantalla de «la plataforma se abre tal día»: la ve cualquiera, con o sin sesión, hasta que abra. */
export function Pronto({ abre, cierra, nota }: { abre: string; cierra: string; nota?: string }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const falta = Math.max(0, new Date(abre).getTime() - ahora);
  useEffect(() => {
    // Quien está esperando con la página abierta la ve abrirse sola. Solo si faltaba tiempo al mirar: así no se recarga en bucle.
    const ms = new Date(abre).getTime() - Date.now();
    if (ms <= 0 || ms > 86_400_000) return;
    const t = setTimeout(() => window.location.reload(), ms + 3000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, [abre]);
  const dias = Math.floor(falta / 86_400_000), horas = Math.floor((falta % 86_400_000) / 3_600_000), minutos = Math.floor((falta % 3_600_000) / 60_000);
  return (
    <div className={s.col}>
      <div className={s.pronto}>
        <p className={s.prontoK}>Se abre pronto</p>
        <p className={s.prontoFecha}>{fechaLima(abre)}</p>
        <p className={s.sub} style={{ marginTop: 6 }}>Hora de Lima. La plataforma está abierta hasta el {fechaLima(cierra)}</p>
        {falta > 0 && (
          <div className={s.cuenta} aria-label="Tiempo que falta para que abra">
            <div><b>{dias}</b><span>{dias === 1 ? "día" : "días"}</span></div>
            <div><b>{horas}</b><span>{horas === 1 ? "hora" : "horas"}</span></div>
            <div><b>{minutos}</b><span>min</span></div>
          </div>
        )}
        {nota && <p className={s.prontoNota}>{nota}</p>}
      </div>

      <div className="box">
        <p className="box-h">Cómo va a funcionar</p>
        <ol className={s.pasosEq}>
          <li><b>Confirma tu lugar en la hackathon.</b> Hace falta para formar equipo: toca «Confirmo que participaré» en tu panel o canjea tu código en el Discord.</li>
          <li><b>Completa tu perfil.</b> Tus habilidades y una frase para que otras personas te encuentren y te inviten.</li>
          <li><b>Crea tu equipo o únete a uno.</b> De 2 a 4 personas, de las carreras o facultades que quieran. Invita, pide unirte y coordínense por WhatsApp.</li>
        </ol>
        <p className={s.sub}><b style={{ color: "#fff" }}>Sin equipo no podrás enviar tu solución</b> ni competir. Todos los equipos construyen.</p>
        <div className="rg-actions">
          <Link href="/mi-inscripcion" className="more solid">Ir a mi panel <ArrowRight aria-hidden size={14} /></Link>
          <Link href="/bases" className="more">Leer las bases</Link>
        </div>
      </div>
    </div>
  );
}
