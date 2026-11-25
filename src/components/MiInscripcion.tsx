"use client";

/**
 * El panel de quien ya está inscrito: sus inscripciones, su card, su equipo y
 * sus datos.
 *
 * Desde aquí se suma lo que falta: quien entró solo a la hack puede apuntarse
 * a las sesiones del bootcamp con un clic, y quien entró solo al bootcamp ve
 * qué necesita para la hack.
 *
 * Lo que se puede cambiar es lo que cambia en la vida real (el celular, la
 * carrera, el ciclo). El nombre, el correo y la institución están verificados y
 * se muestran como lo que son: hechos, no campos.
 *
 * Sin sesión no pide contraseña: manda un enlace al correo. Es el mismo
 * mecanismo de la inscripción, así que no hay una contraseña más que recordar
 * ni una que se pueda filtrar.
 */

import SelectorCarrera from "@/components/SelectorCarrera";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, LogIn, LogOut, Mail, Video } from "lucide-react";
import { navegador, urlDelSitio } from "@/lib/supabase";
import { SESIONES } from "@/lib/contenido";
import { CICLOS, SLUG_OTRA, type Carrera } from "@/lib/carreras";
import { api, estaEn, inscripcionHack, numeroBonito, type Resumen } from "@/lib/resumen";
import { PAISES, PAIS_POR_DEFECTO, formatearE164, normalizarTelefono, paisPorCodigo } from "@/lib/telefono";
import ElegirClave from "./ElegirClave";
import TarjetaHack from "./TarjetaHack";
import SumarseHack from "./SumarseHack";
import ConfirmarAsistencia from "./ConfirmarAsistencia";
import { hackAbierta } from "@/lib/config";

const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;

type Vista =
  | { fase: "cargando" }
  | { fase: "sinSesion" }
  | { fase: "correoEnviado"; correo: string }
  | { fase: "sinInscripcion" }
  | { fase: "ficha"; resumen: Resumen };

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

