/**
 * La inscripción, de extremo a extremo.
 *
 * Hay dos planes y cada uno pide cosas distintas:
 *
 *   hack_bootcamp   — la hackathon y las sesiones del bootcamp que elija: el
 *                     bootcamp va incluido para quien entra a la hack. DNI y
 *                     nombre escritos por la persona, y correo de una
 *                     institución del catálogo (que es lo que prueba que
 *                     estudia). El DNI se guarda solo como huella.
 *   bootcamp        — solo sesiones. Abierto a cualquiera: nombre y correo
 *                     confirmado, sin DNI.
 *
 * Orden de las comprobaciones, de la más barata a la más cara:
 *
 *   1. forma      — plan, sesiones, carrera del catálogo, ciclo: cuesta cero.
 *   2. teléfono   — se normaliza a E.164 sin salir del proceso.
 *   3. correo     — para la hack, el dominio decide la institución contra la
 *                   misma tabla que usa la base.
 *   4. DNI        — solo el formato: no se consulta a ningún servicio (las
 *                   consultas a RENIEC cuestan). Sirve para impedir dos
 *                   inscripciones con el mismo documento y para que el líder
 *                   arme su equipo; la identidad la respalda el correo
 *                   institucional y se revisa el documento en el ingreso.
 *
 * Lo que sale de aquí es exactamente lo que se guarda: nada se arma después.
 * El track ya no se elige aquí: lo elige el equipo, desde la página del track.
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { validarDni, hashDni } from "./validacion";
import { normalizarTelefono } from "./telefono";
import { SLUG_OTRA, limpiarCarrera, type Carrera } from "./carreras";
import { normalizarDiscord, normalizarGithub, normalizarLinkedin, origenValido } from "./contacto";
import { SESIONES } from "./contenido";
import { SUPABASE_CLAVE, SUPABASE_URL } from "./supabase";

export const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;
export type Nivel = (typeof NIVELES)[number];

export const PLANES = ["hack_bootcamp", "bootcamp"] as const;
export type Plan = (typeof PLANES)[number];

export const incluyeHack = (p: Plan) => p === "hack_bootcamp";
export const incluyeBootcamp = (p: Plan) => p === "bootcamp" || p === "hack_bootcamp";

const ETIQUETA_PLAN: Record<Plan, string> = {
  hack_bootcamp: "la Hackathon y el Bootcamp",
  bootcamp: "el Bootcamp",
};

/** Lo que viaja en el boleto y se entrega a la base. Los nombres de las columnas son los de `people`. */
export type Inscripcion = {
  plan: Plan;
  plan_label: string;
  sesiones: string[];
  name: string;
  display_name: string;
  email: string;
  phone: string | null;
  dni_hash: string | null;
  career_id: number | null;
  career_other: string | null;
  cycle: number | null;
  linkedin_url: string | null;
  github_url: string | null;
  discord_username: string | null;
  heard_from: string | null;
  level: Nivel | null;
  affiliation: string | null;
};

export type Fallo = { ok: false; campo: string; motivo: string; reintentable?: boolean };
export type Exito = { ok: true; datos: Inscripcion; nombreDni?: string | null };

const texto = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");

/** «ROSA MARÍA» -> «Rosa María». Con acentos y ñ intactos. */
export const titulo = (s: string) =>
  s.toLocaleLowerCase("es").replace(/(^|\s)\p{L}/gu, (c) => c.toLocaleUpperCase("es"));

const primera = (s: string) => texto(s).split(" ")[0] ?? "";

/**
 * Catálogo de dominios, leído de la base.
 *
 * Es la misma tabla que usa la base para decidir la institución, así que
 * preguntarle a ella evita el caso feo: el formulario dice que sí y la base
 * dice que no.
 */
