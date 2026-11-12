"use client";

/**
 * Formulario de inscripción: una pregunta por pantalla.
 *
 * Primero se elige qué quiere hacer la persona (la hack sola, la hack con el
 * bootcamp, o solo el bootcamp) y de ahí salen las preguntas que siguen:
 *
 *   con hack        DNI · correo institucional · celular · carrera
 *   solo bootcamp   nombre · correo (cualquiera) · celular (opcional)
 *
 * Cada campo se verifica contra el servidor apenas la persona termina de
 * escribirlo, y lo que se deduce aparece en el acto: el nombre desde el DNI,
 * la universidad desde el correo.
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
import { navegador } from "@/lib/supabase";
import { PAISES, PAIS_POR_DEFECTO, normalizarTelefono } from "@/lib/telefono";

const BORRADOR = "hackcis-registro-v3";

type Plan = "hack" | "hack_bootcamp" | "bootcamp";

const PLANES: { id: Plan; titulo: string; desc: string; marca?: string }[] = [
  { id: "hack", titulo: "Solo la hack", desc: "100 horas construyendo con un agente de IA. Hasta 250 cupos." },
  {
    id: "hack_bootcamp",
    titulo: "Hack + Bootcamp",
    desc: "La hackathon y las sesiones del bootcamp que quieras para llegar preparado.",
    marca: "Recomendado",
  },
  { id: "bootcamp", titulo: "Solo bootcamp", desc: "Abierto a todos: sin DNI ni correo institucional. Eliges las sesiones." },
];

const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;

type EstadoCampo = "vacio" | "cargando" | "ok" | "aviso" | "error";
type Campo = { valor: string; estado: EstadoCampo; mensaje?: string };
const vacio: Campo = { valor: "", estado: "vacio" };

type Borrador = {
  correo: string; telefono: string; pais: string; carrera: string; anio: string; nivel: string;
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
  return { plan: plan && PLANES.some((p) => p.id === plan) ? plan : null, sesiones };
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
  const [carrera, setCarrera] = useState(() => leerBorrador().carrera ?? "");
  const [anio, setAnio] = useState(() => leerBorrador().anio ?? "");
  const [nivel, setNivel] = useState(() => leerBorrador().nivel ?? "");
  const [nombres, setNombres] = useState(() => leerBorrador().nombres ?? "");
  const [apellidos, setApellidos] = useState(() => leerBorrador().apellidos ?? "");
  const [consiente, setConsiente] = useState(false);

  const [nombre, setNombre] = useState("");
  const [universidad, setUniversidad] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; correo?: string; motivo?: string } | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const conHack = plan === "hack" || plan === "hack_bootcamp";
  const conBootcamp = plan === "bootcamp" || plan === "hack_bootcamp";

  // Las pantallas que toca recorrer según el plan elegido.
  const pasos: string[] = !plan
    ? ["plan"]
    : [
        "plan",
        ...(conBootcamp ? ["sesiones"] : []),
        ...(conHack ? ["dni", "correo", "celular", "carrera"] : ["nombre", "correo", "celular"]),
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
        correo: correo.valor, telefono: telefono.valor, pais, carrera, anio, nivel, nombres, apellidos,
      }));
    } catch { /* el borrador es un extra: que falle no interrumpe nada */ }
  }, [correo.valor, telefono.valor, pais, carrera, anio, nivel, nombres, apellidos]);

  useEffect(() => { campoRef.current?.focus(); }, [paso, plan]);

  // Con el campo lleno, cada tecla más dispararía otra consulta. Guardamos lo
  // último que se preguntó para no repetir ni gastar créditos de más.
  const yaConsultado = useRef<Record<string, string>>({});
  const esNuevo = (campo: string, valor: string) => {
    if (yaConsultado.current[campo] === valor) return false;
    yaConsultado.current[campo] = valor;
    return true;
  };

  const verDni = useCallback(async (valor: string) => {
    if (valor.length !== 8 || !esNuevo("dni", valor)) return;
    setDni((c) => ({ ...c, estado: "cargando", mensaje: undefined }));
    try {
      const { datos } = await post("/api/validar-dni", { dni: valor });
      if (!datos.ok) {
        // Si falló el servicio y no la persona, se deja seguir: lo revisa un admin.
        setDni({ valor, estado: datos.reintentable ? "aviso" : "error", mensaje: datos.motivo });
        return;
      }
      setNombre(datos.persona.nombreCompleto);
      setDni({ valor, estado: "ok" });
    } catch {
      setDni({ valor, estado: "aviso", mensaje: "No pudimos conectarnos. Puedes continuar e intentarlo al enviar." });
    }
  }, []);

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

  async function enviar() {
    setEnviando(true);
    try {
      const { datos } = await post("/api/inscripcion", {
        plan, sesiones: conBootcamp ? sesiones : [],
        dni: dni.valor, correo: correo.valor, telefono: telefono.valor, pais,
        carrera, anio: Number(anio), nivel, nombres, apellidos,
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

  const telOk = telefono.estado === "ok";
  const puedeSeguir =
    (actual === "plan" && plan !== null) ||
    (actual === "sesiones" && sesiones.length > 0) ||
    (actual === "dni" && (dni.estado === "ok" || dni.estado === "aviso")) ||
    (actual === "nombre" && nombres.trim().length >= 2 && apellidos.trim().length >= 2) ||
    (actual === "correo" && correo.estado === "ok") ||
    (actual === "celular" && (conHack ? telOk : telefono.estado === "vacio" || telOk)) ||
    (actual === "carrera" && carrera.trim().length >= 3 && anio !== "") ||
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
                onClick={() => { setPlan(p.id); if (p.id === "hack") setSesiones([]); }}
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
          ayuda="Lo usamos para confirmar tu nombre real. Guardamos solo una huella cifrada, nunca el número."
        >
          <input
            ref={campoRef}
            value={dni.valor}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 8);
              setDni({ valor: v, estado: "vacio" });
              if (v.length === 8) verDni(v);
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="8 dígitos"
            aria-label="DNI"
            className="rg-input dni tabular-nums"
          />
          <Pie campo={dni}>
            {nombre && dni.estado === "ok" && (
              <p className="rg-msg" style={{ fontSize: "1.1rem" }}>Hola, <strong>{nombre}</strong></p>
            )}
          </Pie>
        </Pregunta>
      )}

      {actual === "nombre" && (
        <Pregunta titulo={<>¿Cómo te<br /><span>llamas</span>?</>} ayuda="Tal como quieres que aparezca en tu constancia.">
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
        <Pregunta titulo={<>¿Qué <span>estudias</span>?</>} ayuda="Tal como figura en tu universidad o instituto.">
          <input
            ref={campoRef}
            value={carrera}
            onChange={(e) => setCarrera(e.target.value.slice(0, 80))}
            autoComplete="off"
            placeholder="Ingeniería de Sistemas"
            aria-label="Carrera"
            className="rg-input"
          />
          <p className="rg-lbl" style={{ marginTop: 28 }}>¿En qué año vas?</p>
          <div className="rg-chips">
            {[1, 2, 3, 4, 5, 6, 7].map((a) => (
              <button key={a} type="button" className="rg-chip rg-year" onClick={() => setAnio(String(a))} aria-pressed={anio === String(a)}>
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
            <div><dt>Nombre</dt><dd>{conHack ? (nombre || "por confirmar") : `${nombres} ${apellidos}`}</dd></div>
            {conHack && <div><dt>Institución</dt><dd>{universidad || "—"}</dd></div>}
            <div><dt>Correo</dt><dd>{correo.valor}</dd></div>
            {(conHack || telOk) && <div><dt>Celular</dt><dd>{bonito}</dd></div>}
            {conHack && <div><dt>Carrera</dt><dd>{carrera} · año {anio}</dd></div>}
            {conHack && nivel && <div><dt>Nivel</dt><dd>{nivel}</dd></div>}
          </dl>

          <label className="rg-consent">
            <input type="checkbox" checked={consiente} onChange={(e) => setConsiente(e.target.checked)} />
            <span>
              Autorizo el tratamiento de mis datos personales para este evento (Ley 29733) y acepto las{" "}
              <a href="/bases">bases</a>{conHack && <>, incluida la cláusula de licencia piloto</>}.
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
