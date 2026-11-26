"use client";

/**
 * /lanzar: panel de la organización para la presentación de sponsors. Con la cuenta de CIS se escriben los retos (quedan
 * ocultos), se lanza la elección de track con cuenta regresiva y se ve en vivo cuántos equipos eligen cada uno.
 * Todos los permisos los comprueba la base (supabase/037).
 */
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";
import s from "./PanelLanzar.module.css";

type Reto = { titulo: string | null; detalle: string | null; enlace: string | null };
type Pista = { slug: string; nombre: string; sponsor: string | null; abre: string; cierra: string; tope: number | null; ocupados: number; reto: Reto | null };
type Panel = { ahora: string; equipos: number; listos: number; tracks: Pista[] };

const ERRORES: Record<string, string> = {
  no_admin: "Esta cuenta no puede usar este panel.",
  url_invalida: "El enlace debe empezar con https://",
  texto_largo: "El texto es demasiado largo (título 160, detalle 6000).",
};
const motivo = (m: string) => { const k = Object.keys(ERRORES).find((x) => m.includes(x)); return k ? ERRORES[k] : "No pudimos completar la acción. Inténtalo de nuevo."; };

function EditorReto({ t, alGuardar }: { t: Pista; alGuardar: () => void }) {
  const [titulo, setTitulo] = useState(t.reto?.titulo ?? "");
  const [detalle, setDetalle] = useState(t.reto?.detalle ?? "");
  const [enlace, setEnlace] = useState(t.reto?.enlace ?? "");
  const [msg, setMsg] = useState("");
  async function guardar() {
    setMsg("Guardando…");
    const { error } = await navegador().rpc("tracks_guardar_reto", { p_slug: t.slug, p_titulo: titulo, p_detalle: detalle, p_enlace: enlace });
    setMsg(error ? motivo(error.message) : "Guardado. Se verá recién cuando el track abra.");
    if (!error) alGuardar();
  }
  return (
    <details className={s.editor}>
      <summary>Reto de {t.sponsor} {t.reto?.titulo || t.reto?.detalle ? "✓ escrito" : "· pendiente"}</summary>
      <label>Título<input className="rg-input" maxLength={160} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="El reto en una línea" /></label>
      <label>Detalle<textarea className="rg-input" rows={7} maxLength={6000} value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Contexto, qué deben resolver, datos disponibles…" /></label>
      <label>Enlace a documento (opcional)<input className="rg-input" value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://drive.google.com/…" /></label>
      <button type="button" className="more solid" onClick={guardar}>Guardar reto</button>
      {msg && <p className={s.msg}>{msg}</p>}
    </details>
  );
}