export async function universidadDelCorreo(correo: string) {
  if (!SUPABASE_URL || !SUPABASE_CLAVE) return { ok: false as const, motivo: "La base de datos no está configurada." };

  const dominio = correo.split("@").pop()!.toLowerCase();
  const sb = createClient(SUPABASE_URL, SUPABASE_CLAVE, { auth: { persistSession: false } });

  // Muchas universidades dan a sus estudiantes un subdominio (aloe.ulima.edu.pe,
  // alum.up.edu.pe). Se prueba el dominio completo y cada dominio del que
  // cuelga, y gana el más específico.
  const partes = dominio.split(".");
  const candidatos = partes.slice(0, -1).map((_, i) => partes.slice(i).join("."));

  const { data: filas, error } = await sb
    .from("university_domains")
    .select("domain, institution_id, institutions(name, short_name, is_eligible)")
    .in("domain", candidatos);
  const data = (filas ?? []).sort((a, b) => b.domain.length - a.domain.length)[0] ?? null;

  if (error) return { ok: false as const, motivo: "No pudimos consultar el catálogo de universidades." };
  if (!data) {
    return {
      ok: false as const,
      motivo: `«${dominio}» no está en nuestra lista de universidades e institutos. Usa el correo que te dio la tuya, y si crees que es un error escríbenos.`,
    };
  }

  const u = data.institutions as unknown as { name: string; short_name: string; is_eligible: boolean } | null;
  if (u && u.is_eligible === false) {
    return { ok: false as const, motivo: `${u.name} no está habilitada para esta edición.` };
  }

  return {
    ok: true as const,
    dominio,
    institution_id: data.institution_id as string,
    nombre: u?.name ?? dominio,
    siglas: u?.short_name ?? null,
  };
}

let cacheCarreras: { en: number; datos: Carrera[] } | null = null;

/**
 * Las carreras del catálogo. Se guardan unos minutos en memoria: cambian casi
 * nunca y así no hay una consulta más por cada inscripción.
 */
export async function carrerasDelCatalogo(): Promise<Carrera[]> {
  if (cacheCarreras && Date.now() - cacheCarreras.en < 10 * 60_000) return cacheCarreras.datos;
  if (!SUPABASE_URL || !SUPABASE_CLAVE) return [];
  const sb = createClient(SUPABASE_URL, SUPABASE_CLAVE, { auth: { persistSession: false } });
  const { data, error } = await sb.from("careers").select("id, slug, name, field").order("position");
  if (error || !data) return cacheCarreras?.datos ?? [];
  cacheCarreras = { en: Date.now(), datos: data as Carrera[] };
  return cacheCarreras.datos;
}

/**
 * Valida todo y devuelve lo listo para guardar.
 *
 * Regla heredada del diseño anterior y que se mantiene: que un servicio
 * externo se caiga no es culpa de quien se inscribe. Si la API de DNI falla,
 * se devuelve `reintentable` para que la interfaz lo diga así y no acuse a
 * la persona de haber escrito mal su documento.
 */
