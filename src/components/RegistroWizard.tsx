"use client";

/**
 * Formulario de inscripción: una pregunta por pantalla.
 *
 * Cada campo se verifica contra el servidor apenas la persona termina de
 * escribirlo, y lo que se deduce aparece en el acto: el nombre desde el DNI,
 * la universidad desde el correo, la carrera desde el padrón. Son tres datos
 * tipeados y el resto se rellena solo.
 *
 * El progreso se guarda en el navegador: si se cae la señal a medio
 * formulario, al volver sigue donde estaba.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, TriangleAlert, X } from "lucide-react";
import { EVENT, LINKS } from "@/lib/config";

const BORRADOR = "cishack-registro-v1";

type Estado = "vacio" | "cargando" | "ok" | "aviso" | "error";

type Deducido = {
  nombre?: string;
  universidad?: string;
  universidadNombre?: string;
  prioridad?: string;
  sinCatalogar?: boolean;
  anioIngreso?: number | null;
  carrera?: string | null;
  facultad?: string | null;
  ciclo?: string | null;
};

type Campo = { valor: string; estado: Estado; mensaje?: string };

const vacio: Campo = { valor: "", estado: "vacio" };

function desdeBorrador(campo: "dni" | "correo" | "codigo"): Campo {
  try {
    const guardado = localStorage.getItem(BORRADOR);
    if (!guardado) return vacio;
    const v = JSON.parse(guardado)?.[campo];
    return typeof v === "string" && v ? { valor: v, estado: "vacio" } : vacio;
  } catch {
    return vacio;   // modo privado o almacenamiento bloqueado
  }
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

function Senal({ estado }: { estado: Estado }) {
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
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i < paso ? "bg-lavender" : i === paso ? "bg-glow" : "bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────── el wizard ──

const PASOS = ["DNI", "Correo", "Código", "Confirmar"] as const;

export default function RegistroWizard() {
  const [paso, setPaso] = useState(0);
  // Este componente solo se monta en el cliente (ver RegistroCliente), así
  // que leer localStorage al inicializar es seguro: no hay hidratación.
  const [dni, setDni] = useState<Campo>(() => desdeBorrador("dni"));
  const [correo, setCorreo] = useState<Campo>(() => desdeBorrador("correo"));
  const [codigo, setCodigo] = useState<Campo>(() => desdeBorrador("codigo"));
  const [deducido, setDeducido] = useState<Deducido>({});
  const [consiente, setConsiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ estado: string; motivo: string | null } | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BORRADOR, JSON.stringify({ dni: dni.valor, correo: correo.valor, codigo: codigo.valor }));
    } catch { /* modo privado: el borrador es un extra, no se interrumpe nada */ }
  }, [dni.valor, correo.valor, codigo.valor]);

  useEffect(() => { campoRef.current?.focus(); }, [paso]);

  // ── verificaciones ──

  // Con el campo ya lleno, cada tecla más dispararía otra consulta: el input
  // recorta a 8 y el valor sigue teniendo largo 8. Guardamos lo último que
  // se consultó para no repetir ni gastar créditos de más.
  const yaConsultado = useRef<Record<string, string>>({});
  const nuevo = (campo: string, valor: string) => {
    if (yaConsultado.current[campo] === valor) return false;
    yaConsultado.current[campo] = valor;
    return true;
  };

  const verDni = useCallback(async (valor: string) => {
    if (valor.length !== 8 || !nuevo("dni", valor)) return;
    setDni((c) => ({ ...c, estado: "cargando", mensaje: undefined }));
    try {
      const { datos } = await post("/api/validar-dni", { dni: valor });
      if (!datos.ok) {
        // Si falló el servicio y no la persona, se deja seguir: lo revisa un admin.
        setDni({ valor, estado: datos.reintentable ? "aviso" : "error", mensaje: datos.motivo });
        return;
      }
      setDeducido((d) => ({ ...d, nombre: datos.persona.nombreCompleto }));
      setDni({ valor, estado: "ok" });
    } catch {
      setDni({ valor, estado: "aviso", mensaje: "No pudimos conectarnos. Puedes continuar y lo revisamos a mano." });
    }
  }, []);

  const verCorreo = useCallback(async (valor: string) => {
    if (!valor.includes("@") || !nuevo("correo", valor)) return;
    setCorreo((c) => ({ ...c, estado: "cargando", mensaje: undefined }));
    try {
      const { datos } = await post("/api/universidad", { correo: valor });
      if (!datos.ok) {
        setCorreo({ valor, estado: "error", mensaje: datos.motivo });
        setDeducido((d) => ({ ...d, universidad: undefined, universidadNombre: undefined }));
        return;
      }
      const sinCatalogar = datos.clase === "educativa_sin_catalogar";
      setDeducido((d) => ({
        ...d,
        universidad: datos.universidad ?? undefined,
        universidadNombre: datos.universidadNombre ?? datos.dominio,
        prioridad: datos.prioridad,
        sinCatalogar,
      }));
      setCorreo({ valor, estado: sinCatalogar ? "aviso" : "ok", mensaje: sinCatalogar ? datos.nota : undefined });
    } catch {
      setCorreo({ valor, estado: "error", mensaje: "No pudimos conectarnos. Inténtalo de nuevo." });
    }
  }, []);

  const verCodigo = useCallback(async (valor: string) => {
    if (valor.length < 6 || !nuevo("codigo", valor + "|" + correo.valor)) return;
    setCodigo((c) => ({ ...c, estado: "cargando", mensaje: undefined }));
    try {
      const { datos } = await post("/api/validar-codigo", { codigo: valor, correo: correo.valor });
      if (!datos.ok) {
        setCodigo({ valor, estado: "error", mensaje: datos.motivo });
        return;
      }
      const p = datos.padron ?? {};
      if (p.consultado && !p.encontrado) {
        setCodigo({ valor, estado: "error", mensaje: p.motivo });
        return;
      }
      setDeducido((d) => ({
        ...d,
        anioIngreso: datos.anioIngreso,
        carrera: p.carrera ?? null,
        facultad: p.facultad ?? null,
        ciclo: p.ciclo ?? null,
      }));
      setCodigo({ valor, estado: "ok" });
    } catch {
      setCodigo({ valor, estado: "error", mensaje: "No pudimos conectarnos. Inténtalo de nuevo." });
    }
  }, [correo.valor]);

  // Si volvió con un borrador, los campos llegan llenos pero sin verificar:
  // el botón quedaría bloqueado sin que nada lo explique. Se revalidan solos
  // fuera del render síncrono, y se cancelan si el componente se desmonta.
  useEffect(() => {
    let vivo = true;
    (async () => {
      await Promise.resolve();
      if (!vivo) return;
      if (dni.valor.length === 8) verDni(dni.valor);
      if (correo.valor.includes("@")) verCorreo(correo.valor);
      // El código depende del correo: se verifica al llegar a su paso.
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar() {
    setEnviando(true);
    try {
      const { datos } = await post("/api/validar", { dni: dni.valor, codigo: codigo.valor, correo: correo.valor });
      setResultado({ estado: datos.estado, motivo: datos.motivo });
      if (datos.estado !== "invalido") {
        try { localStorage.removeItem(BORRADOR); } catch { /* da igual */ }
      }
    } catch {
      setResultado({ estado: "revision_manual", motivo: "No pudimos conectarnos; guardamos tu inscripción para revisarla." });
    } finally {
      setEnviando(false);
    }
  }

  const puedeSeguir =
    (paso === 0 && dni.estado === "ok") ||
    (paso === 0 && dni.estado === "aviso") ||
    (paso === 1 && (correo.estado === "ok" || correo.estado === "aviso")) ||
    (paso === 2 && codigo.estado === "ok") ||
    (paso === 3 && consiente);

  // ── pantalla de resultado ──
  if (resultado) {
    const bueno = resultado.estado === "valido";
    const revision = resultado.estado === "revision_manual";
    return (
      <div className="animate-pop-in">
        <p className="hud text-lavender">{bueno ? "Listo" : revision ? "Casi" : "No pudimos"}</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">
          {bueno ? <>Eres parte de<br /><span className="text-lavender">CIS[HACK]</span></>
            : revision ? <>Te revisamos<br /><span className="text-lavender">a mano</span></>
            : <>Algo no<br /><span className="text-magenta">cuadra</span></>}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-mist/85">
          {bueno
            ? "Te llega un correo con tu código de Discord. Es de un solo uso y está atado a tu correo institucional."
            : revision
            ? `${resultado.motivo ?? ""} Te escribimos en menos de 24 horas al correo que dejaste.`
            : resultado.motivo}
        </p>
        {!bueno && !revision && (
          <button
            onClick={() => { setResultado(null); setPaso(0); }}
            className="hud mt-8 rounded-full border border-white/40 px-6 py-3 text-white transition-colors hover:border-lavender hover:text-lavender"
          >
            Corregir mis datos
          </button>
        )}
        {bueno && (
          <a
            href={LINKS.discord}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-ink transition-colors hover:bg-lavender"
          >
            Entrar al Discord <ArrowRight className="size-5" aria-hidden />
          </a>
        )}
      </div>
    );
  }

  // ── formulario ──
  return (
    <div className="w-full max-w-xl">
      <Barra paso={paso} total={PASOS.length} />
      <p className="hud mt-5 text-lavender">
        Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}
      </p>

      {paso === 0 && (
        <Pregunta
          titulo={<>¿Cuál es<br />tu <span className="text-lavender">DNI</span>?</>}
          ayuda="Lo usamos una sola vez para confirmar tu nombre. No lo guardamos."
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
            {deducido.nombre && dni.estado === "ok" && (
              <p className="text-lg text-mist">
                Hola, <span className="font-bold text-white">{deducido.nombre}</span>
              </p>
            )}
          </Pie>
        </Pregunta>
      )}

      {paso === 1 && (
        <Pregunta
          titulo={<>¿Tu correo<br /><span className="text-lavender">institucional</span>?</>}
          ayuda="El que te dio tu universidad. Con él confirmamos dónde estudias."
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
            {deducido.universidadNombre && correo.estado === "ok" && (
              <>
                <p className="text-lg font-bold text-white">{deducido.universidadNombre}</p>
                {deducido.prioridad === "anfitriona" && (
                  <p className="hud mt-1 text-glow">universidad anfitriona</p>
                )}
              </>
            )}
          </Pie>
        </Pregunta>
      )}

      {paso === 2 && (
        <Pregunta
          titulo={<>Tu <span className="text-lavender">código</span><br />de estudiante</>}
          ayuda="El de tu carné universitario."
        >
          <input
            ref={campoRef}
            value={codigo.valor}
            onChange={(e) => setCodigo({ valor: e.target.value.toUpperCase().slice(0, 15), estado: "vacio" })}
            onBlur={(e) => verCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") verCodigo(codigo.valor); }}
            autoComplete="off"
            placeholder="el de tu carné"
            aria-label="Código de estudiante"
            className={`${CAMPO} text-[clamp(1.6rem,7vw,3rem)] font-bold tracking-[0.1em]`}
          />
          <Pie campo={codigo}>
            {codigo.estado === "ok" && (
              <div className="w-full">
                {deducido.anioIngreso && <Dato etiqueta="ingreso" valor={String(deducido.anioIngreso)} />}
                {deducido.carrera && <Dato etiqueta="carrera" valor={deducido.carrera} />}
                {deducido.facultad && <Dato etiqueta="facultad" valor={deducido.facultad} />}
                {deducido.ciclo && <Dato etiqueta="ciclo" valor={deducido.ciclo} />}
                {!deducido.carrera && (
                  <p className="hud text-mist/50">te preguntamos la carrera más adelante</p>
                )}
              </div>
            )}
          </Pie>
        </Pregunta>
      )}

      {paso === 3 && (
        <Pregunta
          titulo={<>¿Todo<br /><span className="text-lavender">correcto</span>?</>}
          ayuda="Revisa antes de enviar."
        >
          <div className="glass w-full rounded-2xl px-5 py-4">
            <Dato etiqueta="nombre" valor={deducido.nombre ?? "por confirmar"} />
            <Dato etiqueta="universidad" valor={deducido.universidadNombre ?? "por catalogar"} />
            <Dato etiqueta="código" valor={codigo.valor} />
            {deducido.anioIngreso && <Dato etiqueta="ingreso" valor={String(deducido.anioIngreso)} />}
            {deducido.carrera && <Dato etiqueta="carrera" valor={deducido.carrera} />}
            <Dato etiqueta="correo" valor={correo.valor} />
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
          {enviando ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
          {paso === PASOS.length - 1 ? "Enviar inscripción" : "Continuar"}
          {!enviando && <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />}
        </button>
      </div>

      <p className="hud mt-6 text-mist/40">
        inscripciones abiertas desde el {EVENT.registrationOpensLabel} · 250 cupos
      </p>
    </div>
  );
}

function Pregunta({ titulo, ayuda, children }: { titulo: React.ReactNode; ayuda: string; children: React.ReactNode }) {
  return (
    <div className="animate-pop-in">
      <h1 className="display mt-4 text-[clamp(2.2rem,7.5vw,4.5rem)]">{titulo}</h1>
      <p className="mt-4 max-w-md text-mist/70">{ayuda}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

/** La raya va pegada al input, no debajo del mensaje. */
const CAMPO = "campo-grande w-full border-b-2 border-white/15 bg-transparent pb-3 text-white outline-none transition-colors placeholder:text-white/20 focus:border-lavender focus-visible:outline-none";

function Pie({ campo, children }: { campo: Campo; children?: React.ReactNode }) {
  const hay = campo.estado !== "vacio";
  return (
    <div className="flex min-h-[4.5rem] items-start gap-3 pt-4" aria-live="polite">
      {hay && <span className="pt-0.5"><Senal estado={campo.estado} /></span>}
      <div className="flex-1">
        {campo.mensaje ? (
          <p className={campo.estado === "error" ? "text-magenta" : "text-amber-300"}>{campo.mensaje}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