export default function PanelLanzar() {
  const [p, setP] = useState<Panel | null>(null);
  const [estado, setEstado] = useState<"cargando" | "entrar" | "listo">("cargando");
  const [correo, setCorreo] = useState(""); const [clave, setClave] = useState("");
  const [minutos, setMinutos] = useState(1);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [desfase, setDesfase] = useState(0);   // reloj de la base menos reloj de este equipo
  const [ahora, setAhora] = useState(() => Date.now());

  const cargar = useCallback(async () => {
    const { data: ses } = await navegador().auth.getSession();
    if (!ses.session) { setEstado("entrar"); return; }
    const { data, error } = await navegador().rpc("tracks_panel");
    if (error) { if (/no_admin|permission/i.test(error.message)) { setEstado("entrar"); setMsg(ERRORES.no_admin); } return; }
    const d = data as Panel;
    setDesfase(Date.parse(d.ahora) - Date.now()); setP(d); setEstado("listo");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    const a = setInterval(cargar, 4000), b = setInterval(() => setAhora(Date.now()), 500);
    return () => { clearInterval(a); clearInterval(b); };
  }, [cargar]);

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault(); setOcupado(true); setMsg("");
    const { error } = await navegador().auth.signInWithPassword({ email: correo.trim(), password: clave });
    setOcupado(false);
    if (error) { setMsg("Correo o contraseña incorrectos."); return; }
    setClave(""); await cargar();
  }

  async function accion(fn: "tracks_lanzar" | "tracks_cancelar", pregunta: string) {
    if (!window.confirm(pregunta)) return;
    setOcupado(true); setMsg("");
    const { data, error } = await navegador().rpc(fn, fn === "tracks_lanzar" ? { p_minutos: minutos } : {});
    setOcupado(false);
    setMsg(error ? motivo(error.message) : data === 0 ? "No había nada que cambiar (ya está abierto, o ya hay equipos que eligieron)." : fn === "tracks_lanzar" ? "¡Lanzado!" : "Cancelado: los tracks vuelven a estar cerrados.");
    await cargar();
  }

  if (estado === "cargando") return <p className="rg-help" style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 24 }}><Loader2 className="size-5 animate-spin" aria-hidden /> Cargando…</p>;

  if (estado === "entrar" || !p) {
    return (
      <form className="box" style={{ marginTop: 26 }} onSubmit={entrar}>
        <p className="box-h">Entra con la cuenta de la organización</p>
        <div className={s.campos}>
          <input className="rg-input" type="email" required placeholder="correo de CIS" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="username" />
          <input className="rg-input" type="password" required placeholder="contraseña" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="rg-actions"><button type="submit" className="more solid" disabled={ocupado}>Entrar</button></div>
        {msg && <p className="rg-msg err">{msg}</p>}
      </form>
    );
  }

  const abre = Math.min(...p.tracks.map((t) => Date.parse(t.abre)));
  const falta = abre - (ahora + desfase);
  const abierto = falta <= 0;
  const enCuenta = !abierto && falta <= 3_600_000;
  const seg = Math.max(0, Math.ceil(falta / 1000));

  return (
    <div className={s.col}>
      <div className={`box ${s.control}`}>
        <p className="box-h">{abierto ? "Elección ABIERTA" : enCuenta ? "Cuenta regresiva en marcha" : "Elección cerrada"}</p>
        {enCuenta && <p className={s.reloj}>{String(Math.floor(seg / 60)).padStart(2, "0")}:{String(seg % 60).padStart(2, "0")}</p>}
        <p className={s.sub}><b>{p.equipos}</b> equipos creados · <b>{p.listos}</b> con 2 o más integrantes (pueden elegir)</p>
        {!abierto && !enCuenta && (
          <div className={s.fila}>
            <label className={s.min}>Cuenta regresiva
              <select className="rg-input" value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}>
                {[0, 1, 2, 3, 5, 10].map((m) => <option key={m} value={m}>{m === 0 ? "Abrir al instante" : `${m} min`}</option>)}
              </select>
            </label>
            <button type="button" className={`more solid ${s.lanzar}`} disabled={ocupado} onClick={() => accion("tracks_lanzar", minutos === 0 ? "¿ABRIR YA la elección de los tres tracks y revelar los retos?" : `¿Iniciar la cuenta regresiva de ${minutos} min? Al terminar se abren los tracks y se revelan los retos.`)}>Iniciar apertura</button>
          </div>
        )}
        {(enCuenta || (abierto && p.tracks.every((t) => t.ocupados === 0))) && (
          <div className="rg-actions"><button type="button" className="more" disabled={ocupado} onClick={() => accion("tracks_cancelar", "¿Cancelar y volver a cerrar la elección?")}>Cancelar apertura</button></div>
        )}
        {msg && <p className={s.msg}>{msg}</p>}
      </div>

      <div className={s.tracks}>
        {p.tracks.map((t) => (
          <div key={t.slug} className={`box ${s.track}`}>
            <p className="box-h">{t.sponsor}</p>
            <p className={s.cifra}>{t.ocupados}{t.tope ? <small> / {t.tope}</small> : null}</p>
            <p className={s.sub}>{t.tope ? `quedan ${Math.max(0, t.tope - t.ocupados)} lugares` : "equipos eligieron"}</p>
          </div>
        ))}
      </div>

      <div className="box">
        <p className="box-h">Retos (ocultos hasta que se abra)</p>
        <p className={s.sub}>Escríbelos antes del viernes. En la página de cada sponsor aparecen solos al abrirse la elección.</p>
        {p.tracks.map((t) => <EditorReto key={t.slug} t={t} alGuardar={cargar} />)}
      </div>

      <div className="rg-actions"><button type="button" className="more" onClick={async () => { await navegador().auth.signOut(); setP(null); setEstado("entrar"); }}>Cerrar sesión</button></div>
    </div>
  );
}
