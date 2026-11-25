"use client";

/**
 * /equipos/mi-equipo: la página de cada equipo.
 *
 * Integrantes con su contacto (solo los ven quienes están en el equipo), grupo de WhatsApp, entregables de la primera fase
 * (repositorio, láminas en PDF e idea), elección de track (la hace el líder el viernes 27), solicitudes pendientes y, para el
 * líder, la lista de personas que buscan equipo para invitarlas.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, MessageCircle, Users } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { llamar, type EstadoEquipos, type MiEquipoDetalle, type Pendientes, type PersonaBusca } from "@/lib/equipos";
import { Boton, Habilidades, SelectorHabilidades, TarjetaPersona } from "./EquiposUI";
import AperturaTrack from "./AperturaTrack";
import s from "./Equipos.module.css";

type Pista = { slug: string; name: string; sponsor_name: string | null; opens_at: string | null; closes_at: string | null };
type Aviso = { tipo: "ok" | "error"; texto: string } | null;
type Res = { ok: boolean; motivo?: string };

const soloDigitos = (t: string) => t.replace(/\D/g, "");

export default function MiEquipo() {
  const [estado, setEstado] = useState<"cargando" | "sinSesion" | "sinEquipo" | "listo">("cargando");
  const [e, setE] = useState<EstadoEquipos | null>(null);
  const [eq, setEq] = useState<MiEquipoDetalle | null>(null);
  const [pend, setPend] = useState<Pendientes | null>(null);
  const [personas, setPersonas] = useState<PersonaBusca[]>([]);
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [ahora, setAhora] = useState<number>(0);
  const router = useRouter();

  // edición del líder
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(""); const [descripcion, setDescripcion] = useState(""); const [busco, setBusco] = useState<string[]>([]);
  const [abierto, setAbierto] = useState(true); const [whatsapp, setWhatsapp] = useState("");
  // entregables
  const [repo, setRepo] = useState(""); const [slides, setSlides] = useState(""); const [idea, setIdea] = useState("");
  const [trackElegido, setTrackElegido] = useState("");

  const cargar = useCallback(async () => {
    try {
      const { data } = await navegador().auth.getSession();
      if (!data.session) { setEstado("sinSesion"); return; }
    } catch { setEstado("sinSesion"); return; }
    setAhora(Date.now());
    const [st, d] = await Promise.all([llamar<EstadoEquipos>("equipos_estado"), llamar<MiEquipoDetalle | null>("mi_equipo_detalle")]);
    if (!st.ok || !d.ok) { setEstado("sinSesion"); return; }
    setE(st.data);
    if (!d.data) { setEstado("sinEquipo"); return; }
    const t = d.data;
    setEq(t);
    setNombre(t.nombre); setDescripcion(t.descripcion ?? ""); setBusco(t.buscando); setAbierto(t.abierto); setWhatsapp(t.whatsapp_url ?? "");
    setRepo(t.repo_url ?? ""); setSlides(t.slides_url ?? ""); setIdea(t.idea ?? ""); setTrackElegido(t.track?.slug ?? "");
    const [pe, tr] = await Promise.all([
      llamar<Pendientes>("equipo_pendientes"),
      navegador().from("tracks").select("slug, name, sponsor_name, opens_at, closes_at").eq("revealed", true).order("position"),
    ]);
    if (pe.ok) setPend(pe.data);
    if (tr.data) setPistas(tr.data as Pista[]);
    if (t.soy_lider && t.n < 4 && st.data.abierto) {
      const g = await llamar<PersonaBusca[]>("equipos_buscan_gente");
      if (g.ok) setPersonas(g.data);
    } else setPersonas([]);
    setEstado("listo");
  }, []);

  useEffect(() => {
    // Consulta al abrir la página; los estados se fijan cuando responde la base.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  // Solo refresca los tracks (sin recargar la página, para no borrar lo que se esté escribiendo).
  const refrescarTracks = useCallback(async () => {
    const { data } = await navegador().from("tracks").select("slug, name, sponsor_name, opens_at, closes_at").eq("revealed", true).order("position");
    if (data) setPistas(data as Pista[]);
    setAhora(Date.now());
  }, []);

  async function accion(clave: string, fn: () => Promise<Res>, exito?: string) {
    setOcupado(clave); setAviso(null);
    const r = await fn();
    setOcupado(null);
    if (!r.ok) { setAviso({ tipo: "error", texto: r.motivo ?? "No pudimos completar la acción." }); await cargar(); return false; }   // lo que se ve pudo quedar viejo
    if (exito) setAviso({ tipo: "ok", texto: exito });
    await cargar();
    return true;
  }

  if (estado === "cargando") return <p className="rg-help" style={{ display: "flex", gap: 12, alignItems: "center" }}><Loader2 className="size-6 animate-spin text-lavender" aria-hidden /> Cargando tu equipo…</p>;

  if (estado === "sinSesion") {
    return (
      <div className="box" style={{ marginTop: 26 }}>
        <p className="box-h">Entra para ver tu equipo</p>
        <div className="rg-actions"><Link href="/mi-inscripcion" className="more solid">Entrar a mi panel <ArrowRight aria-hidden size={14} /></Link></div>
      </div>
    );
  }

  if (estado === "sinEquipo" || !eq || !e) {
    return (
      <div className="box" style={{ marginTop: 26 }}>
        <p className="box-h">Todavía no tienes equipo</p>
        <p className={s.sub}>Crea uno o únete a uno desde la plataforma de equipos. Sin equipo no podrás enviar tu solución.</p>
        <div className="rg-actions"><Link href="/equipos" className="more solid"><Users aria-hidden size={14} /> Ir a equipos <ArrowRight aria-hidden size={14} /></Link></div>
      </div>
    );
  }

  const lleno = eq.n >= 4;
  const pistaActual = pistas.find((p) => p.slug === eq.track?.slug);
  const ventanaAbierta = (p: Pista) => (!p.opens_at || ahora >= new Date(p.opens_at).getTime()) && (!p.closes_at || ahora <= new Date(p.closes_at).getTime());
  const algunaAbierta = pistas.some(ventanaAbierta);
  const proxima = pistas.map((p) => p.opens_at).filter((x): x is string => !!x).sort()[0];

  return (
    <div className={s.col}>
      <p><Link href="/equipos" className="rg-small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><ArrowLeft size={13} aria-hidden /> Plataforma de equipos</Link></p>

      <div className="box">
        <p className="box-h">Tu equipo</p>
        <h2 style={{ fontFamily: "var(--display)", fontWeight: 700, textTransform: "uppercase", fontSize: "clamp(2rem,6vw,3.2rem)", lineHeight: 1 }}>{eq.nombre}</h2>
        <div className={s.fila} style={{ marginTop: 10 }}>
          <span className="pill-ok">{eq.n} de 4 integrantes</span>
          {eq.track ? <span className="pill-ok"><Check size={12} aria-hidden /> Track: {eq.track.nombre}{eq.track.sponsor ? ` · ${eq.track.sponsor}` : ""}</span> : <span className="pill-ok" style={{ opacity: .75 }}>Track: se elige el viernes 27</span>}
          {eq.soy_lider && <span className="pill-ok">eres el líder</span>}
        </div>
        {eq.descripcion && <p className={s.sub}>{eq.descripcion}</p>}
        {eq.buscando.length > 0 && !lleno && <><p style={{ fontSize: ".78rem", color: "var(--lav)", marginTop: 12 }}>Buscan:</p><Habilidades ids={eq.buscando} /></>}
        {eq.soy_lider && !editando && <div className="rg-actions"><Boton alClick={() => setEditando(true)}>Editar equipo</Boton></div>}
        {eq.soy_lider && editando && (
          <>
            <div className={s.campo}><label htmlFor="m-nombre">Nombre</label><input id="m-nombre" className="rg-input" maxLength={40} value={nombre} onChange={(ev) => setNombre(ev.target.value)} /></div>
            <div className={s.campo}><label htmlFor="m-desc">Qué quieren hacer</label><input id="m-desc" className="rg-input" maxLength={240} value={descripcion} onChange={(ev) => setDescripcion(ev.target.value)} /></div>
            <div className={s.campo}><label>Perfiles que buscan</label><SelectorHabilidades valor={busco} alCambiar={setBusco} /></div>
            <label className="rg-consent" style={{ marginTop: 12 }}><input type="checkbox" checked={abierto} onChange={(ev) => setAbierto(ev.target.checked)} /><span>Aceptar solicitudes de otras personas (aparecer en «Equipos que buscan gente»).</span></label>
            <div className="rg-actions">
              <Boton solido ocupado={ocupado === "editar"} alClick={async () => { if (await accion("editar", () => llamar("equipo_editar", { p_nombre: nombre, p_descripcion: descripcion, p_buscando: busco, p_abierto: abierto, p_whatsapp: whatsapp }), "Equipo actualizado.")) setEditando(false); }}>Guardar</Boton>
              <Boton alClick={() => setEditando(false)}>Cancelar</Boton>
            </div>
          </>
        )}
      </div>

      {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`}>{aviso.texto}</p>}

      <div>
        <p className="box-h" style={{ marginBottom: 0 }}>Integrantes y contacto</p>
        <p className={s.sub}>Solo las personas de este equipo ven estos datos. Úsenlos para coordinarse.</p>
        <div className={s.miembros}>
          {eq.miembros.map((m) => (
            <article key={m.id} className={s.miembro}>
              <h3>{m.nombre}{m.lider && <span className="pill-ok">líder</span>}{m.yo && <span className="pill-ok">tú</span>}</h3>
              <p className="meta">{[m.universidad, m.carrera, m.ciclo ? `ciclo ${m.ciclo}` : null].filter(Boolean).join(" · ")}</p>
              <Habilidades ids={m.habilidades} />
              <ul className={s.contacto}>
                {m.correo && <li><span>Correo</span><a href={`mailto:${m.correo}`}>{m.correo}</a></li>}
                {m.celular && <li><span>Celular</span><a href={`https://wa.me/${soloDigitos(m.celular)}`} target="_blank" rel="noopener noreferrer">{m.celular}</a><small>(abre WhatsApp)</small></li>}
                {m.discord && <li><span>Discord</span><b style={{ color: "#fff" }}>{m.discord}</b></li>}
                {m.linkedin && <li><span>LinkedIn</span><a href={m.linkedin} target="_blank" rel="noopener noreferrer">perfil</a></li>}
                {m.github && <li><span>GitHub</span><a href={m.github} target="_blank" rel="noopener noreferrer">perfil</a></li>}
              </ul>
              {eq.soy_lider && !m.yo && e.abierto && (
                <div className="rg-actions" style={{ marginTop: 12 }}>
                  <Boton peligro ocupado={ocupado === `quitar-${m.id}`} alClick={() => { if (window.confirm(`¿Quitar a ${m.nombre} del equipo? Dejará de ver los datos de contacto y podrá unirse a otro.`)) accion(`quitar-${m.id}`, () => llamar("equipo_quitar", { p_person: m.id }), `${m.nombre} ya no está en el equipo.`); }}>Quitar del equipo</Boton>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="box">
        <p className="box-h">Grupo de WhatsApp</p>
        {eq.whatsapp_url ? (
          <div className="rg-actions" style={{ marginTop: 6 }}><a href={eq.whatsapp_url} target="_blank" rel="noopener noreferrer" className="more solid"><MessageCircle size={14} aria-hidden /> Unirme al grupo del equipo <ExternalLink size={13} aria-hidden /></a></div>
        ) : <p className={s.sub}>Todavía no hay grupo de WhatsApp.</p>}
        {eq.soy_lider && (
          <>
            <p className={s.sub}>WhatsApp no permite crear grupos automáticamente: crea el grupo en tu celular, copia su <b>enlace de invitación</b> (Info del grupo → Invitar mediante enlace) y pégalo aquí.</p>
            <div className={s.campo}><label htmlFor="m-wa">Enlace del grupo</label><input id="m-wa" className="rg-input" value={whatsapp} onChange={(ev) => setWhatsapp(ev.target.value)} placeholder="https://chat.whatsapp.com/..." /></div>
            <div className="rg-actions"><Boton ocupado={ocupado === "wa"} alClick={() => accion("wa", () => llamar("equipo_editar", { p_nombre: eq.nombre, p_descripcion: eq.descripcion ?? "", p_buscando: eq.buscando, p_abierto: eq.abierto, p_whatsapp: whatsapp }), "Enlace guardado.")}>Guardar enlace</Boton></div>
          </>
        )}
      </div>

      <div className="box">
        <p className="box-h">Entregables · primera propuesta</p>
        <p className={s.sub}>Cualquiera del equipo puede completarlos. La primera propuesta se entrega <b>hasta la noche del sábado 28 de noviembre</b>. Sin equipo y sin entregables no se puede pasar a la selección de los 25 equipos que construyen.</p>
        <ul className={s.estado}>
          <li><Check size={16} aria-hidden className={eq.repo_url ? s.ok : ""} style={{ opacity: eq.repo_url ? 1 : .3 }} /> Repositorio creado</li>
          <li><Check size={16} aria-hidden className={eq.slides_url ? s.ok : ""} style={{ opacity: eq.slides_url ? 1 : .3 }} /> PDF con las láminas de la solución</li>
          <li><Check size={16} aria-hidden className={eq.idea ? s.ok : ""} style={{ opacity: eq.idea ? 1 : .3 }} /> Idea del equipo</li>
        </ul>
        <div className={s.campo}><label htmlFor="e-repo">Enlace del repositorio (GitHub, GitLab…)</label><input id="e-repo" className="rg-input" value={repo} onChange={(ev) => setRepo(ev.target.value)} placeholder="https://github.com/su-equipo/su-proyecto" /></div>
        <div className={s.campo}><label htmlFor="e-sl">Enlace al PDF de las láminas (Drive, Canva…)</label><input id="e-sl" className="rg-input" value={slides} onChange={(ev) => setSlides(ev.target.value)} placeholder="https://drive.google.com/..." /><small>Asegúrate de que el enlace permita ver el archivo sin pedir permiso.</small></div>
        <div className={s.campo}><label htmlFor="e-idea">La idea en pocas líneas</label><textarea id="e-idea" className="rg-input" rows={4} maxLength={1500} value={idea} onChange={(ev) => setIdea(ev.target.value)} placeholder="¿Qué problema resuelven y cómo?" /><small>{idea.length}/1500</small></div>
        <div className="rg-actions"><Boton solido ocupado={ocupado === "entregar"} alClick={() => accion("entregar", () => llamar("equipo_entregar", { p_repo: repo, p_slides: slides, p_idea: idea }), "Entregables guardados.")}>Guardar entregables</Boton></div>
      </div>

      <div className="box">
        <p className="box-h">Track</p>
        {eq.track && pistaActual && <p className={s.sub}>Su track actual es <b style={{ color: "#fff" }}>{eq.track.nombre}</b>{eq.track.sponsor ? ` (${eq.track.sponsor})` : ""}.</p>}
        {!eq.soy_lider && <p className={s.sub}>El track lo elige la persona líder, durante la presentación de sponsors del viernes 27 (8:30 p. m.). Todo el equipo queda en ese track.</p>}
        {!eq.soy_lider && !algunaAbierta && proxima && <AperturaTrack abre={proxima} alCambiar={refrescarTracks} />}
        {eq.soy_lider && (
          <>
            {algunaAbierta ? <p className={s.sub}>Elige el track del equipo. Todo el equipo queda en él; puedes cambiarlo mientras la elección siga abierta.</p>
              : proxima ? <AperturaTrack abre={proxima} alCambiar={refrescarTracks} /> : <p className={s.sub}>La elección de track todavía no está abierta.</p>}
            <div className={s.tracks}>
              {pistas.map((p) => (
                <label key={p.slug} className={s.trackopt} style={{ opacity: ventanaAbierta(p) ? 1 : .55 }}>
                  <input type="radio" name="track" value={p.slug} checked={trackElegido === p.slug} disabled={!ventanaAbierta(p)} onChange={() => setTrackElegido(p.slug)} />
                  <span><b>{p.name}</b>{p.sponsor_name && <small>con {p.sponsor_name}</small>}</span>
                </label>
              ))}
            </div>
            {eq.n < 2 && <p className={s.sub} style={{ color: "#ffe9a8" }}>Necesitan al menos 2 integrantes para elegir track.</p>}
            <div className="rg-actions"><Boton solido deshabilitado={!trackElegido || !algunaAbierta || eq.n < 2 || trackElegido === eq.track?.slug} ocupado={ocupado === "track"} alClick={() => accion("track", () => llamar("equipo_elegir_track", { p_track: trackElegido }), "Track elegido para todo el equipo.")}>Elegir este track para el equipo</Boton></div>
          </>
        )}
      </div>

      {eq.soy_lider && pend && (pend.solicitudes.length > 0 || pend.invitadas.length > 0) && (
        <div className="box">
          <p className="box-h">Solicitudes e invitaciones</p>
          {pend.solicitudes.length > 0 && (
            <div className={s.lista}>
              {pend.solicitudes.map((v) => (
                <TarjetaPersona key={v.id} p={{ id: v.persona_id, nombre: v.nombre, universidad: v.universidad, universidad_nombre: null, carrera: v.carrera, area: null, ciclo: v.ciclo, nivel: v.nivel, habilidades: v.habilidades, frase: v.frase }}
                  acciones={<>
                    <Boton solido ocupado={ocupado === `ok-${v.id}`} alClick={() => accion(`ok-${v.id}`, () => llamar("equipo_responder", { p_invite: v.id, p_acepta: true }), `${v.nombre} se unió al equipo.`)}><Check size={14} aria-hidden /> Aceptar</Boton>
                    <Boton ocupado={ocupado === `no-${v.id}`} alClick={() => accion(`no-${v.id}`, () => llamar("equipo_responder", { p_invite: v.id, p_acepta: false }))}>Rechazar</Boton>
                  </>} />
              ))}
            </div>
          )}
          {pend.invitadas.length > 0 && (
            <ul className={s.estado}>
              {pend.invitadas.map((v) => (
                <li key={v.id}><span>Invitaste a <b style={{ color: "#fff" }}>{v.nombre}</b> (esperando respuesta)</span><Boton ocupado={ocupado === `x-${v.id}`} alClick={() => accion(`x-${v.id}`, () => llamar("equipo_cancelar", { p_invite: v.id }))}>Cancelar</Boton></li>
              ))}
            </ul>
          )}
        </div>
      )}

      {eq.soy_lider && !lleno && e.abierto && (
        <div>
          <p className="box-h" style={{ marginBottom: 0 }}>Personas que buscan equipo</p>
          <p className={s.sub}>Al invitar, la persona decide si acepta. Al aceptar, ustedes verán sus datos de contacto y ella los de ustedes.</p>
          {personas.length === 0 ? <div className={s.vacio} style={{ marginTop: 14 }}>Por ahora nadie está disponible. Vuelve en un rato.</div> : (
            <div className={s.lista}>
              {personas.map((p) => (
                <TarjetaPersona key={p.id} p={p} acciones={
                  pend?.invitadas.some((v) => v.persona_id === p.id)
                    ? <span className="pill-ok"><Check size={12} aria-hidden /> Invitación enviada</span>
                    : <Boton solido ocupado={ocupado === `inv-${p.id}`} alClick={() => accion(`inv-${p.id}`, () => llamar("equipo_invitar", { p_person: p.id }), `Invitaste a ${p.nombre}.`)}>Invitar</Boton>
                } />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="box">
        <p className="box-h">{eq.soy_lider ? "Salir o eliminar el equipo" : "Salir del equipo"}</p>
        <p className={s.sub}>
          {eq.soy_lider && eq.n === 1 ? "Estás solo en el equipo: si lo eliminas, podrás crear otro o unirte a uno."
            : eq.soy_lider ? "Si sales, el equipo sigue y el liderazgo pasa a la siguiente persona. Si lo eliminas, todos quedan sin equipo."
            : "Si sales, el equipo sigue con quienes quedan."}
          {e.abierto ? (eq.soy_lider && eq.n === 1 ? "" : " Podrás unirte a otro mientras la plataforma siga abierta.") : " La plataforma ya no está abierta: si sales, no podrás unirte a otro equipo."}
        </p>
        <div className="rg-actions">
          {!(eq.soy_lider && eq.n === 1 && e.abierto) && (
            <Boton peligro ocupado={ocupado === "salir"} alClick={() => { if (window.confirm(e.abierto ? "¿Seguro que quieres salir del equipo?" : "La plataforma ya cerró: si sales, no podrás unirte a otro equipo. ¿Salir de todos modos?")) accion("salir", () => llamar("equipo_salir")).then((ok) => { if (ok) router.push("/equipos"); }); }}>Salir del equipo</Boton>
          )}
          {eq.soy_lider && e.abierto && (
            <Boton peligro ocupado={ocupado === "eliminar"} alClick={() => { if (window.confirm(eq.n > 1 ? `¿Eliminar «${eq.nombre}»? Las ${eq.n} personas quedarán sin equipo y se pierden los datos guardados. No se puede deshacer.` : `¿Eliminar «${eq.nombre}»? No se puede deshacer.`)) accion("eliminar", () => llamar("equipo_eliminar")).then((ok) => { if (ok) router.push("/equipos"); }); }}>Eliminar equipo</Boton>
          )}
        </div>
      </div>
    </div>
  );
}
