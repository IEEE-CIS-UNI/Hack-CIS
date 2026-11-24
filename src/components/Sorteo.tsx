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

type Estado = { abierto: boolean; premios: number; titulo: string; admin: boolean; participantes: number; ganadores: string[]; ruleta: string[] | null };
type Contacto = { orden: number; nombre: string; correo: string; celular: string | null };

const ERRORES: Record<string, string> = {
  sorteo_cerrado: "El sorteo todavía no está abierto. Se abre al final de la sesión.",
  correo_invalido: "Revisa el correo: parece que le falta algo.",
  no_inscrito: "Ese correo no está inscrito en el bootcamp. Usa el correo con el que te registraste en la web.",
  ya_participa: "Ese correo ya está participando. ¡Mucha suerte!",
  no_admin: "Esta cuenta no puede moderar el sorteo.",
  sorteo_completo: "Ya salieron todos los ganadores.",
  sin_participantes: "No quedan participantes en la ruleta.",
};
const motivo = (m: string) => { const k = Object.keys(ERRORES).find((x) => m.includes(x)); return k ? ERRORES[k] : "No pudimos completar la acción. Inténtalo de nuevo."; };
const COLORES = ["#7a2cf5", "#b69cff", "#38e5c4", "#ff5fb0", "#ffd84d", "#4d7cff"];

function Ruleta({ nombres, rot }: { nombres: string[]; rot: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), L = 560;
    c.width = L * dpr; c.height = L * dpr;
    const g = c.getContext("2d"); if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, L, L);
    const R = L / 2 - 8, n = Math.max(nombres.length, 1), a = (2 * Math.PI) / n;
    g.save(); g.translate(L / 2, L / 2); g.rotate(rot - Math.PI / 2);
    for (let i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, i * a, (i + 1) * a); g.closePath();
      g.fillStyle = nombres.length ? COLORES[i % COLORES.length] : "#2a1650"; g.fill();
      if (n <= 60) { g.strokeStyle = "rgba(10,4,24,.55)"; g.lineWidth = 1; g.stroke(); }
      if (n <= 36 && nombres[i]) {
        g.save(); g.rotate((i + 0.5) * a); g.fillStyle = "#12071f"; g.font = `700 ${n > 20 ? 13 : 16}px Poppins, sans-serif`; g.textAlign = "right"; g.textBaseline = "middle";
        g.fillText(nombres[i], R - 16, 0); g.restore();
      }
    }
    g.restore();
    g.beginPath(); g.arc(L / 2, L / 2, 34, 0, 2 * Math.PI); g.fillStyle = "#12071f"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#fff"; g.stroke();
  }, [nombres, rot]);
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
  const pausa = useRef(false);

  const cargar = useCallback(async () => {
    if (pausa.current) return;
    try {
      const { data, error } = await navegador().rpc("sorteo_estado");
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
    setMClave(""); await cargar();
  }

  async function abrir(v: boolean) {
    const { error } = await navegador().rpc("sorteo_abrir", { p_abierto: v });
    if (error) setMsg({ t: "err", x: motivo(error.message) });
    await cargar();
  }

  async function girar() {
    if (!e?.ruleta?.length || girando) return;
    setGirando(true); setPremio(null); setMsg(null); pausa.current = true;
    const { data, error } = await navegador().rpc("sorteo_girar");
    if (error) { pausa.current = false; setGirando(false); setMsg({ t: "err", x: motivo(error.message) }); await cargar(); return; }
    const r = data as { indice: number; nombre: string };
    const n = e.ruleta.length, a = (2 * Math.PI) / n;
    const salto = (Math.random() - 0.5) * a * 0.7;
    const inicio = rot % (2 * Math.PI);
    const destino = -(r.indice + 0.5) * a + salto + 2 * Math.PI * 7;
    const dur = 7000, t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min((t - t0) / dur, 1), f = 1 - Math.pow(1 - p, 4);
      setRot(inicio + (destino - inicio) * f);
      if (p < 1) requestAnimationFrame(paso);
      else { setPremio(r.nombre); setGirando(false); pausa.current = false; cargar(); }
    };
    requestAnimationFrame(paso);
  }

  async function verContactos() {
    const { data, error } = await navegador().rpc("sorteo_ganadores_contacto");
    if (error) setMsg({ t: "err", x: motivo(error.message) }); else setContactos(data as Contacto[]);
  }

  async function reiniciar() {
    if (!window.confirm("¿Borrar a todos los participantes y ganadores y cerrar el sorteo?")) return;
    const { error } = await navegador().rpc("sorteo_reiniciar");
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
        <p className={s.sub}>{e.premios} ganadores. Cada uno elige el curso que quiera del catálogo de <a href="https://www.we-educacion.com/" target="_blank" rel="noopener noreferrer">WE Educación</a>, totalmente cubierto. Participan quienes estén <b>inscritos en el bootcamp desde la web</b> y sigan en la sesión cuando se abra el sorteo.</p>
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
          <div className={s.fila}>
            <span className="pill-ok">{e.participantes} participantes</span>
            <span className="pill-ok">{e.ruleta?.length ?? 0} en la ruleta</span>
            <span className="pill-ok" style={{ opacity: e.abierto ? 1 : .7 }}>{e.abierto ? "registro abierto" : "registro cerrado"}</span>
          </div>
          <div className="rg-actions">
            <button type="button" className={`more${e.abierto ? "" : " solid"}`} style={{ marginTop: 0 }} onClick={() => abrir(!e.abierto)} disabled={girando}>{e.abierto ? "Cerrar registro" : "Abrir registro"}</button>
            <button type="button" className="more" style={{ marginTop: 0 }} onClick={verContactos}>Ver contactos de ganadores</button>
            <button type="button" className={`more ${s.peligro}`} style={{ marginTop: 0 }} onClick={reiniciar} disabled={girando}>Reiniciar</button>
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
          <Ruleta nombres={e.ruleta ?? []} rot={rot} />
          {premio && !girando && <div className={s.ganador} role="status"><Trophy aria-hidden size={26} /> {premio}</div>}
          <button type="button" className={`more solid ${s.girar}`} onClick={girar} disabled={girando || !(e.ruleta?.length) || faltan <= 0}>
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
