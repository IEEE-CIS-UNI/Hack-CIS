"use client";

/**
 * /monitor: la organización ve cómo se forman los equipos (solo lectura). Entra con la cuenta de CIS; los permisos los
 * comprueba la base (supabase/038). Tiene datos de contacto: no proyectar ni compartir pantalla.
 */
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { etiquetaHabilidad } from "@/lib/equipos";
import s from "./MonitorEquipos.module.css";

type Miembro = { nombre: string; universidad: string | null; carrera: string | null; lider: boolean; correo: string; celular: string | null };
type Equipo = { id: string; nombre: string; descripcion: string | null; buscando: string[]; abierto: boolean; n: number; track: string | null; creado: string; pendientes: number; miembros: Miembro[] };
type Datos = { resumen: Record<"equipos" | "solos" | "listos" | "completos" | "pueden" | "en_equipo" | "sin_equipo" | "buscando" | "pendientes", number>; equipos: Equipo[] };

export default function MonitorEquipos() {
  const [d, setD] = useState<Datos | null>(null);
  const [estado, setEstado] = useState<"cargando" | "entrar" | "listo">("cargando");
  const [correo, setCorreo] = useState(""); const [clave, setClave] = useState("");
  const [msg, setMsg] = useState("");
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState(0);   // 0 = todos; 1..4 = integrantes

  const cargar = useCallback(async () => {
    const { data: ses } = await navegador().auth.getSession();
    if (!ses.session) { setEstado("entrar"); return; }
    const { data, error } = await navegador().rpc("org_equipos");
    if (error) { if (/no_admin|permission/i.test(error.message)) { setEstado("entrar"); setMsg("Esta cuenta no puede usar este panel."); } return; }
    setD(data as Datos); setEstado("listo");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    const t = setInterval(cargar, 12_000);
    return () => clearInterval(t);
  }, [cargar]);

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault(); setMsg("");
    const { error } = await navegador().auth.signInWithPassword({ email: correo.trim(), password: clave });
    if (error) { setMsg("Correo o contraseña incorrectos."); return; }
    setClave(""); await cargar();
  }

  if (estado === "cargando") return <p className="rg-help" style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 24 }}><Loader2 className="size-5 animate-spin" aria-hidden /> Cargando…</p>;

  if (estado === "entrar" || !d) {
    return (
      <form className="box" style={{ marginTop: 26 }} onSubmit={entrar}>
        <p className="box-h">Entra con la cuenta de la organización</p>
        <div className={s.campos}>
          <input className="rg-input" type="email" required placeholder="correo de CIS" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="username" />
          <input className="rg-input" type="password" required placeholder="contraseña" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="rg-actions"><button type="submit" className="more solid">Entrar</button></div>
        {msg && <p className="rg-msg err">{msg}</p>}
      </form>
    );
  }

  const r = d.resumen;
  const q = buscar.trim().toLowerCase();
  const visibles = d.equipos.filter((t) => (!filtro || t.n === filtro)
    && (!q || [t.nombre, ...t.miembros.flatMap((m) => [m.nombre, m.universidad ?? "", m.correo])].some((x) => x.toLowerCase().includes(q))));
  const cifras: [number | string, string][] = [
    [r.equipos, "equipos"], [r.en_equipo, `de ${r.pueden} personas ya en equipo`], [r.sin_equipo, "sin equipo todavía"], [r.buscando, "buscando equipo"],
    [r.solos, "equipos de 1 (aún no pueden elegir track)"], [r.listos, "equipos con 2 o más"], [r.completos, "equipos completos (4)"], [r.pendientes, "solicitudes e invitaciones pendientes"],
  ];

  return (
    <div className={s.col}>
      <div className={s.cifras}>{cifras.map(([n, t]) => <div key={t}><b>{n}</b><span>{t}</span></div>)}</div>
      <div className={s.filtros}>
        <input className="rg-input" placeholder="Buscar equipo, persona, universidad o correo" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar" />
        <div className={s.botones}>{[0, 1, 2, 3, 4].map((n) => <button key={n} type="button" aria-pressed={filtro === n} onClick={() => setFiltro(n)}>{n === 0 ? "Todos" : `${n} ${n === 1 ? "persona" : "personas"}`}</button>)}</div>
        <p className={s.nota}>{visibles.length} de {d.equipos.length} · se actualiza solo cada 12 s · contiene datos privados, no lo proyectes</p>
      </div>
      {visibles.length === 0 ? <p className={s.vacio}>{d.equipos.length === 0 ? "Todavía no hay equipos. Aparecerán aquí apenas se creen." : "Nada coincide con la búsqueda."}</p> : (
        <div className={s.rejilla}>
          {visibles.map((t) => (
            <article key={t.id} className={s.equipo}>
              <header><h3>{t.nombre}</h3><b className={t.n >= 2 ? s.ok : s.solo}>{t.n}/4</b></header>
              <p className={s.meta}>{new Date(t.creado).toLocaleString("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}{t.track ? ` · ${t.track}` : ""}{t.pendientes ? ` · ${t.pendientes} ${t.pendientes === 1 ? "pendiente" : "pendientes"}` : ""}{!t.abierto ? " · cerrado a solicitudes" : ""}</p>
              {t.descripcion && <p className={s.desc}>{t.descripcion}</p>}
              {t.buscando.length > 0 && t.n < 4 && <p className={s.busca}>Buscan: {t.buscando.map(etiquetaHabilidad).join(", ")}</p>}
              <ul>{t.miembros.map((m) => (
                <li key={m.correo}><b>{m.nombre}{m.lider ? " ★" : ""}</b><span>{[m.universidad, m.carrera].filter(Boolean).join(" · ")}</span>
                  <small><a href={`mailto:${m.correo}`}>{m.correo}</a>{m.celular && <> · <a href={`https://wa.me/${m.celular.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{m.celular}</a></>}</small></li>
              ))}</ul>
            </article>
          ))}
        </div>
      )}
      <div className="rg-actions"><button type="button" className="more" onClick={async () => { await navegador().auth.signOut(); setD(null); setEstado("entrar"); }}>Cerrar sesión</button></div>
    </div>
  );
}
