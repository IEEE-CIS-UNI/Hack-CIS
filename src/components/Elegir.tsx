"use client";

/**
 * /elige: quien ganó un sorteo escribe su correo de inscripción y elige su beca (una sola vez). Los cupos se actualizan
 * solos; quien no ganó no ve nada. Las reglas viven en la base (supabase/036).
 */
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";
import s from "./Elegir.module.css";

type Estado = { nombre: string; curso: string | null; cursos: { nombre: string; quedan: number }[] };

const ERRORES: Record<string, string> = {
  no_ganador: "Ese correo no figura entre los ganadores. Usa el correo con el que te inscribiste (al que te escribimos).",
  ya_elegiste: "Ya elegiste tu beca.",
  curso_agotado: "Ese curso se acaba de agotar. Elige otro.",
  curso_invalido: "Ese curso no está disponible.",
};
const motivo = (m: string) => { const k = Object.keys(ERRORES).find((x) => m.includes(x)); return k ? ERRORES[k] : "No pudimos completar la acción. Inténtalo de nuevo."; };

export default function Elegir() {
  const [correo, setCorreo] = useState("");
  const [de, setDe] = useState<string | null>(null);   // correo ya validado
  const [e, setE] = useState<Estado | null>(null);
  const [marcado, setMarcado] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const consultar = useCallback(async (c: string) => {
    const { data, error: err } = await navegador().rpc("elige_estado", { p_correo: c });
    if (err) return motivo(err.message);
    setE(data as Estado);
    return "";
  }, []);

  // Los cupos cambian mientras otros eligen: se refrescan cada 8 s hasta que elijas.
  useEffect(() => {
    if (!de || e?.curso) return;
    const t = setInterval(() => { consultar(de).catch(() => {}); }, 8000);
    return () => clearInterval(t);
  }, [de, e?.curso, consultar]);

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault(); setOcupado(true); setError("");
    const m = await consultar(correo.trim()).catch(() => "No pudimos conectarnos. Inténtalo de nuevo.");
    setOcupado(false);
    if (m) setError(m); else setDe(correo.trim());
  }

  async function elegir() {
    if (!de || !marcado || !window.confirm(`¿Confirmas «${marcado}»? Se elige una sola vez.`)) return;
    setOcupado(true); setError("");
    const { data, error: err } = await navegador().rpc("elige_curso", { p_correo: de, p_curso: marcado });
    setOcupado(false);
    if (err) { setError(motivo(err.message)); setMarcado(""); await consultar(de); return; }
    setE(data as Estado);
  }

  if (!e || !de) {
    return (
      <form className="box" style={{ marginTop: 26 }} onSubmit={entrar}>
        <p className="box-h">¿Ganaste? Entra con tu correo</p>
        <p className={s.sub}>Escribe el correo con el que te inscribiste al bootcamp.</p>
        <label className={s.etiqueta} htmlFor="el-correo">Tu correo</label>
        <input id="el-correo" type="email" required className="rg-input" value={correo} onChange={(ev) => setCorreo(ev.target.value)} placeholder="tu@correo.com" autoComplete="email" />
        <div className="rg-actions"><button type="submit" className="more solid" disabled={ocupado}>{ocupado && <Loader2 className="size-4 animate-spin" aria-hidden />} Ver los cursos</button></div>
        {error && <p className="rg-msg err" role="alert">{error}</p>}
      </form>
    );
  }

  if (e.curso) {
    return (
      <div className="box" style={{ marginTop: 26 }}>
        <p className="box-h">¡Listo, {e.nombre}!</p>
        <p className={s.elegido}><Check size={22} aria-hidden /> {e.curso}</p>
        <p className={s.sub}>Tu elección quedó registrada. Te escribiremos para darte acceso al curso.</p>
      </div>
    );
  }

  return (
    <div className="box" style={{ marginTop: 26 }}>
      <p className="box-h">¡Felicitaciones, {e.nombre}!</p>
      <p className={s.sub}>Elige un curso. Quien elige primero, escoge primero: los cupos se actualizan solos.</p>
      <div className={s.lista} role="radiogroup" aria-label="Cursos disponibles">
        {e.cursos.map((c) => (
          <label key={c.nombre} className={`${s.curso} ${c.quedan === 0 ? s.agotado : ""} ${marcado === c.nombre ? s.marcado : ""}`}>
            <input type="radio" name="curso" value={c.nombre} checked={marcado === c.nombre} disabled={c.quedan === 0} onChange={() => setMarcado(c.nombre)} />
            <span><b>{c.nombre}</b><small>{c.quedan === 0 ? "Agotado" : c.quedan === 1 ? "Queda 1 cupo" : `Quedan ${c.quedan} cupos`}</small></span>
          </label>
        ))}
      </div>
      {error && <p className="rg-msg err" role="alert">{error}</p>}
      <div className="rg-actions"><button type="button" className="more solid" disabled={ocupado || !marcado || !e.cursos.some((c) => c.nombre === marcado && c.quedan > 0)} onClick={elegir}>{ocupado && <Loader2 className="size-4 animate-spin" aria-hidden />} Confirmar mi beca</button></div>
    </div>
  );
}
