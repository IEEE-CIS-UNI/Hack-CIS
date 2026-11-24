"use client";

/**
 * /sorteo: sorteo en vivo del bootcamp.
 *
 * Quien participa solo pone su correo de inscripción (una vez). El moderador entra con la cuenta de CIS, abre el registro y
 * gira la ruleta. El ganador lo decide la base de datos; aquí solo se anima la ruleta hasta su casilla.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Lock, Trophy } from "lucide-react";
import { navegador } from "@/lib/supabase";
import s from "./Sorteo.module.css";

type Estado = { control_ok: boolean; abierto: boolean; premios: number; titulo: string; admin: boolean; participantes: number; ganadores: string[]; ruleta: string[] | null };
type Contacto = { orden: number; nombre: string; correo: string; celular: string | null };

const ERRORES: Record<string, string> = {
  sorteo_cerrado: "El sorteo todavía no está abierto. Se abre al final de la sesión.",
  correo_invalido: "Revisa el correo: parece que le falta algo.",
  no_inscrito: "Ese correo no está inscrito en el bootcamp. Usa el correo con el que te registraste en la web.",
  ya_participa: "Ese correo ya está participando. ¡Mucha suerte!",
  no_admin: "Esta cuenta no puede moderar el sorteo.",
  control_perdido: "Otra sesión de moderación tomó el control. Esta quedó en solo lectura: usa «Tomar el control» si quieres volver a moderar desde aquí.",
  sorteo_completo: "Ya salieron todos los ganadores.",
  sin_participantes: "No quedan participantes en la ruleta.",
};
const CURSOS = ["Desarrollo Web", "UX/UI", "IA aplicada", "Metodologías Ágiles", "Desarrollo y programación"];
const CLAVE = "sorteo-control";
const llave = () => { try { return sessionStorage.getItem(CLAVE); } catch { return null; } };
const guardarLlave = (v: string | null) => { try { if (v) sessionStorage.setItem(CLAVE, v); else sessionStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ } };
const motivo = (m: string) => { const k = Object.keys(ERRORES).find((x) => m.includes(x)); return k ? ERRORES[k] : "No pudimos completar la acción. Inténtalo de nuevo."; };

function Ruleta({ nombres, rot, ganador }: { nombres: string[]; rot: number; ganador: number | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fuentes, setFuentes] = useState(0);
  useEffect(() => { document.fonts?.ready.then(() => setFuentes(1)).catch(() => {}); }, []);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), L = 640;
    c.width = L * dpr; c.height = L * dpr;
    const g = c.getContext("2d"); if (!g) return;
    const tech = getComputedStyle(c).fontFamily || "sans-serif";
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, L, L);
    const M = L / 2, R = M - 14, Rw = R - 30, n = Math.max(nombres.length, 1), a = (2 * Math.PI) / n;

    // halo y anillos fijos
    const halo = g.createRadialGradient(M, M, Rw * 0.6, M, M, R + 12);
    halo.addColorStop(0, "rgba(122,44,245,0)"); halo.addColorStop(1, "rgba(122,44,245,.45)");
    g.fillStyle = halo; g.beginPath(); g.arc(M, M, R + 12, 0, 2 * Math.PI); g.fill();
    g.save(); g.shadowColor = "rgba(182,156,255,.9)"; g.shadowBlur = 22; g.strokeStyle = "#b69cff"; g.lineWidth = 3;
    g.beginPath(); g.arc(M, M, R, 0, 2 * Math.PI); g.stroke(); g.restore();
    g.strokeStyle = "rgba(182,156,255,.35)"; g.lineWidth = 1; g.beginPath(); g.arc(M, M, Rw + 4, 0, 2 * Math.PI); g.stroke();

    // marcas del borde (giran con la rueda)
    g.save(); g.translate(M, M); g.rotate(rot);
    for (let d = 0; d < 120; d++) {
      const ang = (d / 120) * 2 * Math.PI, largo = d % 5 === 0 ? 14 : 6;
      g.strokeStyle = d % 5 === 0 ? "rgba(255,255,255,.8)" : "rgba(182,156,255,.45)"; g.lineWidth = d % 5 === 0 ? 2 : 1;
      g.beginPath(); g.moveTo(Math.cos(ang) * (R - 6), Math.sin(ang) * (R - 6)); g.lineTo(Math.cos(ang) * (R - 6 - largo), Math.sin(ang) * (R - 6 - largo)); g.stroke();
    }
    g.restore();

    // casillas
    g.save(); g.translate(M, M); g.rotate(rot - Math.PI / 2);
    for (let i = 0; i < n; i++) {
      const win = ganador === i;
      // con muchas casillas, color plano: 250 degradados por cuadro harían tropezar la animación en equipos modestos
      let f: string | CanvasGradient;
      if (n > 40) f = win ? "#ffffff" : i % 2 ? "#3a1688" : "#1d0b42";
      else {
        const gr = g.createRadialGradient(0, 0, 40, 0, 0, Rw);
        if (win) { gr.addColorStop(0, "#b69cff"); gr.addColorStop(1, "#ffffff"); }
        else if (i % 2) { gr.addColorStop(0, "#1a0a38"); gr.addColorStop(1, "#4a1fa8"); }
        else { gr.addColorStop(0, "#10051f"); gr.addColorStop(1, "#2a1163"); }
        f = gr;
      }
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, Rw, i * a, (i + 1) * a); g.closePath(); g.fillStyle = nombres.length ? f : "#1a0a38"; g.fill();
      if (n <= 90) { g.strokeStyle = "rgba(182,156,255,.38)"; g.lineWidth = 1; g.stroke(); }
      if (n <= 40 && nombres[i]) {
        g.save(); g.rotate((i + 0.5) * a); g.fillStyle = win ? "#12071f" : "#f1eaff"; g.textAlign = "right"; g.textBaseline = "middle";
        g.font = `${win ? 700 : 400} ${n > 24 ? 10 : n > 14 ? 12 : 14}px ${tech}`;
        g.fillText(nombres[i].toUpperCase(), Rw - 18, 0); g.restore();
      }
    }
    g.restore();

    // centro
    g.save(); g.shadowColor = "rgba(122,44,245,.9)"; g.shadowBlur = 24;
    g.beginPath(); g.arc(M, M, 62, 0, 2 * Math.PI); g.fillStyle = "#0a0414"; g.fill(); g.restore();
    g.strokeStyle = "#b69cff"; g.lineWidth = 2; g.beginPath(); g.arc(M, M, 62, 0, 2 * Math.PI); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.beginPath(); g.arc(M, M, 52, 0, 2 * Math.PI); g.stroke();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `400 15px ${tech}`; g.fillText("HACK", M, M - 8);
    g.fillStyle = "#b69cff"; g.font = `400 13px ${tech}`; g.fillText("[CIS]", M, M + 11);
  }, [nombres, rot, ganador, fuentes]);
  return <canvas ref={ref} className={s.canvas} aria-label="Ruleta del sorteo" />;
}

export default function Sorteo() {
  const [e, setE] = useState<Estado | null>(null);
  const [correo, setCorreo] = useState("");
  const [msg, setMsg] = useState<{ t: "ok" | "err"; x: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mod, setMod] = useState(false);
  const [mCorreo, setMCorreo] = useState(""); const [mClave, setMClave] = useState("");
  const [rot, setRot] = useState(0);
  const [girando, setGirando] = useState(false);
  const [premio, setPremio] = useState<string | null>(null);
  const [contactos, setContactos] = useState<Contacto[] | null>(null);
  const [vista, setVista] = useState<string[] | null>(null);
  const [ganIdx, setGanIdx] = useState<number | null>(null);
  const pausa = useRef(false);

  const cargar = useCallback(async () => {
    if (pausa.current) return;
    try {
      const { data, error } = await navegador().rpc("sorteo_estado", { p_control: llave() });
      if (!error && data && !pausa.current) setE(data as Estado);
    } catch { /* se reintenta en el siguiente ciclo */ }
  }, []);

  useEffect(() => {
    // Primera lectura y refresco cada 3 s: quienes miran ven abrir, cerrar y salir a los ganadores.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    const t = setInterval(cargar, 3000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    // Quien ya tiene sesión no tiene que escribir su correo.
    navegador().auth.getSession().then(({ data }) => {
      const m = data.session?.user.email;
      if (m && !/uni\.edu\.pe$/i.test(m)) setCorreo((c) => c || m);
    }).catch(() => {});
  }, []);

  async function participar(ev: React.FormEvent) {
    ev.preventDefault(); setOcupado(true); setMsg(null);
    const { data, error } = await navegador().rpc("sorteo_participar", { p_correo: correo });
    setOcupado(false);
    if (error) { setMsg({ t: "err", x: motivo(error.message) }); await cargar(); return; }
    setMsg({ t: "ok", x: `¡Listo, ${(data as { nombre: string }).nombre}! Ya estás participando. Quédate hasta el final.` });
    await cargar();
  }

  async function entrarMod(ev: React.FormEvent) {
    ev.preventDefault(); setOcupado(true); setMsg(null);
    const { error } = await navegador().auth.signInWithPassword({ email: mCorreo.trim(), password: mClave });
    setOcupado(false);
    if (error) { setMsg({ t: "err", x: "Correo o contraseña incorrectos." }); return; }
    setMClave(""); await tomarControl(); await cargar();
  }

  // Quien toma el control invalida la llave de cualquier otra sesión de moderación (solo hay una a la vez).
  async function tomarControl() {
    const { data, error } = await navegador().rpc("sorteo_tomar_control");
    if (error) { setMsg({ t: "err", x: motivo(error.message) }); return; }
    guardarLlave(data as string); setMsg(null); await cargar();
  }

  async function salir() {
    guardarLlave(null); setPremio(null); setContactos(null); setVista(null); setGanIdx(null); setRot(0); setMsg(null); setMod(false);
    try { await navegador().auth.signOut(); } catch { /* aunque falle, la llave ya no existe */ }
    await cargar();
  }

  async function abrir(v: boolean) {
    const { error } = await navegador().rpc("sorteo_abrir", { p_abierto: v, p_control: llave() });
    if (error) setMsg({ t: "err", x: motivo(error.message) });
    await cargar();
  }

  async function girar() {
    if (!e?.ruleta?.length || girando) return;
    setGirando(true); setPremio(null); setMsg(null); setGanIdx(null); setRot(0); setVista(e.ruleta); pausa.current = true;
    const { data, error } = await navegador().rpc("sorteo_girar", { p_control: llave() });
    if (error) { pausa.current = false; setGirando(false); setMsg({ t: "err", x: motivo(error.message) }); await cargar(); return; }
    const r = data as { indice: number; nombre: string };
    const n = e.ruleta.length, a = (2 * Math.PI) / n;
    const salto = (Math.random() - 0.5) * a * 0.7;
    const inicio = 0;
    const destino = -(r.indice + 0.5) * a + salto + 2 * Math.PI * 7;
    const dur = 7000, t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min((t - t0) / dur, 1), f = 1 - Math.pow(1 - p, 4);
      setRot(inicio + (destino - inicio) * f);
      if (p < 1) requestAnimationFrame(paso);
      else { setPremio(r.nombre); setGanIdx(r.indice); setGirando(false); pausa.current = false; cargar(); }
    };
    requestAnimationFrame(paso);
  }

  async function verContactos() {
    const { data, error } = await navegador().rpc("sorteo_ganadores_contacto", { p_control: llave() });
    if (error) setMsg({ t: "err", x: motivo(error.message) }); else setContactos(data as Contacto[]);
  }

  async function reiniciar() {
    if (!window.confirm("¿Borrar a todos los participantes y ganadores y cerrar el sorteo?")) return;
    const { error } = await navegador().rpc("sorteo_reiniciar", { p_control: llave() });
    if (error) setMsg({ t: "err", x: motivo(error.message) });
    setPremio(null); setContactos(null); await cargar();
  }

  if (!e) return <p className="rg-help" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 26 }}><Loader2 className="size-6 animate-spin text-lavender" aria-hidden /> Cargando…</p>;

  const faltan = e.premios - e.ganadores.length;

  return (
    <div className={s.col}>
      <div className="box">
        <p className="box-h">Se sortean</p>
        <h2 className={s.premio}>{e.titulo}</h2>
        <p className={s.sub}>Con el apoyo de <a href="https://www.we-educacion.com/" target="_blank" rel="noopener noreferrer">We Educación Ejecutiva</a>, aliada de la hackathon. Los {e.premios} ganadores eligen uno de estos cursos, totalmente cubierto:</p>
        <ul className={s.cursos}>{CURSOS.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className={s.sub}>Participan quienes estén <b>inscritos en el bootcamp desde la web</b> y sigan en la sesión cuando se abra el sorteo.</p>
      </div>

      {!e.admin && (
        <div className="box">
          <p className="box-h">Participar</p>
          {e.abierto ? (
            <form onSubmit={participar}>
              <div className={s.campo}><label htmlFor="so-correo">Tu correo de inscripción</label>
                <input id="so-correo" type="email" required className="rg-input" value={correo} onChange={(ev) => setCorreo(ev.target.value)} placeholder="tu@correo.com" autoComplete="email" /></div>
              <div className="rg-actions"><button type="submit" className="more solid" style={{ marginTop: 0 }} disabled={ocupado}>{ocupado && <Loader2 className="size-4 animate-spin" aria-hidden />} Participar en el sorteo</button></div>
              <p className={s.sub}>Una sola participación por persona. {e.participantes > 0 && <>Ya participan <b>{e.participantes}</b>.</>}</p>
            </form>
          ) : (
            <p className={s.sub}><Lock size={14} aria-hidden style={{ display: "inline", verticalAlign: "-2px" }} /> El sorteo se abre al final de la sesión de hoy. Mantén esta página abierta y quédate en Zoom.</p>
          )}
          {msg && <p className={`rg-msg ${msg.t === "ok" ? "ok" : "err"}`}>{msg.x}</p>}
        </div>
      )}

      {e.ganadores.length > 0 && (
        <div className="box">
          <p className="box-h">Ganadores</p>
          <ol className={s.ganadores}>
            {e.ganadores.map((g, i) => <li key={i}><Trophy size={16} aria-hidden /> <b>{g}</b></li>)}
          </ol>
          {faltan > 0 && <p className={s.sub}>Faltan {faltan} {faltan === 1 ? "ganador" : "ganadores"}.</p>}
        </div>
      )}

      {e.admin && (
        <div className="box">
          <p className="box-h">Moderación</p>
          {!e.control_ok && (
            <div className="rg-actions" style={{ marginBottom: 12 }}>
              <p className={`rg-msg err`} style={{ margin: 0 }}>{llave() ? "Otra sesión de moderación tomó el control." : "Hay una sesión de moderación abierta en otro lugar."} Aquí solo puedes mirar.</p>
              <button type="button" className="more solid" style={{ marginTop: 0 }} onClick={tomarControl}>Tomar el control</button>
            </div>
          )}
          <div className={s.fila}>
            <span className="pill-ok">{e.participantes} participantes</span>
            <span className="pill-ok">{e.ruleta?.length ?? 0} en la ruleta</span>
            <span className="pill-ok" style={{ opacity: e.abierto ? 1 : .7 }}>{e.abierto ? "registro abierto" : "registro cerrado"}</span>
          </div>
          <div className="rg-actions">
            <button type="button" className={`more${e.abierto ? "" : " solid"}`} style={{ marginTop: 0 }} onClick={() => abrir(!e.abierto)} disabled={girando || !e.control_ok}>{e.abierto ? "Cerrar registro" : "Abrir registro"}</button>
            <button type="button" className="more" style={{ marginTop: 0 }} onClick={verContactos} disabled={!e.control_ok}>Ver contactos de ganadores</button>
            <button type="button" className={`more ${s.peligro}`} style={{ marginTop: 0 }} onClick={reiniciar} disabled={girando || !e.control_ok}>Reiniciar</button>
            <button type="button" className="more" style={{ marginTop: 0 }} onClick={salir} disabled={girando}>Salir de la sesión</button>
          </div>
          {msg && <p className={`rg-msg ${msg.t === "ok" ? "ok" : "err"}`}>{msg.x}</p>}
          {contactos && (
            <ul className={s.contactos}>
              {contactos.length === 0 ? <li>Aún no hay ganadores.</li> : contactos.map((c) => <li key={c.orden}><b>{c.orden}. {c.nombre}</b> · {c.correo}{c.celular ? ` · ${c.celular}` : ""}</li>)}
            </ul>
          )}
        </div>
      )}

      {e.admin && (
        <div className={s.escena}>
          <div className={s.puntero} aria-hidden />
          <Ruleta nombres={vista ?? e.ruleta ?? []} rot={rot} ganador={ganIdx} />
          {premio && !girando && <div className={s.cinta} role="status"><span className={s.cintaTit}>Ganador</span><b>{premio}</b></div>}
          <button type="button" className={`more solid ${s.girar}`} onClick={girar} disabled={girando || !e.control_ok || !(e.ruleta?.length) || faltan <= 0}>
            {girando ? "Girando…" : faltan <= 0 ? "Sorteo completo" : `Girar la ruleta (${e.ganadores.length + 1} de ${e.premios})`}
          </button>
        </div>
      )}

      {!e.admin && (
        <div className={s.modbox}>
          {!mod ? <button type="button" className={s.link} onClick={() => setMod(true)}>Soy moderador</button> : (
            <form onSubmit={entrarMod} className={s.modform}>
              <input className="rg-input" type="email" required placeholder="correo de CIS" value={mCorreo} onChange={(ev) => setMCorreo(ev.target.value)} autoComplete="username" />
              <input className="rg-input" type="password" required placeholder="contraseña" value={mClave} onChange={(ev) => setMClave(ev.target.value)} autoComplete="current-password" />
              <button type="submit" className="more" style={{ marginTop: 0 }} disabled={ocupado}>Entrar</button>
            </form>
          )}
          {mod && msg?.t === "err" && !e.admin && <p className="rg-msg err">{msg.x}</p>}
        </div>
      )}
    </div>
  );
}