export default function MiInscripcion() {
  const [vista, setVista] = useState<Vista>({ fase: "cargando" });
  const [token, setToken] = useState<string | null>(null);

  // borrador de edición
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [carreraId, setCarreraId] = useState("");
  const [carreraOtra, setCarreraOtra] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [nivel, setNivel] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [discord, setDiscord] = useState("");
  const [sponsors, setSponsors] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [avisoInsc, setAvisoInsc] = useState<Aviso>(null);
  // Enlaces de Zoom de las sesiones a las que está inscrita (salen de la base; solo los entrega a quien inició sesión).
  const [enlaces, setEnlaces] = useState<Record<string, { url: string; id: string; inicio: string | null; fin: string | null }>>({});
  const [ahora, setAhora] = useState<number | null>(null);

  const [correoEntrada, setCorreoEntrada] = useState("");
  const [claveEntrada, setClaveEntrada] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [enviandoEnlace, setEnviandoEnlace] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);

  /** Copia la ficha al formulario de edición. */
  const cargarEnFormulario = useCallback((r: Resumen) => {
    const p = r.person;
    const tel = p.phone ?? "";
    const pa = tel ? paisPorCodigo(tel.replace(/\D/g, "")) : null;
    setPais(pa?.iso ?? PAIS_POR_DEFECTO);
    setTelefono(tel ? formatearE164(tel).replace(/^\+\d+\s/, "") : "");
    setCarreraId(p.career_id ? String(p.career_id) : "");
    setCarreraOtra(p.career_other ?? "");
    setCiclo(p.cycle ? String(p.cycle) : "");
    setNivel(p.level ?? "");
    setLinkedin(p.linkedin_url ?? "");
    setGithub(p.github_url ?? "");
    setDiscord(p.discord_username ?? "");
    setSponsors(p.sponsors_consent === true);
  }, []);

  // El catálogo de carreras, para el selector de «Mis datos».
  useEffect(() => {
    (async () => {
      try {
        const { data } = await navegador().from("careers").select("id, slug, name, field").order("position");
        if (data) setCarreras(data as Carrera[]);
      } catch { /* el selector queda vacío: se vuelve a intentar al recargar */ }
    })();
  }, []);

  /** Pide la ficha al servidor y decide qué pantalla mostrar. */
  const cargarFicha = useCallback(async (acceso: string) => {
    setToken(acceso);
    window.dispatchEvent(new Event("hackcis:sesion"));   // el botón de arriba pasa a «Mi panel»
    try {
      const { datos } = await api("/api/perfil", { token: acceso });
      if (datos.ok && datos.resumen) {
        cargarEnFormulario(datos.resumen);
        setVista({ fase: "ficha", resumen: datos.resumen });
      } else if ((datos as { sinInscripcion?: boolean }).sinInscripcion) {
        // Confirmó el correo pero la inscripción no llegó a guardarse (por ejemplo,
        // abrió el enlace en otro navegador). Los datos siguen en su cuenta:
        // se completa ahora, sin hacerle llenar nada otra vez.
        const { datos: c } = await api("/api/completar", { metodo: "POST", token: acceso, cuerpo: {} });
        if (c.ok && c.resumen) {
          cargarEnFormulario(c.resumen);
          setVista({ fase: "ficha", resumen: c.resumen });
        } else {
          setVista({ fase: "sinInscripcion" });
        }
      } else {
        setVista({ fase: "sinSesion" });
      }
    } catch {
      setVista({ fase: "sinSesion" });
    }
  }, [cargarEnFormulario]);

  const hayFicha = vista.fase === "ficha";
  useEffect(() => {
    if (!hayFicha) return;
    let vivo = true;
    (async () => {
      try {
        const { data } = await navegador().rpc("mis_enlaces");
        if (!vivo) return;
        setAhora(Date.now());
        setEnlaces(Object.fromEntries(((data as { slug: string; url: string; id: string; inicio: string | null; fin: string | null }[] | null) ?? []).map((e) => [e.slug, e])));
      } catch { /* sin enlaces: el botón simplemente no aparece y queda la página de la sesión */ }
    })();
    return () => { vivo = false; };
  }, [hayFicha]);

  /** Entrar con correo y contraseña. */
  async function entrarConClave() {
    const correo = correoEntrada.trim().toLowerCase();
    if (!correo.includes("@") || !claveEntrada) {
      setAviso({ tipo: "error", texto: "Escribe tu correo y tu contraseña." });
      return;
    }
    setEntrando(true);
    setAviso(null);
    try {
      const { data, error } = await navegador().auth.signInWithPassword({ email: correo, password: claveEntrada });
      if (error || !data.session) {
        // Un mensaje igual para correo inexistente y clave errada: decir cuál
        // de los dos falló le confirma a un desconocido qué correos existen.
        setAviso({ tipo: "error", texto: "Correo o contraseña incorrectos." });
        return;
      }
      setClaveEntrada("");
      setVista({ fase: "cargando" });
      await cargarFicha(data.session.access_token);
    } catch {
      setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
    } finally {
      setEntrando(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await navegador().auth.getSession();
        if (!data.session) { setVista({ fase: "sinSesion" }); return; }
        await cargarFicha(data.session.access_token);
      } catch {
        setVista({ fase: "sinSesion" });
      }
    })();
    // Al montar. No lleva bandera de «sigue montado»: con el guardia de
    // arriba, apagarla dejaría la pantalla cargando para siempre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pedirEnlace() {
    const correo = correoEntrada.trim().toLowerCase();
    if (!correo.includes("@")) { setAviso({ tipo: "error", texto: "Escribe tu correo." }); return; }
    setEnviandoEnlace(true);
    setAviso(null);
    try {
      const { error } = await navegador().auth.signInWithOtp({
        email: correo,
        options: { shouldCreateUser: false, emailRedirectTo: `${urlDelSitio()}/mi-inscripcion` },
      });
      if (error) {
        // shouldCreateUser: false hace que un correo no inscrito falle aquí.
        setAviso({
          tipo: "error",
          texto: /rate|seconds|limit/i.test(error.message)
            ? "Ya te mandamos un enlace hace poco. Revisa tu bandeja."
            : "No encontramos una inscripción con ese correo. ¿Te inscribiste con otro?",
        });
        return;
      }
      setVista({ fase: "correoEnviado", correo });
    } finally {
      setEnviandoEnlace(false);
    }
  }

  /**
   * Entrar con el código de 6 dígitos que llega en el mismo correo que el enlace. Sirve a
   * quien su bandeja (por ejemplo la de algunas universidades) abre el enlace antes que él
   * y lo deja inservible: el código no se gasta porque nadie lo «visita».
   */
  async function entrarConCodigo(correo: string) {
    const limpio = codigo.replace(/\D/g, "");
    if (limpio.length !== 6) { setAviso({ tipo: "error", texto: "El código tiene 6 números." }); return; }
    setVerificando(true);
    setAviso(null);
    try {
      const { data, error } = await navegador().auth.verifyOtp({ email: correo, token: limpio, type: "email" });
      if (error || !data.session) {
        setAviso({ tipo: "error", texto: "Ese código no es válido o ya venció. Usa el del último correo que te llegó." });
        return;
      }
      setCodigo("");
      setVista({ fase: "cargando" });
      await cargarFicha(data.session.access_token);
    } catch {
      setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
    } finally {
      setVerificando(false);
    }
  }

  /** Inscribirse a algo más (una sesión del bootcamp, o la hack). */
  async function matricular(slug: string) {
    if (!token) return;
    setOcupado(slug);
    setAvisoInsc(null);
    const { datos } = await api("/api/matricular", { metodo: "POST", token, cuerpo: { slug } });
    setOcupado(null);
    if (datos.ok && datos.resumen) {
      setVista({ fase: "ficha", resumen: datos.resumen });
      setAvisoInsc({ tipo: "ok", texto: "Listo, quedaste inscrito." });
    } else {
      setAvisoInsc({ tipo: "error", texto: datos.motivo ?? "No pudimos inscribirte." });
    }
  }

  async function guardar() {
    if (!token) return;
    setGuardando(true);
    setAviso(null);
    try {
      const { datos } = await api("/api/perfil", {
        metodo: "PATCH", token,
        cuerpo: {
          telefono, pais, linkedin, github, discord, sponsors,
          ...(carreraId ? { carrera_id: Number(carreraId), carrera_otra: carreraOtra } : {}),
          ...(ciclo ? { ciclo: Number(ciclo) } : {}),
          nivel: nivel || null,
        },
      });
      if (datos.ok && datos.resumen) {
        cargarEnFormulario(datos.resumen);
        setVista({ fase: "ficha", resumen: datos.resumen });
        setAviso({ tipo: "ok", texto: "Guardado." });
      } else {
        setAviso({ tipo: "error", texto: datos.motivo ?? "No pudimos guardar los cambios." });
      }
    } catch {
      setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
    } finally {
      setGuardando(false);
    }
  }

  async function salir() {
    await navegador().auth.signOut();
    window.dispatchEvent(new Event("hackcis:sesion"));   // el botón de arriba vuelve a «Inscríbete»
    setVista({ fase: "sinSesion" });
    setToken(null);
  }

  // ── pantallas ──

  if (vista.fase === "cargando") {
    return (
      <p className="rg-help" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Loader2 className="size-6 animate-spin text-lavender" aria-hidden /> Cargando tu panel…
      </p>
    );
  }

  if (vista.fase === "correoEnviado") {
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">Enlace y código enviados</p>
        <h1 className="rg-q">Revisa tu<br /><span>correo</span></h1>
        <p className="rg-help">
          Te mandamos un correo a <strong style={{ color: "#fff" }}>{vista.correo}</strong>. Toca el botón
          que trae y entras sin contraseña. Mira también en spam.
        </p>
        <p className="rg-help" style={{ marginTop: 18 }}>
          ¿El enlace ya no funciona o se abrió en otro lado? Escribe aquí el <strong style={{ color: "#fff" }}>código de
          6 números</strong> que viene en el mismo correo:
        </p>
        <div className="rg-body">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => { if (e.key === "Enter") entrarConCodigo(vista.correo); }}
            inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label="Código de 6 números"
            className="rg-input" style={{ letterSpacing: "0.5em", textAlign: "center", fontSize: "1.6rem" }}
          />
        </div>
        {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`} style={{ marginTop: 14 }}>{aviso.texto}</p>}
        <div className="rg-actions">
          <button onClick={() => entrarConCodigo(vista.correo)} disabled={verificando || codigo.length !== 6} className="more solid">
            {verificando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
            Entrar con el código
          </button>
          <button onClick={() => { setAviso(null); setCodigo(""); setVista({ fase: "sinSesion" }); }} className="more">
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (vista.fase === "sinSesion") {
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">Tu inscripción</p>
        <h1 className="rg-q">Entra a<br /><span>tu panel</span></h1>
        <p className="rg-help">Con el correo con el que te inscribiste y la contraseña que elegiste.</p>
        <div className="rg-body rg-two">
          <input
            value={correoEntrada} onChange={(e) => setCorreoEntrada(e.target.value)}
            type="email" autoComplete="email" placeholder="tu@correo.com" aria-label="Correo" className="rg-input"
          />
          <input
            value={claveEntrada} onChange={(e) => setClaveEntrada(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") entrarConClave(); }}
            type="password" autoComplete="current-password" placeholder="tu contraseña" aria-label="Contraseña" className="rg-input"
          />
        </div>
        {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`} style={{ marginTop: 14 }}>{aviso.texto}</p>}
        <div className="rg-actions">
          <button onClick={entrarConClave} disabled={entrando} className="more solid">
            {entrando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
            Entrar
          </button>
          {/* El enlace por correo deja de ser la puerta principal y pasa a ser
              la salida de emergencia: quien olvidó su contraseña entra igual y
              la cambia desde dentro. */}
          <button onClick={pedirEnlace} disabled={enviandoEnlace} className="more">
            {enviandoEnlace ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
            Olvidé mi contraseña
          </button>
        </div>
        <p className="rg-small">
          ¿aún no te inscribes? <Link href="/registro">hazlo aquí</Link>
        </p>
      </div>
    );
  }

  if (vista.fase === "sinInscripcion") {
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">Casi</p>
        <h1 className="rg-q">Aún no<br /><span>te inscribes</span></h1>
        <p className="rg-help">Tu correo está verificado, pero falta llenar el formulario.</p>
        <div className="rg-actions">
          <Link href="/registro" className="more solid">Completar mi inscripción <ArrowRight aria-hidden size={14} /></Link>
        </div>
      </div>
    );
  }

  const r = vista.resumen;
  const p = r.person;
  const hack = inscripcionHack(r);

  return (
    <div className="page-w animate-pop-in">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p className="rg-step" style={{ marginTop: 0 }}>Tu panel</p>
          <h1 className="rg-q" style={{ fontSize: "clamp(2.2rem,9vw,4rem)" }}>{p.display_name}</h1>
        </div>
        <button onClick={salir} className="more" style={{ marginTop: 6 }}>
          <LogOut className="size-4" aria-hidden /> Salir
        </button>
      </div>

      {hack && (
        <div className="box" style={{ marginTop: 26 }}>
          <TarjetaHack
            persona={p}
            hack={hack}
            token={token}
            alCambiarFoto={(url) => setVista({ fase: "ficha", resumen: { ...r, person: { ...p, photo_url: url } } })}
          />
        </div>
      )}

      {hack && (
        <div style={{ marginTop: 26 }}>
          <ConfirmarAsistencia modo={{ tipo: "panel" }} />
        </div>
      )}

      {!hack && !p.verified && token && hackAbierta() && (
        <div style={{ marginTop: 26 }}>
          <SumarseHack
            persona={p}
            token={token}
            carreras={carreras}
            alListo={(nuevo) => {
              setVista({ fase: "ficha", resumen: nuevo });
              setAvisoInsc({ tipo: "ok", texto: "¡Listo! Ya estás inscrito en la hackathon." });
            }}
          />
        </div>
      )}

      <div className="box" style={{ marginTop: hack || (!p.verified && token) ? 18 : 26 }}>
        <p className="box-h">Mis inscripciones</p>
        <p style={{ margin: "0 0 14px", color: "var(--mist)", fontSize: ".92rem", lineHeight: 1.5 }}>
          Cuando empiece tu sesión del bootcamp, entra a esta misma página y toca <b style={{ color: "#fff" }}>«Unirme en Zoom»</b>:
          el enlace está aquí mientras la sesión está en curso. También lo ves en la página de cada sesión y en tu card privada.
        </p>
        <ul className="rows">
          <li>
            <div>
              <b>Hackathon</b>
              <small>
                {hack
                  ? `Inscrito n.º ${numeroBonito(hack.number)} · 30 nov – 5 dic`
                  : !hackAbierta() ? "Las inscripciones a la hackathon ya cerraron"
                  : p.verified ? "30 nov – 5 dic · cierra el 25 nov, 11:59 p. m." : p.institution ? "Completa los datos de arriba para sumarte" : "Necesita correo institucional: mira arriba"}
              </small>
            </div>
            {hack ? (
              <span className="pill-ok"><Check size={12} aria-hidden /> inscrito</span>
            ) : p.verified && hackAbierta() ? (
              <button className="more" style={{ marginTop: 0 }} disabled={ocupado === "hack"} onClick={() => matricular("hack")}>
                {ocupado === "hack" && <Loader2 className="size-4 animate-spin" aria-hidden />} Inscribirme
              </button>
            ) : null}
          </li>
          {SESIONES.map((s) => (
            <li key={s.slug}>
              <div>
                <b>{s.title}</b>
                <small>Bootcamp · virtual</small>
              </div>
              {estaEn(r, s.slug) ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {(() => {
                    const z = enlaces[s.slug];
                    if (!z) return null;
                    const vivo = ahora != null && z.inicio && z.fin ? ahora >= new Date(z.inicio).getTime() - 15 * 60_000 && ahora <= new Date(z.fin).getTime() : false;
                    const termino = ahora != null && z.fin ? ahora > new Date(z.fin).getTime() : false;
                    if (termino) return null;
                    return (
                      <a href={z.url} target="_blank" rel="noopener noreferrer" className={`more solid${vivo ? " vivo" : ""}`} style={{ padding: "8px 14px", marginTop: 0 }}>
                        <Video aria-hidden size={14} /> {vivo ? "En vivo · Unirme" : "Unirme en Zoom"}
                      </a>
                    );
                  })()}
                  <Link href={`/bootcamp/${s.n}`} className="pill-ok"><Check size={12} aria-hidden /> inscrito</Link>
                </div>
              ) : (
                <button className="more" style={{ marginTop: 0 }} disabled={ocupado === s.slug} onClick={() => matricular(s.slug)}>
                  {ocupado === s.slug && <Loader2 className="size-4 animate-spin" aria-hidden />} Inscribirme
                </button>
              )}
            </li>
          ))}
        </ul>
        {avisoInsc && <p className={`rg-msg ${avisoInsc.tipo === "ok" ? "ok" : "err"}`} style={{ marginTop: 14 }}>{avisoInsc.texto}</p>}
      </div>

      {hack && (
        <div className="box">
          <p className="box-h">Mi equipo</p>
          {r.team ? (
            <>
              <p style={{ fontFamily: "var(--display)", fontWeight: 700, textTransform: "uppercase", fontSize: "1.8rem", lineHeight: 1 }}>
                {r.team.name}
              </p>
              <p className="rg-help" style={{ marginTop: 6 }}>Track: <strong style={{ color: "#fff" }}>{r.team.track_name ?? "se elige el viernes 27"}</strong></p>
              <ul className="team-list" style={{ marginTop: 12 }}>
                {r.team.members.map((m) => (
                  <li key={m.name}>
                    <Check size={14} aria-hidden className="text-glow" /> <b>{m.name}</b>{m.leader && <span className="pill-ok">líder</span>}
                  </li>
                ))}
              </ul>
              <Link href="/equipos/mi-equipo" className="more solid" style={{ marginTop: 14 }}>Ir a mi equipo <ArrowRight aria-hidden size={14} /></Link>
            </>
          ) : (
            <>
              <p className="rg-help" style={{ marginTop: 0 }}>
                Todavía no tienes equipo. La plataforma para armarlo se abre el miércoles 25 de noviembre a las 8:00 p. m. y
                cierra el jueves 26 a las 11:59 p. m. Después, el viernes 27 a las 8:30 p. m., en la presentación de sponsors, el líder de cada equipo elige el track.
              </p>
              <Link href="/equipos" className="more solid" style={{ marginTop: 14 }}>Arma tu equipo <ArrowRight aria-hidden size={14} /></Link>
            </>
          )}
        </div>
      )}

      <div className="box">
        <p className="box-h">Mis datos</p>
        <p className="rg-help" style={{ marginTop: 0 }}>
          <Check size={14} aria-hidden className="text-glow" style={{ display: "inline", marginRight: 6 }} />
          <strong style={{ color: "#fff" }}>{p.email}</strong>
          {p.institution ? <> · {p.institution}</> : null}
          <br /><span className="rg-small" style={{ marginTop: 6, display: "inline-block" }}>nombre, correo e institución no se pueden cambiar</span>
        </p>

        <div className="rg-two" style={{ marginTop: 22 }}>
          <div>
            <label className="rg-lbl" htmlFor="mi-tel">Celular</label>
            <div className="rg-tel">
              <select value={pais} onChange={(e) => setPais(e.target.value)} aria-label="País" className="rg-sel">
                {PAISES.map((x) => <option key={x.iso} value={x.iso}>{x.bandera} +{x.codigo}</option>)}
              </select>
              <input id="mi-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" className="rg-input" />
            </div>
            {telefono && !normalizarTelefono(telefono, pais).ok && (
              <p className="rg-msg err" style={{ marginTop: 8 }}>{(normalizarTelefono(telefono, pais) as { motivo: string }).motivo}</p>
            )}
          </div>

          {p.verified && (
            <>
              <div>
                <label className="rg-lbl" htmlFor="mi-carrera">Carrera</label>
                <SelectorCarrera id="mi-carrera" carreras={carreras} valor={carreraId} alElegir={setCarreraId} />
                {carreras.find((c) => String(c.id) === carreraId)?.slug === SLUG_OTRA && (
                  <input value={carreraOtra} onChange={(e) => setCarreraOtra(e.target.value.slice(0, 60))} placeholder="¿Cuál es tu carrera?" aria-label="Otra carrera" className="rg-input" style={{ marginTop: 14 }} />
                )}
                <p className="rg-lbl" style={{ marginTop: 18 }}>Ciclo</p>
                <div className="rg-chips">
                  {CICLOS.map((a) => (
                    <button key={a} type="button" className="rg-chip rg-year" onClick={() => setCiclo(String(a))} aria-pressed={ciclo === String(a)}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="rg-lbl">Nivel</p>
                <div className="rg-chips">
                  {NIVELES.map((n) => (
                    <button key={n} type="button" className="rg-chip" onClick={() => setNivel(nivel === n ? "" : n)} aria-pressed={nivel === n}>{n}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="rg-lbl" htmlFor="mi-gh">GitHub (opcional)</label>
            <input id="mi-gh" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/tuusuario" className="rg-input" />
          </div>
          <div>
            <label className="rg-lbl" htmlFor="mi-dc">Usuario de Discord (opcional)</label>
            <input id="mi-dc" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="tuusuario" className="rg-input" />
          </div>
          <div>
            <label className="rg-lbl" htmlFor="mi-in">LinkedIn (opcional)</label>
            <input id="mi-in" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/tuusuario" className="rg-input" />
          </div>
        </div>

        <label className="rg-consent" style={{ marginTop: 26 }}>
          <input type="checkbox" checked={sponsors} onChange={(e) => setSponsors(e.target.checked)} />
          <span>
            <strong style={{ color: "#fff" }}>Quiero que las empresas sponsor me conozcan.</strong> Al terminar el evento
            compartirán mi perfil (nombre, universidad, carrera, ciclo, correo, celular y mis redes) para oportunidades de
            prácticas y empleo. Puedo cambiarlo cuando quiera.
          </span>
        </label>

        <div className="rg-actions">
          <button onClick={guardar} disabled={guardando} className="more solid">
            {guardando && <Loader2 className="size-4 animate-spin" aria-hidden />} Guardar cambios
          </button>
          {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`}>{aviso.texto}</p>}
        </div>
      </div>

      <div className="box">
        <ElegirClave
          titulo="Cambiar mi contraseña"
          ayuda="Si la olvidaste, puedes pedir un enlace al correo y cambiarla desde aquí."
          textoBoton="Cambiar contraseña"
        />
      </div>
    </div>
  );
}
