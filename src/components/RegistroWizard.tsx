"use client";

/**
 * Formulario de inscripción: una pregunta por pantalla.
 *
 * Primero se elige qué quiere hacer la persona (la hack sola, la hack con el
 * bootcamp, o solo el bootcamp) y de ahí salen las preguntas que siguen:
 *
 *   con hack        DNI · nombre · correo institucional · celular · carrera · redes
 *   solo bootcamp   nombre · correo (cualquiera) · celular (opcional) · redes
 *
 * «Redes» es opcional en los dos: LinkedIn, GitHub, Discord y cómo se enteró.
 *
 * El correo institucional se verifica contra el servidor apenas la persona lo
 * escribe, y la universidad aparece en el acto. El DNI y el nombre los escribe
 * la persona: el DNI solo se revisa en su forma y se guarda como huella.
 *
 * Al final NO queda inscrita: queda un correo enviado. La inscripción nace
 * cuando abre ese correo, y por eso el correo prueba algo.
 *
 * El track ya no se elige aquí: lo elige el equipo el viernes 27/11.
 *
 * El progreso se guarda en el navegador para que una señal que se corta no
 * obligue a empezar de nuevo. El DNI nunca entra en ese borrador.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail, TriangleAlert, X } from "lucide-react";
import { CLAVE_BOLETO, EVENT } from "@/lib/config";
import { SESIONES } from "@/lib/contenido";
import { CICLOS, SLUG_OTRA, limpiarCarrera, porArea, type Carrera } from "@/lib/carreras";
import { ORIGENES, normalizarDiscord, normalizarGithub, normalizarLinkedin } from "@/lib/contacto";
import { navegador } from "@/lib/supabase";
import { PAISES, PAIS_POR_DEFECTO, normalizarTelefono } from "@/lib/telefono";

const BORRADOR = "hackcis-registro-v3";

type Plan = "hack_bootcamp" | "bootcamp";

const PLANES: { id: Plan; titulo: string; desc: string; marca?: string }[] = [
  {
    id: "hack_bootcamp",
    titulo: "Hack + Bootcamp",
    desc: "La hackathon (hasta 250 cupos) y el bootcamp, que es parte de la experiencia: eliges las sesiones que quieras.",
    marca: "Recomendado",
  },
  { id: "bootcamp", titulo: "Solo bootcamp", desc: "Abierto a todos: sin DNI ni correo institucional. Eliges las sesiones." },
];

const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;

type EstadoCampo = "vacio" | "cargando" | "ok" | "aviso" | "error";
type Campo = { valor: string; estado: EstadoCampo; mensaje?: string };
const vacio: Campo = { valor: "", estado: "vacio" };

type Borrador = {
  correo: string; telefono: string; pais: string; carreraId: string; carreraOtra: string; ciclo: string; nivel: string;
  linkedin: string; github: string; discord: string; origen: string;
  nombres: string; apellidos: string;
};

function leerBorrador(): Partial<Borrador> {
  try { return JSON.parse(localStorage.getItem(BORRADOR) ?? "{}") ?? {}; }
  catch { return {}; }          // modo privado o almacenamiento bloqueado
}

/** Lo que trae el enlace: /registro?plan=bootcamp&sesion=03 */
function leerEnlace() {
  const q = new URLSearchParams(window.location.search);
  const plan = q.get("plan") as Plan | null;
  const sesiones = (q.get("sesion") ?? "")
    .split(",")
    .map((n) => `bootcamp-${n.trim().padStart(2, "0")}`)
    .filter((s) => SESIONES.some((x) => x.slug === s));
  // «hack» a secas ya no existe: quien llega con un enlace viejo entra por hack + bootcamp.
  const efectivo = (plan as string | null) === "hack" ? "hack_bootcamp" : plan;
  return { plan: efectivo && PLANES.some((p) => p.id === efectivo) ? efectivo : null, sesiones };
}

