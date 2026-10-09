/**
 * Validación de inscritos.
 *
 * Tres comprobaciones independientes que se cruzan al final:
 *   DNI    -> nombre real, vía API tipo RENIEC (única que usa red externa)
 *   correo -> universidad, por el dominio
 *   código -> año de ingreso, y el resto si hay padrón
 *
 * Regla que gobierna todo: nada que no sea culpa de la persona la rechaza.
 * Si la API se cae o su universidad no está catalogada, pasa a revisión
 * manual, nunca a inválido.
 *
 * Solo corre en el servidor: el token jamás debe llegar al navegador.
 */

import "server-only";
import { createHash } from "node:crypto";
import {
  porDominio, porSiglas, esDominioEducativo, SUFIJOS_EDUCATIVOS,
  type Prioridad,
} from "./universidades";

// ─────────────────────────────────────────────────────────────── tipos ──

export type Persona = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  digitoVerificador?: string | null;
};

export type Estado = "valido" | "revision_manual" | "invalido";

export type Paso = { paso: string; ok: boolean; detalle?: string };

export type Perfil = {
  nombreCompleto: string | null;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  dniHash: string;
  codigoEstudiante: string;
  anioIngreso: number | null;
  universidad: string | null;
  universidadNombre: string | null;
  prioridad: Prioridad | null;
  dominioPorCatalogar: string | null;
  carrera: string | null;
  facultad: string | null;
  ciclo: string | null;
  correoInstitucional: string | null;
  verificadoPor: string;
};

export type Veredicto = {
  estado: Estado;
  motivo: string | null;
  pasos: Paso[];
  perfil?: Perfil;
};

export type FilaPadron = {
  codigo: string;
  universidad?: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  carrera?: string;
  facultad?: string;
  ciclo?: string;
  estado?: string;
};

export type Padron = {
  get(codigo: string): FilaPadron | undefined;
  universidades: Set<string>;
  size: number;
};

// ────────────────────────────────────────────────────────── proveedores ──