export async function validarInscripcion(cuerpo: Record<string, unknown>): Promise<Exito | Fallo> {
  // ── 1. forma ──
  const plan = texto(cuerpo.plan) as Plan;
  if (!PLANES.includes(plan)) return { ok: false, campo: "plan", motivo: "Elige qué quieres hacer." };

  const validas = new Set(SESIONES.map((s) => s.slug));
  const sesiones = Array.isArray(cuerpo.sesiones)
    ? [...new Set(cuerpo.sesiones.map(texto).filter((s) => validas.has(s)))]
    : [];
  if (incluyeBootcamp(plan) && sesiones.length === 0) {
    return { ok: false, campo: "sesiones", motivo: "Elige al menos una sesión del bootcamp." };
  }
  const sesionesFinal = incluyeBootcamp(plan) ? sesiones : [];

  const correo = texto(cuerpo.correo).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, campo: "correo", motivo: "Ese correo no parece estar bien escrito." };
  }

  // ── 2. teléfono ──
  // Para la hack es obligatorio (coordinar equipos); para el bootcamp, opcional.
  const crudoTel = texto(cuerpo.telefono);
  let phone: string | null = null;
  if (crudoTel || incluyeHack(plan)) {
    const tel = normalizarTelefono(crudoTel, texto(cuerpo.pais) || "PE");
    if (!tel.ok) return { ok: false, campo: "telefono", motivo: tel.motivo };
    phone = tel.e164;
  }

  const base = { plan, plan_label: ETIQUETA_PLAN[plan], sesiones: sesionesFinal, email: correo, phone };

  // ── nombre: lo escribe la persona, en los dos planes ──
  const nombres = texto(cuerpo.nombres);
  const apellidos = texto(cuerpo.apellidos);
  if (nombres.length < 2) return { ok: false, campo: "nombres", motivo: "Escribe tus nombres." };
  if (apellidos.length < 2) return { ok: false, campo: "apellidos", motivo: "Escribe tus apellidos." };
  if (nombres.length > 60 || apellidos.length > 60) {
    return { ok: false, campo: "nombres", motivo: "Ese nombre es demasiado largo." };
  }
  const name = titulo(`${nombres} ${apellidos}`);
  const display_name = titulo(`${primera(nombres)} ${primera(apellidos)}`);

  // ── contacto y redes: todo opcional, guardado en un solo formato ──
  const li = normalizarLinkedin(cuerpo.linkedin);
  if (!li.ok) return { ok: false, campo: "linkedin", motivo: li.motivo };
  const gh = normalizarGithub(cuerpo.github);
  if (!gh.ok) return { ok: false, campo: "github", motivo: gh.motivo };
  const dc = normalizarDiscord(cuerpo.discord);
  if (!dc.ok) return { ok: false, campo: "discord", motivo: dc.motivo };
  const origenCrudo = texto(cuerpo.origen);
  const heard_from = origenValido(origenCrudo) ? origenCrudo : null;
  const contacto = { linkedin_url: li.valor, github_url: gh.valor, discord_username: dc.valor, heard_from };

  // ── solo bootcamp: sin DNI ──
  if (plan === "bootcamp") {
    const afiliacion = texto(cuerpo.afiliacion).slice(0, 80) || null;
    return {
      ok: true,
      nombreDni: null,
      datos: {
        ...base, name, display_name, ...contacto,
        dni_hash: null, career_id: null, career_other: null, cycle: null, level: null,
        affiliation: afiliacion,
      },
    };
  }

  // ── con hack: carrera, correo institucional y DNI ──
  const catalogo = await carrerasDelCatalogo();
  const carrera = catalogo.find((c) => c.id === Number(cuerpo.carrera_id));
  if (!carrera) return { ok: false, campo: "carrera", motivo: "Elige tu carrera de la lista." };
  let carreraOtra: string | null = null;
  if (carrera.slug === SLUG_OTRA) {
    carreraOtra = limpiarCarrera(cuerpo.carrera_otra);
    if (!carreraOtra) return { ok: false, campo: "carrera", motivo: "Escribe cuál es tu carrera (solo letras, de 3 a 60)." };
  }

  const ciclo = Number(cuerpo.ciclo);
  if (!Number.isInteger(ciclo) || ciclo < 1 || ciclo > 10) {
    return { ok: false, campo: "ciclo", motivo: "Elige en qué ciclo estás, del 1 al 10." };
  }

  const nivelCrudo = texto(cuerpo.nivel);
  const nivel = NIVELES.includes(nivelCrudo as Nivel) ? (nivelCrudo as Nivel) : null;

  const uni = await universidadDelCorreo(correo);
  if (!uni.ok) return { ok: false, campo: "correo", motivo: uni.motivo };

  const fdni = validarDni(cuerpo.dni);
  if (!fdni.ok) return { ok: false, campo: "dni", motivo: fdni.motivo };

  return {
    ok: true,
    nombreDni: null,
    datos: {
      ...base, name, display_name, ...contacto,
      dni_hash: hashDni(fdni.dni),
      career_id: carrera.id,
      career_other: carreraOtra,
      cycle: ciclo,
      level: nivel,
      affiliation: null,
    },
  };
}

/**
 * Comprueba que lo que volvió del correo sea lo que mandamos.
 *
 * Los metadatos del usuario son, en principio, editables por su dueño. Antes
 * de usarlos se revisan de nuevo: si algo no calza, se descarta la inscripción
 * en vez de guardar basura.
 */
export function metadatosValidos(m: unknown): m is Inscripcion {
  if (!m || typeof m !== "object") return false;
  const d = m as Record<string, unknown>;
  const plan = d.plan as Plan;
  if (!PLANES.includes(plan)) return false;
  const validas = new Set(SESIONES.map((s) => s.slug));
  const sesionesOk =
    Array.isArray(d.sesiones) &&
    d.sesiones.every((s) => typeof s === "string" && validas.has(s)) &&
    (!incluyeBootcamp(plan) || d.sesiones.length > 0);

  const base =
    sesionesOk &&
    typeof d.name === "string" && d.name.length > 0 &&
    typeof d.email === "string" && d.email.includes("@") &&
    (d.phone === null || (typeof d.phone === "string" && /^\+\d{8,15}$/.test(d.phone))) &&
    [d.linkedin_url, d.github_url, d.discord_username, d.heard_from].every((x) => x === null || x === undefined || typeof x === "string");
  if (!base) return false;

  if (!incluyeHack(plan)) return true;

  return (
    typeof d.dni_hash === "string" && d.dni_hash.startsWith("sha256:") &&
    typeof d.career_id === "number" && Number.isInteger(d.career_id) &&
    (d.career_other === null || typeof d.career_other === "string") &&
    typeof d.cycle === "number" && d.cycle >= 1 && d.cycle <= 10 &&
    (d.level === null || NIVELES.includes(d.level as Nivel))
  );
}
