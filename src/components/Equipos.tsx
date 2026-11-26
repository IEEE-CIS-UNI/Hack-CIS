"use client";

/**
 * /equipos: armar equipo ANTES de elegir track.
 *
 * Según quién mira:
 *   antes de la apertura           -> «se abre tal día», con cuenta regresiva (con o sin sesión)
 *   sin sesión                     -> entrar
 *   sin lugar confirmado / espera  -> qué hacer para poder formar equipo
 *   después del cierre             -> que cerró
 *   con equipo                     -> a su página de equipo
 *   sin equipo (dentro de fechas)  -> su perfil, invitaciones, equipos abiertos y crear equipo
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Users } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { EQUIPOS_ABRE, EQUIPOS_CIERRA, llamar, type EquipoAbierto, type EstadoEquipos, type PersonaBusca, type Pendientes, type MiEquipoDetalle } from "@/lib/equipos";
import { Boton, Habilidades, Pronto, SelectorHabilidades, TarjetaPersona, fechaLima } from "./EquiposUI";
import s from "./Equipos.module.css";

/** Qué decirle a quien ya tiene equipo y quiere entrar a otro. */
const yaTienes = (eq: MiEquipoDetalle) => eq.soy_lider
  ? `Eres líder del equipo «${eq.nombre}»: no puedes unirte a otro. Primero elimina tu equipo (o sal y deja el liderazgo) desde «Mi equipo».`
  : `Ya estás en el equipo «${eq.nombre}»: no puedes unirte a otro. Primero sal de él desde «Mi equipo».`;

type Carga =
  | { f: "cargando" }
  | { f: "sinSesion" }
  | { f: "listo"; estado: EstadoEquipos };

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

