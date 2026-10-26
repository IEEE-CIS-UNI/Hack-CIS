"use client";

/**
 * Formulario de inscripción: una pregunta por pantalla.
 *
 * Cada campo se verifica contra el servidor apenas la persona termina de
 * escribirlo, y lo que se deduce aparece en el acto: el nombre desde el DNI,
 * la universidad desde el correo. Son pocos datos tipeados y el resto se
 * rellena solo.
 *
 * Al final NO queda inscrita: queda un correo enviado. La inscripción nace
 * cuando abre ese correo, y por eso el correo institucional prueba algo.
 *
 * El progreso se guarda en el navegador para que una señal que se corta no
 * obligue a empezar de nuevo. El DNI nunca entra en ese borrador.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail, TriangleAlert, X } from "lucide-react";
import { CLAVE_BOLETO, EVENT } from "@/lib/config";
import { PAISES, PAIS_POR_DEFECTO, normalizarTelefono } from "@/lib/telefono";

const BORRADOR = "cishack-registro-v2";


const TRACKS = [
  { id: "finanzas",       titulo: "IA & Finanzas",            desc: "Riesgos, educación financiera, personalización." },
  { id: "telco",          titulo: "IA & Telco y Operaciones", desc: "Automatización, atención, predicción de fallas." },
  { id: "impacto_social", titulo: "IA & Impacto Social",      desc: "Ciberseguridad, IoT sostenible, educación." },
] as const;

const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;

type EstadoCampo = "vacio" | "cargando" | "ok" | "aviso" | "error";
type Campo = { valor: string; estado: EstadoCampo; mensaje?: string };

const vacio: Campo = { valor: "", estado: "vacio" };

/**
 * El borrador guarda lo que cuesta volver a escribir, nunca el documento.
 * Antes se guardaba el DNI en claro mientras la pantalla prometía no
 * guardarlo; ahora la promesa y el código dicen lo mismo.
 */
type Borrador = { correo: string; telefono: string; pais: string; carrera: string; anio: string; track: string; nivel: string };

function leerBorrador(): Partial<Borrador> {
  try { return JSON.parse(localStorage.getItem(BORRADOR) ?? "{}") ?? {}; }
  catch { return {}; }          // modo privado o almacenamiento bloqueado
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

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-1.5 last:border-0">
      <span className="hud text-mist/50">{etiqueta}</span>
      <span className="text-right text-sm font-semibold text-mist">{valor}</span>
    </div>
  );
}