type Proveedor = {
  etiqueta: string;
  env: string[];
  metodo?: "GET" | "POST";
  url: (dni: string) => string;
  cuerpo?: (dni: string) => unknown;
  headers: (token: string) => Record<string, string>;
  extraer: (j: Record<string, never>) => Persona;
  falloLogico?: (j: Record<string, never>) => string | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const PROVEEDORES: Record<string, Proveedor> = {
  jsonpe: {
    etiqueta: "json.pe",
    env: ["JSON_PE_TOKEN", "API_APP_JSON"],
    metodo: "POST",
    url: () => "https://api.json.pe/api/dni",
    cuerpo: (dni) => ({ dni }),
    headers: (t) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json", Accept: "application/json" }),
    extraer: (j: any) => ({
      nombres: j?.data?.nombres ?? "",
      apellidoPaterno: j?.data?.apellido_paterno ?? "",
      apellidoMaterno: j?.data?.apellido_materno ?? "",
      digitoVerificador: j?.data?.codigo_verificacion != null ? String(j.data.codigo_verificacion) : null,
    }),
    falloLogico: (j: any) => (j?.success === false ? j.message || "La consulta no tuvo éxito." : null),
  },
  decolecta: {
    etiqueta: "Decolecta",
    env: ["DECOLECTA_TOKEN"],
    url: (dni) => `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`,
    headers: (t) => ({ Authorization: `Bearer ${t}`, Accept: "application/json" }),
    extraer: (j: any) => ({
      nombres: j.first_name ?? "",
      apellidoPaterno: j.first_last_name ?? "",
      apellidoMaterno: j.second_last_name ?? "",
      digitoVerificador: j.verification_code != null ? String(j.verification_code) : null,
    }),
  },
  apiperu: {
    etiqueta: "ApiPerú",
    env: ["APIPERU_TOKEN"],
    url: (dni) => `https://apiperu.dev/api/dni/${dni}`,
    headers: (t) => ({ Authorization: `Bearer ${t}`, Accept: "application/json" }),
    extraer: (j: any) => ({
      nombres: j?.data?.nombres ?? "",
      apellidoPaterno: j?.data?.apellido_paterno ?? "",
      apellidoMaterno: j?.data?.apellido_materno ?? "",
      digitoVerificador: j?.data?.codigo_verificacion != null ? String(j.data.codigo_verificacion) : null,
    }),
    falloLogico: (j: any) => (j?.success === false ? j.message || "La consulta no tuvo éxito." : null),
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** El primer proveedor cuyo token esté en el entorno. Sin ninguno: mock. */
export function detectarProveedor() {
  for (const [nombre, p] of Object.entries(PROVEEDORES)) {
    for (const v of p.env) {
      if (process.env[v]) return { modo: "real" as const, proveedor: nombre, token: process.env[v]!, origen: v };
    }
  }
  return { modo: "mock" as const };
}

// ──────────────────────────────────────────────────────────── 1. el DNI ──

export function validarDni(dni: unknown) {
  const limpio = String(dni ?? "").replace(/[\s.-]/g, "");
  if (!limpio) return { ok: false as const, motivo: "Escribe tu DNI." };
  if (/\D/.test(limpio)) return { ok: false as const, motivo: "El DNI solo lleva números." };
  if (limpio.length !== 8) return { ok: false as const, motivo: `El DNI tiene 8 dígitos; escribiste ${limpio.length}.` };
  if (/^(\d)\1{7}$/.test(limpio)) return { ok: false as const, motivo: "Ese DNI no es válido." };
  // El dígito verificador del DNI peruano está impreso en el documento, pero
  // RENIEC no publicó su algoritmo: offline solo se puede validar la forma.
  return { ok: true as const, dni: limpio };
}

const cache = new Map<string, Persona>();
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ResultadoDni =
  | { ok: true; fuente: string; persona: Persona; desdeCache?: boolean }
  | { ok: false; fuente: string; motivo: string; http?: number };

export async function consultarDni(
  dni: string,
  { timeoutMs = 5000, reintentos = 2, usarCache = true } = {},
): Promise<ResultadoDni> {
  if (usarCache) {
    const hit = cache.get(dni);
    if (hit) return { ok: true, fuente: "caché", persona: hit, desdeCache: true };
  }

  const det = detectarProveedor();
  if (det.modo === "mock") {
    return { ok: false, fuente: "mock", motivo: "No hay token de consulta de DNI configurado." };
  }

  const cfg = PROVEEDORES[det.proveedor];
  let ultimo: ResultadoDni | null = null;

  for (let intento = 0; intento <= reintentos; intento++) {
    if (intento) await dormir(300 * 2 ** (intento - 1));

    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(cfg.url(dni), {
        method: cfg.metodo ?? "GET",
        headers: cfg.headers(det.token),
        body: cfg.cuerpo ? JSON.stringify(cfg.cuerpo(dni)) : undefined,
        signal: ctrl.signal,
        cache: "no-store",
      });
      const texto = await res.text();

      if (!res.ok) {
        ultimo = { ok: false, fuente: cfg.etiqueta, http: res.status, motivo: mensajeHttp(res.status) };
        if (res.status !== 429 && res.status < 500) return ultimo;
        continue;
      }

      let json;
      try { json = JSON.parse(texto); } catch {
        return { ok: false, fuente: cfg.etiqueta, motivo: "El proveedor respondió algo que no es JSON." };
      }

      const fallo = cfg.falloLogico?.(json);
      if (fallo) return { ok: false, fuente: cfg.etiqueta, motivo: fallo };

      const persona = cfg.extraer(json);
      if (!persona.nombres && !persona.apellidoPaterno) {
        return { ok: false, fuente: cfg.etiqueta, motivo: "No encontramos ese DNI." };
      }
      if (usarCache) cache.set(dni, persona);
      return { ok: true, fuente: cfg.etiqueta, persona };
    } catch (e) {
      const err = e as Error;
      ultimo = {
        ok: false, fuente: cfg.etiqueta,
        motivo: err.name === "AbortError" ? "El servicio no respondió a tiempo." : "No se pudo consultar el DNI.",
      };
    } finally {
      clearTimeout(reloj);
    }
  }
  return ultimo ?? { ok: false, fuente: cfg.etiqueta, motivo: "Falló sin dar motivo." };
}

function mensajeHttp(codigo: number) {
  if (codigo === 401 || codigo === 403) return "El servicio de consulta rechazó nuestras credenciales.";
  if (codigo === 404) return "No encontramos ese DNI.";
  if (codigo === 429) return "El servicio de consulta está saturado.";
  if (codigo >= 500) return "El servicio de consulta está caído.";
  return "El servicio de consulta devolvió un error.";
}

// ──────────────────────────────────────────────────────── 2. el correo ──

export type ResultadoCorreo =
  | { ok: true; clase: "catalogada"; correo: string; dominio: string; universidad: string; universidadNombre: string; tipo: string; prioridad: Prioridad }
  | { ok: true; clase: "educativa_sin_catalogar"; correo: string; dominio: string; universidad: null; universidadNombre: null; nota: string }
  | { ok: false; clase: "vacio" | "malformado" | "no_institucional"; dominio?: string; motivo: string };

/**
 * El dominio es lo único que escala a las 100+ universidades del país.
 * Un .edu.pe desconocido NO se rechaza: entra y queda marcado para catalogar.
 */
export function universidadPorCorreo(correo: unknown): ResultadoCorreo {
  const limpio = String(correo ?? "").trim().toLowerCase();
  if (!limpio) return { ok: false, clase: "vacio", motivo: "Escribe tu correo institucional." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(limpio)) {
    return { ok: false, clase: "malformado", motivo: "Ese correo no parece estar bien escrito." };
  }

  const dominio = limpio.split("@").pop()!;
  const u = porDominio(dominio);
  if (u) {
    return {
      ok: true, clase: "catalogada", correo: limpio, dominio,
      universidad: u.siglas, universidadNombre: u.nombre, tipo: u.tipo, prioridad: u.prioridad,
    };
  }

  if (esDominioEducativo(dominio)) {
    return {
      ok: true, clase: "educativa_sin_catalogar", correo: limpio, dominio,
      universidad: null, universidadNombre: null,
      nota: "Reconocemos tu correo como institucional, pero aún no tenemos tu universidad en la lista. Tu inscripción sigue y la revisamos a mano.",
    };
  }

  return {
    ok: false, clase: "no_institucional", dominio,
    motivo: `«${dominio}» no es un correo institucional. Usa el que te dio tu universidad (suele terminar en ${SUFIJOS_EDUCATIVOS[0]}).`,
  };
}

/** Para un .edu.pe desconocido: confirma por DNS que el dominio existe. */
export async function dominioAceptaCorreo(dominio: string) {
  try {
    const dns = await import("node:dns");
    const mx = await dns.promises.resolveMx(dominio.toLowerCase());
    return { ok: mx.length > 0, mx: mx.map((r) => r.exchange) };
  } catch {
    return { ok: false, mx: [] as string[] };
  }
}

// ──────────────────────────────────────────────────────── 3. el código ──

const ANIO_MIN = 2000;
const ANIO_MAX = new Date().getFullYear();

/**
 * Validación genérica: no exige conocer el formato de cada universidad,
 * porque casi ninguna lo publica. Lo que sí es casi universal en Perú es
 * que el código empieza con el año de ingreso.
 */
export function validarCodigo(codigo: unknown, { universidad = null as string | null } = {}) {
  const limpio = String(codigo ?? "").replace(/[\s.\-/]/g, "").toUpperCase();
  if (!limpio) return { ok: false as const, codigo: "", motivo: "Escribe tu código de estudiante." };
  if (!/^[0-9A-Z]+$/.test(limpio)) {
    return { ok: false as const, codigo: limpio, motivo: "El código solo lleva números y letras." };
  }
  if (limpio.length < 6 || limpio.length > 15) {
    return { ok: false as const, codigo: limpio, motivo: `Un código tiene entre 6 y 15 caracteres; escribiste ${limpio.length}.` };
  }

  const anio = Number(limpio.match(/^(\d{4})/)?.[1]);
  const anioOk = anio >= ANIO_MIN && anio <= ANIO_MAX;

  const u = porSiglas(universidad);
  if (u?.formato && !u.formato.test(limpio)) {
    return { ok: false as const, codigo: limpio, motivo: `Ese código no tiene el formato que usa ${u.siglas}.` };
  }

  return {
    ok: true as const,
    codigo: limpio,
    largo: limpio.length,
    anioIngreso: anioOk ? anio : null,
    sufijo: /[A-Z]$/.test(limpio) ? limpio.slice(-1) : null,
    formatoConocido: u?.formato ? "calza" : "la universidad no publica su formato",
    certeza: "formato" as const,   // nunca prueba pertenencia por sí solo
  };
}

// ───────────────────────────────────────────────────────────── nombres ──

export function normalizar(s: unknown) {
  // La Ñ se protege antes del NFD: si no, se descompone en N + tilde y el
  // filtro de diacríticos la deja en N. "ÑAUPAS" no debe volverse "NAUPAS".
  return String(s ?? "")
    .replace(/[Ññ]/g, "\u0001")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\u0001/g, "Ñ")
    .toUpperCase()
    .replace(/[^A-ZÑ\s]/g, " ")
    .trim().replace(/\s+/g, " ");
}

const palabras = (s: unknown) => normalizar(s).split(" ").filter(Boolean);

export type Comparacion = { veredicto: "identico" | "compatible" | "dudoso" | "distinto"; razon: string };

/** Apellido paterno y primer nombre exactos; el materno perdona si falta. */
export function compararPersonas(a: Partial<Persona>, b: Partial<Persona>): Comparacion {
  if (normalizar(a.apellidoPaterno) !== normalizar(b.apellidoPaterno)) {
    return { veredicto: "distinto", razon: "El apellido paterno no coincide." };
  }
  const matA = normalizar(a.apellidoMaterno), matB = normalizar(b.apellidoMaterno);
  if (matA && matB && matA !== matB) {
    return { veredicto: "distinto", razon: "El apellido materno no coincide." };
  }
  const nA = palabras(a.nombres), nB = palabras(b.nombres);
  if (!nA.length || !nB.length) return { veredicto: "dudoso", razon: "Faltan los nombres de pila." };
  if (nA[0] !== nB[0]) return { veredicto: "distinto", razon: "El primer nombre no coincide." };

  const iguales = nA.length === nB.length && nA.every((p, i) => p === nB[i]);
  return iguales && matA && matB
    ? { veredicto: "identico", razon: "Coinciden apellidos y nombres." }
    : { veredicto: "compatible", razon: "Coinciden los apellidos y el primer nombre." };
}

export const nombreNatural = (p?: Partial<Persona> | null) =>
  [p?.nombres, p?.apellidoPaterno, p?.apellidoMaterno].map((x) => (x ?? "").trim()).filter(Boolean).join(" ");

export const enmascararDni = (dni: string) =>
  dni.length < 5 ? "*".repeat(dni.length) : dni.slice(0, 2) + "*".repeat(dni.length - 4) + dni.slice(-2);

export const hashDni = (dni: string) =>
  "sha256:" + createHash("sha256").update(dni + (process.env.DNI_PEPPER ?? "sin-pepper")).digest("hex");

// ────────────────────────────────────────────────────────────── padrón ──

export function buscarEnPadron(codigo: string, padron: Padron | null, universidad: string | null) {
  if (!padron) return { disponible: false as const };

  // Si el padrón mezcla universidades y no sabemos de cuál es la persona, no
  // se puede consultar: dos universidades pueden usar el mismo código y
  // daríamos por buena una coincidencia que no significa nada.
  if (!universidad && padron.universidades.size > 1) return { disponible: false as const };

  if (universidad && padron.universidades.size && !padron.universidades.has(universidad)) {
    return { disponible: false as const };
  }
  const fila = padron.get(codigo.toUpperCase());
  if (!fila) return { disponible: true as const, ok: false, motivo: "Ese código no figura en el padrón de matriculados." };

  if (universidad && fila.universidad && fila.universidad.toUpperCase() !== universidad) {
    return {
      disponible: true as const, ok: false,
      motivo: `Ese código es de ${fila.universidad}, pero tu correo es de ${universidad}.`,
    };
  }

  const estado = (fila.estado || "matriculado").toLowerCase();
  return {
    disponible: true as const,
    ok: estado === "matriculado",
    motivo: estado === "matriculado" ? null : `El código figura como «${estado}».`,
    persona: {
      nombres: fila.nombres,
      apellidoPaterno: fila.apellido_paterno,
      apellidoMaterno: fila.apellido_materno ?? "",
    } as Persona,
    universidad: fila.universidad ?? null,
    carrera: fila.carrera ?? null,
    facultad: fila.facultad ?? null,
    ciclo: fila.ciclo ?? null,
    estado,
  };
}

// ────────────────────────────────────────────────────────── orquestador ──

export async function validarInscripcion(
  { dni, codigo, correo }: { dni?: unknown; codigo?: unknown; correo?: unknown },
  { padron = null as Padron | null } = {},
): Promise<Veredicto> {
  const pasos: Paso[] = [];
  const paso = (nombre: string, ok: boolean, detalle?: string) => { pasos.push({ paso: nombre, ok, detalle }); };

  const fdni = validarDni(dni);
  // La traza va a logs y al panel de admin: nunca lleva el DNI completo.
  paso("DNI", fdni.ok, fdni.ok ? enmascararDni(fdni.dni) : fdni.motivo);
  if (!fdni.ok) return { estado: "invalido", motivo: fdni.motivo, pasos };

  const ucorreo = universidadPorCorreo(correo);
  paso("correo institucional", ucorreo.ok,
    ucorreo.ok
      ? (ucorreo.clase === "catalogada" ? ucorreo.universidadNombre : `${ucorreo.dominio} · sin catalogar`)
      : ucorreo.motivo);

  const siglas = ucorreo.ok ? ucorreo.universidad : null;
  const fcod = validarCodigo(codigo, { universidad: siglas });
  paso("código de estudiante", fcod.ok, fcod.ok ? `${fcod.largo} caracteres` : fcod.motivo);
  if (!fcod.ok) return { estado: "invalido", motivo: fcod.motivo, pasos };

  // Una universidad que no está catalogada va a revisión manual sí o sí: sin
  // saber cuál es, ningún padrón puede confirmar nada sobre esta persona.
  const sinCatalogar = ucorreo.ok && ucorreo.clase === "educativa_sin_catalogar";

  const pad = sinCatalogar ? { disponible: false as const } : buscarEnPadron(fcod.codigo, padron, siglas);
  if (pad.disponible) {
    paso("padrón institucional", !!pad.ok, pad.ok ? nombreNatural(pad.persona) : pad.motivo ?? undefined);
    if (!pad.ok) return { estado: "invalido", motivo: pad.motivo!, pasos };
  }

  const cons = await consultarDni(fdni.dni);
  paso("nombre del DNI", cons.ok, cons.ok ? nombreNatural(cons.persona) : cons.motivo);

  const armar = (extra: Partial<Perfil>): Perfil => ({
    nombreCompleto: cons.ok ? nombreNatural(cons.persona) : null,
    nombres: cons.ok ? cons.persona.nombres : null,
    apellidoPaterno: cons.ok ? cons.persona.apellidoPaterno : null,
    apellidoMaterno: cons.ok ? cons.persona.apellidoMaterno : null,
    dniHash: hashDni(fdni.dni),
    codigoEstudiante: fcod.codigo,
    anioIngreso: fcod.anioIngreso,
    universidad: siglas,
    universidadNombre: porSiglas(siglas)?.nombre ?? null,
    prioridad: porSiglas(siglas)?.prioridad ?? null,
    dominioPorCatalogar: ucorreo.ok && ucorreo.clase === "educativa_sin_catalogar" ? ucorreo.dominio : null,
    carrera: null, facultad: null, ciclo: null,
    correoInstitucional: ucorreo.ok ? ucorreo.correo : null,
    verificadoPor: "pendiente",
    ...extra,
  });

  // Camino A: con padrón, el cruce de nombres prueba que el código es suyo.
  if (pad.disponible && pad.ok) {
    if (!cons.ok) {
      return { estado: "revision_manual", motivo: "No pudimos confirmar tu nombre contra el DNI.", pasos, perfil: armar({ verificadoPor: "padrón, sin confirmar DNI" }) };
    }
    const cmp = compararPersonas(cons.persona, pad.persona!);
    const pasa = cmp.veredicto === "identico" || cmp.veredicto === "compatible";
    paso("DNI ↔ padrón", pasa, cmp.razon);
    if (cmp.veredicto === "distinto") {
      return { estado: "invalido", motivo: "Ese código de estudiante no corresponde a tu DNI.", pasos };
    }
    if (!pasa) return { estado: "revision_manual", motivo: cmp.razon, pasos };

    return {
      estado: "valido", motivo: null, pasos,
      perfil: armar({
        universidad: pad.universidad ?? siglas,
        carrera: pad.carrera, facultad: pad.facultad, ciclo: pad.ciclo,
        verificadoPor: "padrón institucional",
      }),
    };
  }

  // Camino B: sin padrón, el correo institucional es lo que prueba.
  if (!ucorreo.ok) {
    return { estado: "revision_manual", motivo: ucorreo.motivo, pasos };
  }
  if (ucorreo.clase === "educativa_sin_catalogar") {
    return { estado: "revision_manual", motivo: ucorreo.nota, pasos, perfil: armar({ verificadoPor: "correo .edu.pe sin catalogar" }) };
  }
  if (!cons.ok) {
    return { estado: "revision_manual", motivo: `Verificamos tu universidad, pero no tu nombre: ${cons.motivo}`, pasos, perfil: armar({ verificadoPor: "correo institucional, sin confirmar DNI" }) };
  }

  return { estado: "valido", motivo: null, pasos, perfil: armar({ verificadoPor: "correo institucional" }) };
}