export default function Equipos() {
  const router = useRouter();
  const [carga, setCarga] = useState<Carga>({ f: "cargando" });
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [personas, setPersonas] = useState<PersonaBusca[]>([]);
  const [equipos, setEquipos] = useState<EquipoAbierto[]>([]);
  const [pend, setPend] = useState<Pendientes | null>(null);
  const [mio, setMio] = useState<MiEquipoDetalle | null>(null);
  const [intento, setIntento] = useState<string | null>(null);   // a qué equipo quiso entrar teniendo ya uno
  const [pestana, setPestana] = useState<"equipos" | "personas">("equipos");
  const [ahora, setAhora] = useState(0);

  // perfil
  const [buscando, setBuscando] = useState(false);
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [frase, setFrase] = useState("");
  // crear equipo
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [busco, setBusco] = useState<string[]>([]);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setAhora(Date.now());
    try {
      const { data } = await navegador().auth.getSession();
      if (!data.session) { setCarga({ f: "sinSesion" }); return; }
    } catch { setCarga({ f: "sinSesion" }); return; }
    const r = await llamar<EstadoEquipos>("equipos_estado");
    if (!r.ok) { setCarga({ f: "sinSesion" }); setAviso({ tipo: "error", texto: r.motivo }); return; }
    const e = r.data;
    setAhora(Date.now());
    setBuscando(e.perfil.buscando); setHabilidades(e.perfil.habilidades); setFrase(e.perfil.frase ?? "");
    setCarga({ f: "listo", estado: e });
    if (e.abierto && e.puede && !e.tiene_equipo) {
      const [a, b, c] = await Promise.all([llamar<PersonaBusca[]>("equipos_buscan_gente"), llamar<EquipoAbierto[]>("equipos_abiertos"), llamar<Pendientes>("equipo_pendientes")]);
      if (a.ok) setPersonas(a.data);
      if (b.ok) setEquipos(b.data);
      if (c.ok) setPend(c.data);
    }
    if (e.abierto && e.puede && e.tiene_equipo) {
      const [d, b] = await Promise.all([llamar<MiEquipoDetalle | null>("mi_equipo_detalle"), llamar<EquipoAbierto[]>("equipos_abiertos")]);
      if (d.ok) setMio(d.data);
      if (b.ok) setEquipos(b.data);
    }
  }, []);

  useEffect(() => {
    // Consulta al abrir la página; los estados se fijan cuando responde la base.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  async function accion(clave: string, fn: () => Promise<{ ok: boolean; motivo?: string }>, exito?: string) {
    setOcupado(clave); setAviso(null);
    const r = await fn();
    setOcupado(null);
    if (!r.ok) { setAviso({ tipo: "error", texto: r.motivo ?? "No pudimos completar la acción." }); await cargar(); return false; }   // lo que se ve pudo quedar viejo
    if (exito) setAviso({ tipo: "ok", texto: exito });
    await cargar();
    return true;
  }

  if (carga.f === "cargando") {
    return <p className="rg-help" style={{ display: "flex", gap: 12, alignItems: "center" }}><Loader2 className="size-6 animate-spin text-lavender" aria-hidden /> Cargando…</p>;
  }

  const antesDeAbrir = ahora < new Date(EQUIPOS_ABRE).getTime();

  if (carga.f === "sinSesion") {
    if (antesDeAbrir) return <Pronto abre={EQUIPOS_ABRE} cierra={EQUIPOS_CIERRA} />;
    return (
      <div className="box" style={{ marginTop: 26 }}>
        <p className="box-h">Entra para formar tu equipo</p>
        <p className={s.sub}>Esta página es para quienes tienen su lugar en la hackathon. Entra con tu correo y tu código de 6 números.</p>
        {aviso && <p className="rg-msg err" style={{ marginTop: 12 }}>{aviso.texto}</p>}
        <div className="rg-actions"><Link href="/mi-inscripcion" className="more solid">Entrar a mi panel <ArrowRight aria-hidden size={14} /></Link></div>
      </div>
    );
  }

  const e = carga.estado;

  if (!e.abierto && antesDeAbrir) {
    const nota: Record<string, string> = {
      no_inscrito: "Los equipos son para quienes están inscritos en la hackathon.",
      en_espera: "Estás en la lista de espera: si subes, confirma tu lugar para poder formar equipo.",
      sin_confirmar: "Tu lugar todavía no está confirmado: confírmalo en tu panel antes de la apertura.",
    };
    return <Pronto abre={e.abre} cierra={e.cierra} nota={nota[e.motivo]} />;
  }

  if (!e.puede) {
    const texto: Record<string, string> = {
      no_inscrito: "Los equipos son para quienes están inscritos en la hackathon. Si tu inscripción es solo al bootcamp, puedes seguir las sesiones; la hack tiene cupos limitados.",
      en_espera: "Estás en la lista de espera. Cuando un lugar se libere y subas, confirma tu lugar y aquí podrás formar equipo. Te avisamos por correo.",
      sin_confirmar: "Antes de formar equipo confirma tu lugar en la hackathon: toca «Confirmo que participaré» en tu panel, o canjea tu código en el Discord.",
      sin_perfil: "No encontramos tu inscripción. Entra a tu panel para completarla.",
    };
    return (
      <div className="box" style={{ marginTop: 26 }}>
        <p className="box-h">Todavía no puedes formar equipo</p>
        <p className={s.sub}>{texto[e.motivo] ?? texto.sin_confirmar}</p>
        <div className="rg-actions"><Link href="/mi-inscripcion" className="more solid">Ir a mi panel <ArrowRight aria-hidden size={14} /></Link></div>
      </div>
    );
  }

  if (!e.abierto) {
    const antes = ahora < new Date(e.abre).getTime();
    return (
      <div className="box" style={{ marginTop: 26 }}>
        <p className="box-h">{antes ? "Muy pronto" : "El armado de equipos cerró"}</p>
        <p className={s.sub}>
          {antes
            ? `La plataforma para armar equipos se abre el ${fechaLima(e.abre)} (hora de Lima) y está abierta hasta el ${fechaLima(e.cierra)}. Mientras tanto, confirma tu lugar y completa tu perfil en tu panel.`
            : "Ya cerró el plazo para armar equipos. Si ya estás en un equipo, entra a su página."}
        </p>
        <div className="rg-actions">
          {e.tiene_equipo && <Link href="/equipos/mi-equipo" className="more solid">Mi equipo <ArrowRight aria-hidden size={14} /></Link>}
          <Link href="/mi-inscripcion" className="more">Mi panel</Link>
        </div>
      </div>
    );
  }

  if (e.tiene_equipo) {
    const otros = equipos.filter((t) => t.id !== mio?.id);
    return (
      <div className={s.col}>
        <div className="box">
          <p className="box-h">Ya tienes equipo</p>
          <p className={s.sub}>Entra a la página de tu equipo para ver a tus compañeros, sus datos de contacto y los entregables. Solo se puede estar en un equipo a la vez.</p>
          <div className="rg-actions"><Link href="/equipos/mi-equipo" className="more solid"><Users aria-hidden size={14} /> Ir a mi equipo <ArrowRight aria-hidden size={14} /></Link></div>
        </div>
        {mio && otros.length > 0 && (
          <div>
            <p className="box-h" style={{ marginBottom: 0 }}>Otros equipos que buscan gente ({otros.length})</p>
            <div className={s.lista}>
              {otros.map((t) => (
                <article key={t.id} className={s.tarjeta}>
                  <h3>{t.nombre}</h3>
                  <p className="meta" style={{ fontSize: ".85rem", color: "var(--mist)" }}>{t.n} de 4 · {t.miembros.map((m) => m.nombre).join(", ")}</p>
                  {t.descripcion && <p className={s.frase}>{t.descripcion}</p>}
                  <div className={s.acc}><Boton alClick={() => setIntento(t.id)}>Pedir unirme</Boton></div>
                  {intento === t.id && <p className="rg-msg err" role="alert">{yaTienes(mio)} <Link href="/equipos/mi-equipo" style={{ textDecoration: "underline" }}>Ir a mi equipo</Link></p>}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={s.col}>
      <div className={s.aviso}>
        <span aria-hidden>⚠</span>
        <p><b>Sin equipo no podrás enviar tu solución</b> ni competir. Todos los equipos construyen. Los equipos son de 2 a 4 personas; arma el tuyo o únete a uno antes del <b>{fechaLima(e.cierra)}</b></p>
      </div>

      {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`}>{aviso.texto}</p>}

      {pend && pend.recibidas.length > 0 && (
        <div className="box">
          <p className="box-h">Te invitaron a unirte</p>
          <div className={s.lista}>
            {pend.recibidas.map((v) => (
              <article key={v.id} className={s.tarjeta}>
                <h3>{v.equipo}</h3>
                <p className="meta" style={{ fontSize: ".85rem", color: "var(--mist)" }}>Líder: {v.lider} · {v.n} de 4 integrantes</p>
                {v.descripcion && <p className={s.frase}>{v.descripcion}</p>}
                <p className={s.sub} style={{ fontSize: ".8rem" }}>Al aceptar, tus compañeros verán tu correo, tu celular y tu Discord.</p>
                <div className={s.acc}>
                  <Boton solido ocupado={ocupado === `ok-${v.id}`} alClick={() => accion(`ok-${v.id}`, () => llamar("equipo_responder", { p_invite: v.id, p_acepta: true }))}><Check size={14} aria-hidden /> Aceptar</Boton>
                  <Boton ocupado={ocupado === `no-${v.id}`} alClick={() => accion(`no-${v.id}`, () => llamar("equipo_responder", { p_invite: v.id, p_acepta: false }))}>Rechazar</Boton>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="box">
        <p className="box-h">Tu perfil para el matching</p>
        <p className={s.sub}>Si activas «busco equipo», otras personas podrán verte e invitarte. Solo mostramos tu nombre, universidad, carrera, ciclo, nivel, habilidades y tu frase; <b>nunca tu correo ni tu celular</b> (esos solo los ven quienes están en tu equipo).</p>
        <div className={s.campo}>
          <label>Mis habilidades (hasta 5)</label>
          <SelectorHabilidades valor={habilidades} alCambiar={setHabilidades} />
        </div>
        <div className={s.campo}>
          <label htmlFor="eq-frase">Qué busco o qué aporto</label>
          <input id="eq-frase" className="rg-input" maxLength={140} value={frase} onChange={(ev) => setFrase(ev.target.value)} placeholder="Ej.: me gusta el backend y busco alguien de diseño" />
          <small>{frase.length}/140</small>
        </div>
        <label className="rg-consent" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={buscando} onChange={(ev) => setBuscando(ev.target.checked)} />
          <span>Busco equipo: quiero aparecer en la lista de personas disponibles.</span>
        </label>
        <div className="rg-actions">
          <Boton solido ocupado={ocupado === "perfil"} alClick={() => accion("perfil", () => llamar("equipo_perfil_guardar", { p_buscando: buscando, p_habilidades: habilidades, p_frase: frase }), "Perfil guardado.")}>Guardar mi perfil</Boton>
        </div>
      </div>

      <div className="box">
        <p className="box-h">Crear un equipo</p>
        <p className={s.sub}>Quien crea el equipo es la persona líder: invita gente o acepta solicitudes. Todavía no eligen track; eso se hace el viernes 27, en la presentación de sponsors de las 8:30 p. m.</p>
        {!creando ? (
          <div className="rg-actions"><Boton solido alClick={() => setCreando(true)}>Crear mi equipo</Boton></div>
        ) : (
          <>
            <div className={s.campo}>
              <label htmlFor="eq-nombre">Nombre del equipo</label>
              <input id="eq-nombre" className="rg-input" maxLength={40} value={nombre} onChange={(ev) => setNombre(ev.target.value)} placeholder="Ej.: Los Agentes" />
            </div>
            <div className={s.campo}>
              <label htmlFor="eq-desc">Qué quieren hacer (opcional)</label>
              <input id="eq-desc" className="rg-input" maxLength={240} value={descripcion} onChange={(ev) => setDescripcion(ev.target.value)} placeholder="Una línea sobre su idea o el tipo de reto que les interesa" />
            </div>
            <div className={s.campo}>
              <label>Perfiles que buscan</label>
              <SelectorHabilidades valor={busco} alCambiar={setBusco} />
            </div>
            <p className={s.sub} style={{ fontSize: ".82rem" }}>Al crear o unirte a un equipo, tus compañeros verán tu correo, tu celular y tu Discord para poder coordinarse.</p>
            <div className="rg-actions">
              <Boton solido ocupado={ocupado === "crear"} alClick={async () => { const ok = await accion("crear", () => llamar("equipo_crear", { p_nombre: nombre, p_descripcion: descripcion, p_buscando: busco })); if (ok) router.push("/equipos/mi-equipo"); }}>Crear equipo</Boton>
              <Boton alClick={() => setCreando(false)}>Cancelar</Boton>
            </div>
          </>
        )}
      </div>

      <div>
        <div className={s.pestanas} role="tablist">
          <button role="tab" className={s.pestana} aria-selected={pestana === "equipos"} onClick={() => setPestana("equipos")}>Equipos que buscan gente ({equipos.length})</button>
          <button role="tab" className={s.pestana} aria-selected={pestana === "personas"} onClick={() => setPestana("personas")}>Personas que buscan equipo ({personas.length})</button>
        </div>

        {pestana === "equipos" && (
          equipos.length === 0 ? (
            <div className={s.vacio} style={{ marginTop: 14 }}>Todavía no hay equipos abiertos. Crea el primero.</div>
          ) : (
            <div className={s.lista}>
              {equipos.map((t) => (
                <article key={t.id} className={s.tarjeta}>
                  <h3>{t.nombre}</h3>
                  <p className="meta" style={{ fontSize: ".85rem", color: "var(--mist)" }}>{t.n} de 4 · {t.miembros.map((m) => m.nombre).join(", ")}</p>
                  {t.descripcion && <p className={s.frase}>{t.descripcion}</p>}
                  {t.buscando.length > 0 && <><p style={{ fontSize: ".78rem", color: "var(--lav)", marginTop: 4 }}>Buscan:</p><Habilidades ids={t.buscando} /></>}
                  <div className={s.acc}>
                    {t.pedido
                      ? <span className="pill-ok"><Check size={12} aria-hidden /> Solicitud enviada</span>
                      : <Boton solido ocupado={ocupado === `pedir-${t.id}`} alClick={() => accion(`pedir-${t.id}`, () => llamar("equipo_solicitar", { p_team: t.id }), "Solicitud enviada: el líder te responderá.")}>Pedir unirme</Boton>}
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {pestana === "personas" && (
          personas.length === 0 ? (
            <div className={s.vacio} style={{ marginTop: 14 }}>Todavía nadie activó «busco equipo».</div>
          ) : (
            <>
              <p className={s.sub} style={{ marginTop: 12 }}>Para invitar a alguien, primero crea tu equipo: desde la página de tu equipo verás este mismo listado con el botón «Invitar».</p>
              <div className={s.lista}>{personas.map((p) => <TarjetaPersona key={p.id} p={p} />)}</div>
            </>
          )
        )}
      </div>

      {pend && pend.enviadas.length > 0 && (
        <div className="box">
          <p className="box-h">Tus solicitudes enviadas</p>
          <ul className={s.estado}>
            {pend.enviadas.map((v) => (
              <li key={v.id}>
                <span>Pediste unirte a <b style={{ color: "#fff" }}>{v.equipo}</b></span>
                <Boton ocupado={ocupado === `x-${v.id}`} alClick={() => accion(`x-${v.id}`, () => llamar("equipo_cancelar", { p_invite: v.id }))}>Cancelar</Boton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