function Barra({ paso, total }: { paso: number; total: number }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={paso + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
          i < paso ? "bg-lavender" : i === paso ? "bg-glow" : "bg-white/15"
        }`} />
      ))}
    </div>
  );
}

const CAMPO = "campo-grande w-full border-b-2 border-white/15 bg-transparent pb-3 text-white outline-none transition-colors placeholder:text-white/20 focus:border-lavender focus-visible:outline-none";

function Pregunta({ titulo, ayuda, children }: { titulo: React.ReactNode; ayuda: string; children: React.ReactNode }) {
  return (
    <div className="animate-pop-in">
      <h1 className="display mt-4 text-[clamp(2.2rem,7.5vw,4.5rem)]">{titulo}</h1>
      <p className="mt-4 max-w-md text-mist/70">{ayuda}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Pie({ campo, children }: { campo: Campo; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[4.5rem] items-start gap-3 pt-4" aria-live="polite">
      {campo.estado !== "vacio" && <span className="pt-0.5"><Senal estado={campo.estado} /></span>}
      <div className="flex-1">
        {campo.mensaje
          ? <p className={campo.estado === "error" ? "text-magenta" : "text-amber-300"}>{campo.mensaje}</p>
          : children}
      </div>
    </div>
  );
}

/** Botón de opción grande: sirve para track, año y nivel. */
function Opcion({ activo, onClick, titulo, desc }: { activo: boolean; onClick: () => void; titulo: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
        activo
          ? "border-lavender bg-white/12"
          : "border-white/20 bg-white/[0.04] hover:border-white/45 hover:bg-white/[0.07]"
      }`}
    >
      <span className="block font-bold text-white">{titulo}</span>
      {desc && <span className="mt-1 block text-sm text-mist/70">{desc}</span>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────── el wizard ──

const PASOS = ["DNI", "Correo", "Celular", "Carrera", "Track", "Confirmar"] as const;

export default function RegistroWizard() {
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
  const [track, setTrack] = useState(() => leerBorrador().track ?? "");
  const [nivel, setNivel] = useState(() => leerBorrador().nivel ?? "");
  const [consiente, setConsiente] = useState(false);

  const [nombre, setNombre] = useState("");
  const [universidad, setUniversidad] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; correo?: string; motivo?: string } | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BORRADOR, JSON.stringify({
        correo: correo.valor, telefono: telefono.valor, pais, carrera, anio, track, nivel,
      }));
    } catch { /* el borrador es un extra: que falle no interrumpe nada */ }
  }, [correo.valor, telefono.valor, pais, carrera, anio, track, nivel]);

  useEffect(() => { campoRef.current?.focus(); }, [paso]);

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

  const verCorreo = useCallback(async (valor: string) => {
    if (!valor.includes("@") || !esNuevo("correo", valor)) return;
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
  // botón quedaría bloqueado sin que nada lo explique. Se revalidan solos.
  // El DNI no está aquí porque nunca se guarda en el borrador.
  useEffect(() => {
    let vivo = true;
    // Fuera del render síncrono, y cancelable si el componente se desmonta.
    (async () => {
      await Promise.resolve();
      if (!vivo) return;
      if (correo.valor.includes("@")) verCorreo(correo.valor);
      if (telefono.valor.trim()) verTelefono(telefono.valor, pais);
    })();
    return () => { vivo = false; };
    // Solo al montar: después, cada campo se verifica cuando la persona lo toca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar() {
    setEnviando(true);
    try {
      const { datos } = await post("/api/inscripcion", {
        dni: dni.valor, correo: correo.valor, telefono: telefono.valor, pais,
        carrera, anio: Number(anio), track, nivel,
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
    (paso === 0 && (dni.estado === "ok" || dni.estado === "aviso")) ||
    (paso === 1 && correo.estado === "ok") ||
    (paso === 2 && telOk) ||
    (paso === 3 && carrera.trim().length >= 3 && anio !== "") ||
    (paso === 4 && track !== "") ||
    (paso === 5 && consiente);

  // ── pantalla de resultado ──
  if (resultado) {
    if (resultado.ok) {
      return (
        <div className="animate-pop-in">
          <p className="hud text-lavender">Casi listo</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">
            Revisa tu<br /><span className="text-lavender">correo</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-mist/85">
            Te mandamos un mensaje a <span className="font-bold text-white">{resultado.correo}</span>.
            Ábrelo y toca el enlace para confirmar tu inscripción. Si no aparece en un par de
            minutos, mira en spam o promociones.
          </p>
          <p className="mt-4 flex items-center gap-2 text-mist/60">
            <Mail className="size-5" aria-hidden /> Tu lugar queda reservado al confirmar.
          </p>
        </div>
      );
    }
    return (
      <div className="animate-pop-in">
        <p className="hud text-lavender">No pudimos</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">
          Algo no<br /><span className="text-magenta">cuadra</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-mist/85">{resultado.motivo}</p>
        <button
          onClick={() => { setResultado(null); setPaso(0); }}
          className="hud mt-8 rounded-full border border-white/40 px-6 py-3 text-white transition-colors hover:border-lavender hover:text-lavender"
        >
          Corregir mis datos
        </button>
      </div>
    );
  }

  // ── formulario ──
  return (
    <div className="w-full max-w-xl">
      <Barra paso={paso} total={PASOS.length} />
      <p className="hud mt-5 text-lavender">Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}</p>

      {paso === 0 && (
        <Pregunta
          titulo={<>¿Cuál es<br />tu <span className="text-lavender">DNI</span>?</>}
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
            className={`${CAMPO} text-[clamp(2rem,9vw,3.5rem)] font-bold tracking-[0.12em] tabular-nums`}
          />
          <Pie campo={dni}>
            {nombre && dni.estado === "ok" && (
              <p className="text-lg text-mist">Hola, <span className="font-bold text-white">{nombre}</span></p>
            )}
          </Pie>
        </Pregunta>
      )}

      {paso === 1 && (
        <Pregunta
          titulo={<>¿Tu correo<br /><span className="text-lavender">institucional</span>?</>}
          ayuda="El que te dio tu universidad. Te llegará ahí el enlace para confirmar."
        >
          <input
            ref={campoRef}
            value={correo.valor}
            onChange={(e) => setCorreo({ valor: e.target.value.trim().toLowerCase(), estado: "vacio" })}
            onBlur={(e) => verCorreo(e.target.value.trim().toLowerCase())}
            onKeyDown={(e) => { if (e.key === "Enter") verCorreo(correo.valor); }}
            type="email"
            autoComplete="email"
            placeholder="tu.nombre@tuuniversidad.edu.pe"
            aria-label="Correo institucional"
            className={`${CAMPO} text-[clamp(1.1rem,4.6vw,1.9rem)] font-semibold`}
          />
          <Pie campo={correo}>
            {universidad && correo.estado === "ok" && (
              <p className="text-lg font-bold text-white">{universidad}</p>
            )}
          </Pie>
        </Pregunta>
      )}

      {paso === 2 && (
        <Pregunta
          titulo={<>Tu <span className="text-lavender">celular</span></>}
          ayuda="Para avisarte de cambios de último minuto y coordinar tu equipo."
        >
          <div className="flex items-end gap-3">
            <select
              value={pais}
              onChange={(e) => { setPais(e.target.value); verTelefono(telefono.valor, e.target.value); }}
              aria-label="País del número"
              className="shrink-0 rounded-xl border-2 border-white/15 bg-ink/60 px-3 py-3 text-base font-semibold text-white outline-none transition-colors focus:border-lavender"
            >
              {PAISES.map((p) => (
                <option key={p.iso} value={p.iso} className="bg-[#120a24] text-white">
                  {p.bandera} +{p.codigo}
                </option>
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
              className={`${CAMPO} text-[clamp(1.4rem,6vw,2.4rem)] font-bold tabular-nums`}
            />
          </div>
          <Pie campo={telefono}>
            {telOk && (
              <p className="text-lg text-mist">
                Guardamos <span className="font-bold text-white">{normalizarTelefono(telefono.valor, pais).ok
                  ? (normalizarTelefono(telefono.valor, pais) as { bonito: string }).bonito
                  : telefono.valor}</span>
              </p>
            )}
          </Pie>
        </Pregunta>
      )}

      {paso === 3 && (
        <Pregunta
          titulo={<>¿Qué <span className="text-lavender">estudias</span>?</>}
          ayuda="Tal como figura en tu universidad."
        >
          <input
            ref={campoRef}
            value={carrera}
            onChange={(e) => setCarrera(e.target.value.slice(0, 80))}
            autoComplete="off"
            placeholder="Ingeniería de Sistemas"
            aria-label="Carrera"
            className={`${CAMPO} text-[clamp(1.2rem,5vw,2rem)] font-semibold`}
          />
          <p className="hud mt-8 text-mist/50">¿en qué año vas?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAnio(String(a))}
                aria-pressed={anio === String(a)}
                className={`size-12 rounded-xl border font-bold transition-colors ${
                  anio === String(a) ? "border-lavender bg-white/10 text-white" : "border-white/15 text-mist hover:border-white/40"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Pregunta>
      )}

      {paso === 4 && (
        <Pregunta
          titulo={<>Elige tu<br /><span className="text-lavender">track</span></>}
          ayuda="Define en qué reto compites y a qué canales de Discord entras."
        >
          <div className="flex flex-col gap-3">
            {TRACKS.map((t) => (
              <Opcion key={t.id} activo={track === t.id} onClick={() => setTrack(t.id)} titulo={t.titulo} desc={t.desc} />
            ))}
          </div>
          <p className="hud mt-8 text-mist/50">¿cómo te ves hoy? (opcional)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {NIVELES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNivel(nivel === n ? "" : n)}
                aria-pressed={nivel === n}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  nivel === n ? "border-lavender bg-white/10 text-white" : "border-white/15 text-mist hover:border-white/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Pregunta>
      )}

      {paso === 5 && (
        <Pregunta titulo={<>¿Todo<br /><span className="text-lavender">correcto</span>?</>} ayuda="Revisa antes de enviar.">
          <div className="glass w-full rounded-2xl px-5 py-4">
            <Dato etiqueta="nombre" valor={nombre || "por confirmar"} />
            <Dato etiqueta="universidad" valor={universidad || "—"} />
            <Dato etiqueta="correo" valor={correo.valor} />
            <Dato etiqueta="celular" valor={
              normalizarTelefono(telefono.valor, pais).ok
                ? (normalizarTelefono(telefono.valor, pais) as { bonito: string }).bonito
                : telefono.valor
            } />
            <Dato etiqueta="carrera" valor={`${carrera} · año ${anio}`} />
            <Dato etiqueta="track" valor={TRACKS.find((t) => t.id === track)?.titulo ?? "—"} />
            {nivel && <Dato etiqueta="nivel" valor={nivel} />}
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-mist/85">
            <input
              type="checkbox"
              checked={consiente}
              onChange={(e) => setConsiente(e.target.checked)}
              className="mt-1 size-5 shrink-0 accent-violet"
            />
            <span>
              Autorizo el tratamiento de mis datos personales para este evento (Ley 29733) y acepto las{" "}
              <a href="/bases" className="text-lavender underline underline-offset-4">bases</a>, incluida la
              cláusula de licencia piloto.
            </span>
          </label>
        </Pregunta>
      )}

      <div className="mt-10 flex items-center gap-3">
        {paso > 0 && (
          <button
            onClick={() => setPaso((p) => p - 1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3.5 text-white transition-colors hover:border-lavender hover:text-lavender"
          >
            <ArrowLeft className="size-5" aria-hidden /> Atrás
          </button>
        )}
        <button
          onClick={() => (paso === PASOS.length - 1 ? enviar() : setPaso((p) => p + 1))}
          disabled={!puedeSeguir || enviando}
          className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 font-bold text-ink shadow-[0_0_40px_-8px_rgba(182,156,255,0.8)] transition-all hover:bg-lavender disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40 disabled:shadow-none"
        >
          {enviando && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {paso === PASOS.length - 1 ? "Enviar inscripción" : "Continuar"}
          {!enviando && <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />}
        </button>
      </div>

      <p className="hud mt-6 text-mist/40">
        inscripciones abiertas desde el {EVENT.registrationOpensLabel} · 250 cupos
      </p>

      {/* Quien ya pasó por aquí no tiene por qué volver a llenar nada. */}
      <p className="hud mt-3 text-mist/40">
        ¿ya estás inscrito?{" "}
        <a href="/mi-inscripcion" className="text-lavender underline underline-offset-4">entra a tu panel</a>
      </p>
    </div>
  );
}