async function post(ruta: string, cuerpo: unknown) {
  const res = await fetch(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  return { codigo: res.status, datos: await res.json() };
}

// ───────────────────────────────────────────────────────────── piezas ──

function Senal({ estado }: { estado: EstadoCampo }) {
  if (estado === "cargando") return <Loader2 className="size-5 animate-spin text-lavender" aria-hidden />;
  if (estado === "ok") return <Check className="size-5 text-glow" aria-hidden />;
  if (estado === "aviso") return <TriangleAlert className="size-5 text-amber-300" aria-hidden />;
  if (estado === "error") return <X className="size-5 text-magenta" aria-hidden />;
  return null;
}

function Barra({ paso, total }: { paso: number; total: number }) {
  return (
    <div className="pips" role="progressbar" aria-valuenow={paso + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <i key={i} className={i <= paso ? "on" : ""} />
      ))}
    </div>
  );
}

function Pregunta({ titulo, ayuda, children }: { titulo: React.ReactNode; ayuda?: string; children: React.ReactNode }) {
  return (
    <div className="animate-pop-in">
      <h1 className="rg-q">{titulo}</h1>
      {ayuda && <p className="rg-help">{ayuda}</p>}
      <div className="rg-body">{children}</div>
    </div>
  );
}

function Pie({ campo, children }: { campo: Campo; children?: React.ReactNode }) {
  return (
    <div className="rg-foot" aria-live="polite">
      {campo.estado !== "vacio" && <span style={{ paddingTop: 2 }}><Senal estado={campo.estado} /></span>}
      <div style={{ flex: 1 }}>
        {campo.mensaje
          ? <p className={`rg-msg ${campo.estado === "error" ? "err" : "warn"}`}>{campo.mensaje}</p>
          : children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────── el wizard ──

export default function RegistroWizard() {
  const [sesionAbierta, setSesionAbierta] = useState<"cargando" | "si" | "no">("cargando");

  const [plan, setPlan] = useState<Plan | null>(null);
  const [sesiones, setSesiones] = useState<string[]>([]);
  const [paso, setPaso] = useState(0);

  // Este componente solo se monta en el navegador (ver RegistroCliente), así
  // que leer localStorage al inicializar es seguro: no hay HTML del servidor
  // con el que discrepar, que es lo que rompe la hidratación.
  const [dni, setDni] = useState<Campo>(vacio);
  const [correo, setCorreo] = useState<Campo>(() => ({ valor: leerBorrador().correo ?? "", estado: "vacio" }));
  const [telefono, setTelefono] = useState<Campo>(() => ({ valor: leerBorrador().telefono ?? "", estado: "vacio" }));
  const [pais, setPais] = useState(() => leerBorrador().pais ?? PAIS_POR_DEFECTO);
  const [carreraId, setCarreraId] = useState(() => leerBorrador().carreraId ?? "");
  const [carreraOtra, setCarreraOtra] = useState(() => leerBorrador().carreraOtra ?? "");
  const [ciclo, setCiclo] = useState(() => leerBorrador().ciclo ?? "");
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [linkedin, setLinkedin] = useState(() => leerBorrador().linkedin ?? "");
  const [github, setGithub] = useState(() => leerBorrador().github ?? "");
  const [discord, setDiscord] = useState(() => leerBorrador().discord ?? "");
  const [origen, setOrigen] = useState(() => leerBorrador().origen ?? "");
  const [nivel, setNivel] = useState(() => leerBorrador().nivel ?? "");
  const [nombres, setNombres] = useState(() => leerBorrador().nombres ?? "");
  const [apellidos, setApellidos] = useState(() => leerBorrador().apellidos ?? "");
  const [consiente, setConsiente] = useState(false);
  const [sponsors, setSponsors] = useState(false);

  const [universidad, setUniversidad] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; correo?: string; motivo?: string } | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const conHack = plan === "hack_bootcamp";
  const conBootcamp = plan === "bootcamp" || plan === "hack_bootcamp";

  // Las pantallas que toca recorrer según el plan elegido.
  const pasos: string[] = !plan
    ? ["plan"]
    : [
        "plan",
        ...(conBootcamp ? ["sesiones"] : []),
        ...(conHack ? ["dni", "nombre", "correo", "celular", "carrera"] : ["nombre", "correo", "celular"]),
        "redes",
        "confirmar",
      ];
  const actual = pasos[paso] ?? "plan";

  // Lo que trae el enlace (plan y sesión) y si ya hay una cuenta abierta.
  // Se hace después del primer pintado para no discrepar con el servidor.
  useEffect(() => {
    let vivo = true;
    (async () => {
      await Promise.resolve();
      if (!vivo) return;
      const e = leerEnlace();
      if (e.plan) { setPlan(e.plan); setSesiones(e.sesiones); setPaso(1); }
      try {
        const { data } = await navegador().auth.getSession();
        if (vivo) setSesionAbierta(data.session ? "si" : "no");
      } catch {
        if (vivo) setSesionAbierta("no");
      }
    })();
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BORRADOR, JSON.stringify({
        correo: correo.valor, telefono: telefono.valor, pais, carreraId, carreraOtra, ciclo, nivel, nombres, apellidos,
        linkedin, github, discord, origen,
      }));
    } catch { /* el borrador es un extra: que falle no interrumpe nada */ }
  }, [correo.valor, telefono.valor, pais, carreraId, carreraOtra, ciclo, nivel, nombres, apellidos, linkedin, github, discord, origen]);

  useEffect(() => { campoRef.current?.focus(); }, [paso, plan]);

  // Con el campo lleno, cada tecla más dispararía otra consulta. Guardamos lo
  // último que se preguntó para no repetir ni gastar créditos de más.
  const yaConsultado = useRef<Record<string, string>>({});
  const esNuevo = (campo: string, valor: string) => {
    if (yaConsultado.current[campo] === valor) return false;
    yaConsultado.current[campo] = valor;
    return true;
  };

  /** Para la hack el correo tiene que ser de una institución; para el bootcamp, cualquiera. */
  const verCorreo = useCallback(async (valor: string, soloFormato: boolean) => {
    if (!valor.includes("@")) return;
    if (soloFormato) {
      const bien = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor);
      setCorreo(bien
        ? { valor, estado: "ok" }
        : { valor, estado: "error", mensaje: "Ese correo no parece estar bien escrito." });
      return;
    }
    if (!esNuevo("correo", valor)) return;
    setCorreo((c) => ({ ...c, estado: "cargando", mensaje: undefined }));
    try {
      const { datos } = await post("/api/universidad", { correo: valor });
      if (!datos.ok) {
        setUniversidad("");
        setCorreo({ valor, estado: "error", mensaje: datos.motivo });
        return;
      }
      setUniversidad(datos.universidadNombre);
      setCorreo({ valor, estado: "ok" });
    } catch {
      setCorreo({ valor, estado: "error", mensaje: "No pudimos conectarnos. Inténtalo de nuevo." });
    }
  }, []);

  /** El teléfono se valida en el navegador: no necesita servidor. */
  const verTelefono = useCallback((valor: string, iso: string) => {
    if (!valor.trim()) { setTelefono({ valor, estado: "vacio" }); return; }
    const r = normalizarTelefono(valor, iso);
    setTelefono(r.ok
      ? { valor, estado: "ok", mensaje: undefined }
      : { valor, estado: "error", mensaje: r.motivo });
  }, []);

  // Quien vuelve con un borrador trae los campos llenos pero sin verificar: el
  // botón quedaría bloqueado sin que nada lo explique. Se revalidan solos al
  // llegar a cada pantalla.
  useEffect(() => {
    let vivo = true;
    // Fuera del render síncrono, y cancelable si la pantalla cambia.
    (async () => {
      await Promise.resolve();
      if (!vivo) return;
      if (actual === "correo" && correo.valor.includes("@") && correo.estado === "vacio") {
        verCorreo(correo.valor, !conHack);
      }
      if (actual === "celular" && telefono.valor.trim() && telefono.estado === "vacio") {
        verTelefono(telefono.valor, pais);
      }
    })();
    return () => { vivo = false; };
    // Solo al cambiar de pantalla: después, cada campo se verifica cuando la persona lo toca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual]);

  // El catálogo de carreras se pide al llegar a esa pantalla, no antes.
  useEffect(() => {
    if (actual !== "carrera" || carreras.length) return;
    let vivo = true;
    (async () => {
      try {
        const { data } = await navegador().from("careers").select("id, slug, name, field").order("position");
        if (vivo && data) setCarreras(data as Carrera[]);
      } catch { /* sin lista no se puede elegir: la pantalla lo avisa */ }
    })();
    return () => { vivo = false; };
  }, [actual, carreras.length]);

  async function enviar() {
    setEnviando(true);
    try {
      const { datos } = await post("/api/inscripcion", {
        plan, sesiones: conBootcamp ? sesiones : [],
        dni: dni.valor, correo: correo.valor, telefono: telefono.valor, pais,
        carrera_id: Number(carreraId), carrera_otra: carreraOtra, ciclo: Number(ciclo), nivel, nombres, apellidos,
        linkedin, github, discord, origen, sponsors,
      });
      if (datos.ok) {
        try {
          localStorage.removeItem(BORRADOR);
          // Lo recoge /bienvenida al volver del correo. Va firmado por el
          // servidor, así que tocarlo aquí solo lo invalida.
          if (datos.boleto) localStorage.setItem(CLAVE_BOLETO, datos.boleto);
        } catch { /* da igual: sin boleto se usan los metadatos del usuario */ }
        setResultado({ ok: true, correo: datos.correo });
      } else {
        setResultado({ ok: false, motivo: datos.motivo });
      }
    } catch {
      setResultado({ ok: false, motivo: "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  const carreraElegida = carreras.find((c) => String(c.id) === carreraId);
  const esOtra = carreraElegida?.slug === SLUG_OTRA;
  const carreraTexto = esOtra ? (limpiarCarrera(carreraOtra) ?? "Otra carrera") : (carreraElegida?.name ?? "");
  // Las redes son opcionales, pero si se escriben tienen que ser válidas.
  const liN = normalizarLinkedin(linkedin);
  const ghN = normalizarGithub(github);
  const dcN = normalizarDiscord(discord);
  const redesOk = liN.ok && ghN.ok && dcN.ok;
  const telOk = telefono.estado === "ok";
  const puedeSeguir =
    (actual === "plan" && plan !== null) ||
    (actual === "sesiones" && sesiones.length > 0) ||
    (actual === "dni" && dni.estado === "ok") ||
    (actual === "nombre" && nombres.trim().length >= 2 && apellidos.trim().length >= 2) ||
    (actual === "correo" && correo.estado === "ok") ||
    (actual === "celular" && (conHack ? telOk : telefono.estado === "vacio" || telOk)) ||
    (actual === "carrera" && carreraId !== "" && (!esOtra || limpiarCarrera(carreraOtra) !== null) && ciclo !== "") ||
    (actual === "redes" && redesOk) ||
    (actual === "confirmar" && consiente);

  const alternarSesion = (slug: string) =>
    setSesiones((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  const todas = sesiones.length === SESIONES.length;

  const bonito = (() => {
    const r = normalizarTelefono(telefono.valor, pais);
    return r.ok ? (r as { bonito: string }).bonito : telefono.valor;
  })();

  // ── ya hay una cuenta abierta ──
  if (sesionAbierta === "si" && !resultado) {
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">Ya estás dentro</p>
        <h1 className="rg-q">Tienes<br /><span>cuenta</span></h1>
        <p className="rg-help">
          Desde tu panel puedes inscribirte a la hackathon o a las sesiones del bootcamp que te falten.
        </p>
        <div className="rg-actions">
          <Link href="/mi-inscripcion" className="more solid">Ir a mi panel <ArrowRight aria-hidden size={14} /></Link>
        </div>
      </div>
    );
  }

  // ── pantalla de resultado ──
  if (resultado) {
    if (resultado.ok) {
      return (
        <div className="rg animate-pop-in">
          <p className="rg-step">Casi listo</p>
          <h1 className="rg-q">Revisa tu<br /><span>correo</span></h1>
          <p className="rg-help">
            Te mandamos un mensaje a <strong style={{ color: "#fff" }}>{resultado.correo}</strong>.
            Ábrelo y toca el enlace para confirmar tu inscripción. Si no aparece en un par de
            minutos, mira en spam o promociones.
          </p>
          <p className="rg-small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Mail className="size-4" aria-hidden /> Tu lugar queda reservado al confirmar
          </p>
        </div>
      );
    }
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">No pudimos</p>
        <h1 className="rg-q">Algo no<br /><span style={{ color: "#ff7ae6" }}>cuadra</span></h1>
        <p className="rg-help">{resultado.motivo}</p>
        <div className="rg-actions">
          <button className="more" onClick={() => { setResultado(null); setPaso(0); }}>Corregir mis datos</button>
        </div>
      </div>
    );
  }

  // ── formulario ──
  return (
    <div className="rg">
      <Barra paso={paso} total={plan ? pasos.length : 5} />
      <p className="rg-step">{plan ? `Paso ${paso + 1} de ${pasos.length}` : "Empieza aquí"}</p>

      {actual === "plan" && (
        <Pregunta
          titulo={<>¿Qué quieres<br /><span>hacer</span>?</>}
          ayuda="Puedes sumar lo que te falte más adelante desde tu panel."
        >
          <div className="rg-opts">
            {PLANES.map((p) => (
              <button
                key={p.id} type="button" className="rg-opt" aria-pressed={plan === p.id}
                onClick={() => {
                  setPlan(p.id);
                  // En la hack el bootcamp va incluido: se parte con todas las sesiones marcadas.
                  if (p.id === "hack_bootcamp") setSesiones((s) => (s.length ? s : SESIONES.map((x) => x.slug)));
                }}
              >
                <b>{p.titulo}{p.marca && <em>{p.marca}</em>}</b>
                <span>{p.desc}</span>
              </button>
            ))}
          </div>
        </Pregunta>
      )}

      {actual === "sesiones" && (
        <Pregunta
          titulo={<>Elige tus<br /><span>sesiones</span></>}
          ayuda="Bootcamp virtual del 23 al 27 de noviembre. Marca las que quieras; no cuesta nada y puedes cambiar después."
        >
          <div className="rg-opts">
            {SESIONES.map((s) => (
              <button key={s.slug} type="button" className="rg-opt" aria-pressed={sesiones.includes(s.slug)} onClick={() => alternarSesion(s.slug)}>
                <b>{s.title}</b>
                <span>{s.text}</span>
              </button>
            ))}
          </div>
          <div className="rg-actions" style={{ marginTop: 18 }}>
            <button type="button" className="rg-chip" aria-pressed={todas} onClick={() => setSesiones(todas ? [] : SESIONES.map((s) => s.slug))}>
              {todas ? "Quitar todas" : "Marcar todas"}
            </button>
          </div>
        </Pregunta>
      )}

      {actual === "dni" && (
        <Pregunta
          titulo={<>¿Cuál es<br />tu <span>DNI</span>?</>}
          ayuda="Lo usamos para evitar inscripciones repetidas y para que tu líder pueda sumarte a su equipo. Guardamos solo una huella cifrada, nunca el número."
        >
          <input
            ref={campoRef}
            value={dni.valor}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 8);
              if (v.length < 8) setDni({ valor: v, estado: "vacio" });
              else if (/^(\d)\1{7}$/.test(v)) setDni({ valor: v, estado: "error", mensaje: "Ese DNI no es válido." });
              else setDni({ valor: v, estado: "ok" });
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="8 dígitos"
            aria-label="DNI"
            className="rg-input dni tabular-nums"
          />
          <Pie campo={dni} />
        </Pregunta>
      )}

      {actual === "nombre" && (
        <Pregunta titulo={<>¿Cómo te<br /><span>llamas</span>?</>} ayuda={conHack ? "Tal como figura en tu DNI. Es el nombre de tu credencial." : "Tal como quieres que aparezca en tu constancia."}>
          <div className="rg-two">
            <div>
              <label className="rg-lbl" htmlFor="rg-nombres">Nombres</label>
              <input id="rg-nombres" ref={campoRef} value={nombres} onChange={(e) => setNombres(e.target.value.slice(0, 60))}
                autoComplete="given-name" placeholder="Rosa María" className="rg-input" />
            </div>
            <div>
              <label className="rg-lbl" htmlFor="rg-apellidos">Apellidos</label>
              <input id="rg-apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value.slice(0, 60))}
                autoComplete="family-name" placeholder="Pérez Gómez" className="rg-input" />
            </div>
          </div>
        </Pregunta>
      )}

      {actual === "correo" && (
        <Pregunta
          titulo={conHack ? <>¿Tu correo<br /><span>institucional</span>?</> : <>¿Cuál es<br />tu <span>correo</span>?</>}
          ayuda={conHack
            ? "El que te dio tu universidad o instituto. Te llegará ahí el enlace para confirmar."
            : "Puede ser cualquiera. Te llegará ahí el enlace para confirmar."}
        >
          <input
            ref={campoRef}
            value={correo.valor}
            onChange={(e) => setCorreo({ valor: e.target.value.trim().toLowerCase(), estado: "vacio" })}
            onBlur={(e) => verCorreo(e.target.value.trim().toLowerCase(), !conHack)}
            onKeyDown={(e) => { if (e.key === "Enter") verCorreo(correo.valor, !conHack); }}
            type="email"
            autoComplete="email"
            placeholder={conHack ? "tu.nombre@tuuniversidad.edu.pe" : "tu@correo.com"}
            aria-label="Correo"
            className="rg-input"
          />
          <Pie campo={correo}>
            {conHack && universidad && correo.estado === "ok" && (
              <p className="rg-msg" style={{ fontSize: "1.1rem" }}><strong>{universidad}</strong></p>
            )}
          </Pie>
        </Pregunta>
      )}

      {actual === "celular" && (
        <Pregunta
          titulo={<>Tu <span>celular</span></>}
          ayuda={conHack
            ? "Para avisarte de cambios de último minuto y coordinar tu equipo."
            : "Opcional. Solo lo usamos para avisarte de las sesiones."}
        >
          <div className="rg-tel">
            <select
              value={pais}
              onChange={(e) => { setPais(e.target.value); verTelefono(telefono.valor, e.target.value); }}
              aria-label="País del número"
              className="rg-sel"
            >
              {PAISES.map((p) => (
                <option key={p.iso} value={p.iso}>{p.bandera} +{p.codigo}</option>
              ))}
            </select>
            <input
              ref={campoRef}
              value={telefono.valor}
              onChange={(e) => setTelefono({ valor: e.target.value, estado: "vacio" })}
              onBlur={(e) => verTelefono(e.target.value, pais)}
              onKeyDown={(e) => { if (e.key === "Enter") verTelefono(telefono.valor, pais); }}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={PAISES.find((p) => p.iso === pais)?.ejemplo ?? "999 888 777"}
              aria-label="Número de celular"
              className="rg-input tabular-nums"
            />
          </div>
          <Pie campo={telefono}>
            {telOk && <p className="rg-msg" style={{ fontSize: "1.05rem" }}>Guardamos <strong>{bonito}</strong></p>}
          </Pie>
        </Pregunta>
      )}

      {actual === "carrera" && (
        <Pregunta titulo={<>¿Qué <span>estudias</span>?</>} ayuda="Elige tu carrera de la lista. Si no está, marca «Otra carrera» y escríbela.">
          <label className="rg-lbl" htmlFor="rg-carrera">Carrera</label>
          <select
            id="rg-carrera"
            value={carreraId}
            onChange={(e) => setCarreraId(e.target.value)}
            className="rg-sel"
            style={{ width: "100%" }}
          >
            <option value="">Elige tu carrera…</option>
            {porArea(carreras).map(([area, lista]) => (
              <optgroup key={area} label={area}>
                {lista.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          {carreras.length === 0 && <p className="rg-msg" style={{ marginTop: 10 }}>Cargando la lista…</p>}
          {esOtra && (
            <div style={{ marginTop: 22 }}>
              <label className="rg-lbl" htmlFor="rg-otra">¿Cuál es tu carrera?</label>
              <input id="rg-otra" value={carreraOtra} onChange={(e) => setCarreraOtra(e.target.value.slice(0, 60))}
                autoComplete="off" placeholder="Ingeniería Pesquera" className="rg-input" />
            </div>
          )}
          <p className="rg-lbl" style={{ marginTop: 28 }}>¿En qué ciclo vas?</p>
          <div className="rg-chips">
            {CICLOS.map((a) => (
              <button key={a} type="button" className="rg-chip rg-year" onClick={() => setCiclo(String(a))} aria-pressed={ciclo === String(a)}>
                {a}
              </button>
            ))}
          </div>
          <p className="rg-lbl" style={{ marginTop: 28 }}>¿Cómo te ves hoy? (opcional)</p>
          <div className="rg-chips">
            {NIVELES.map((n) => (
              <button key={n} type="button" className="rg-chip" onClick={() => setNivel(nivel === n ? "" : n)} aria-pressed={nivel === n}>
                {n}
              </button>
            ))}
          </div>
        </Pregunta>
      )}

      {actual === "redes" && (
        <Pregunta
          titulo={<>Tus <span>redes</span></>}
          ayuda="Todo esto es opcional. Nos sirve para que te encuentren tu equipo y los sponsors."
        >
          <div className="rg-two">
            <div>
              <label className="rg-lbl" htmlFor="rg-li">LinkedIn</label>
              <input id="rg-li" value={linkedin} onChange={(e) => setLinkedin(e.target.value.slice(0, 120))}
                autoComplete="off" placeholder="linkedin.com/in/tuusuario" className="rg-input" />
              {!liN.ok && <p className="rg-msg err" style={{ marginTop: 8 }}>{liN.motivo}</p>}
            </div>
            {conHack && (
              <div>
                <label className="rg-lbl" htmlFor="rg-gh">GitHub</label>
                <input id="rg-gh" value={github} onChange={(e) => setGithub(e.target.value.slice(0, 120))}
                  autoComplete="off" placeholder="tuusuario" className="rg-input" />
                {!ghN.ok && <p className="rg-msg err" style={{ marginTop: 8 }}>{ghN.motivo}</p>}
              </div>
            )}
            <div>
              <label className="rg-lbl" htmlFor="rg-dc">Usuario de Discord</label>
              <input id="rg-dc" value={discord} onChange={(e) => setDiscord(e.target.value.slice(0, 40))}
                autoComplete="off" placeholder="tuusuario" className="rg-input" />
              {!dcN.ok
                ? <p className="rg-msg err" style={{ marginTop: 8 }}>{dcN.motivo}</p>
                : conHack && <p className="rg-small" style={{ marginTop: 10 }}>Para entrar a los canales usarás tu código, que verás al confirmar tu correo.</p>}
            </div>
          </div>
          <p className="rg-lbl" style={{ marginTop: 28 }}>¿Cómo te enteraste?</p>
          <div className="rg-chips">
            {ORIGENES.map((o) => (
              <button key={o.id} type="button" className="rg-chip" aria-pressed={origen === o.id} onClick={() => setOrigen(origen === o.id ? "" : o.id)}>
                {o.nombre}
              </button>
            ))}
          </div>
        </Pregunta>
      )}

      {actual === "confirmar" && (
        <Pregunta titulo={<>¿Todo<br /><span>correcto</span>?</>} ayuda="Revisa antes de enviar.">
          <dl className="rg-sum">
            <div><dt>Quieres</dt><dd>{PLANES.find((p) => p.id === plan)?.titulo}</dd></div>
            {conBootcamp && (
              <div>
                <dt>Sesiones</dt>
                <dd>{sesiones.map((s) => SESIONES.find((x) => x.slug === s)?.n).join(" · ")}</dd>
              </div>
            )}
            <div><dt>Nombre</dt><dd>{`${nombres} ${apellidos}`}</dd></div>
            {conHack && <div><dt>Institución</dt><dd>{universidad || "—"}</dd></div>}
            <div><dt>Correo</dt><dd>{correo.valor}</dd></div>
            {(conHack || telOk) && <div><dt>Celular</dt><dd>{bonito}</dd></div>}
            {conHack && <div><dt>Carrera</dt><dd>{carreraTexto} · ciclo {ciclo}</dd></div>}
            {conHack && nivel && <div><dt>Nivel</dt><dd>{nivel}</dd></div>}
            {liN.ok && liN.valor && <div><dt>LinkedIn</dt><dd>{liN.valor.replace("https://www.", "")}</dd></div>}
            {ghN.ok && ghN.valor && conHack && <div><dt>GitHub</dt><dd>{ghN.valor.replace("https://", "")}</dd></div>}
            {dcN.ok && dcN.valor && <div><dt>Discord</dt><dd>{dcN.valor}</dd></div>}
          </dl>

          <label className="rg-consent">
            <input type="checkbox" checked={consiente} onChange={(e) => setConsiente(e.target.checked)} />
            <span>
              Autorizo el tratamiento de mis datos personales para este evento (Ley 29733) y acepto las{" "}
              <a href="/bases">bases</a>{conHack && <>, incluida la cláusula de licencia piloto</>}.
            </span>
          </label>

          <label className="rg-consent">
            <input type="checkbox" checked={sponsors} onChange={(e) => setSponsors(e.target.checked)} />
            <span>
              <strong style={{ color: "#fff" }}>Opcional:</strong> quiero que las empresas sponsor me conozcan. Al terminar
              el evento compartirán mi perfil (nombre, universidad, carrera, ciclo, correo, celular y mis redes) para
              oportunidades de prácticas y empleo. Puedo cambiarlo cuando quiera desde mi panel.
            </span>
          </label>
        </Pregunta>
      )}

      <div className="rg-actions">
        {paso > 0 && (
          <button onClick={() => setPaso((p) => p - 1)} className="more">
            <ArrowLeft aria-hidden size={14} /> Atrás
          </button>
        )}
        <button
          onClick={() => (paso === pasos.length - 1 ? enviar() : setPaso((p) => p + 1))}
          disabled={!puedeSeguir || enviando}
          className="more solid"
        >
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {paso === pasos.length - 1 ? "Enviar inscripción" : "Continuar"}
          {!enviando && <ArrowRight aria-hidden size={14} />}
        </button>
      </div>

      <p className="rg-small">
        inscripciones abiertas desde el {EVENT.registrationOpensLabel} · hack: 250 cupos · bootcamp: sin límite
      </p>
      <p className="rg-small" style={{ marginTop: 10 }}>
        ¿ya tienes cuenta? <a href="/mi-inscripcion">entra a tu panel</a>
      </p>
    </div>
  );
}
