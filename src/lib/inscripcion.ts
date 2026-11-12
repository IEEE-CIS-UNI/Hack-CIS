/**
 * La inscripción, de extremo a extremo.
 *
 * Hay tres planes y cada uno pide cosas distintas:
 *
 *   hack            — la hackathon sola. Verificación fuerte: DNI contra RENIEC
 *                     y correo de una institución del catálogo.
 *   hack_bootcamp   — la hackathon y las sesiones del bootcamp que elija.
 *   bootcamp        — solo sesiones. Abierto a cualquiera: nombre y correo
 *                     confirmado, sin DNI. Así no se gastan créditos de
 *                     consulta de DNI en quien solo quiere un taller.
 *
 * Orden de las comprobaciones, de la más barata a la más cara:
 *
 *   1. forma      — plan, sesiones, carrera, año: puro texto, cuesta cero.
 *   2. teléfono   — se normaliza a E.164 sin salir del proceso.
 *   3. correo     — para la hack, el dominio decide la institución contra la
 *                   misma tabla que usa la base.
 *   4. DNI        — lo último, porque es la única que sale a la red y la
 *                   única que cuesta créditos. Solo en los planes con hack.
 *
 * Lo que sale de aquí es exactamente lo que se guarda: nada se arma después.
 * El track ya no se elige aquí: lo elige el equipo, desde la página del track.
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { validarDni, consultarDni, hashDni, nombreNatural } from "./validacion";
import { normalizarTelefono } from "./telefono";
import { SESIONES } from "./contenido";
import { SUPABASE_CLAVE, SUPABASE_URL } from "./supabase";

export const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;
export type Nivel = (typeof NIVELES)[number];

export const PLANES = ["hack", "hack_bootcamp", "bootcamp"] as const;
export type Plan = (typeof PLANES)[number];

export const incluyeHack = (p: Plan) => p === "hack" || p === "hack_bootcamp";
export const incluyeBootcamp = (p: Plan) => p === "bootcamp" || p === "hack_bootcamp";

const ETIQUETA_PLAN: Record<Plan, string> = {
  hack: "la Hackathon",
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
  career: string | null;
  study_year: number | null;
  level: Nivel | null;
  affiliation: string | null;
};

export type Fallo = { ok: false; campo: string; motivo: string; reintentable?: boolean };
export type Exito = { ok: true; datos: Inscripcion; nombreDni: string | null };

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

  const { data, error } = await sb
    .from("university_domains")
    .select("domain, institution_id, institutions(name, short_name, is_eligible)")
    .eq("domain", dominio)
    .maybeSingle();

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

  // ── solo bootcamp: sin DNI ──
  if (plan === "bootcamp") {
    const nombres = texto(cuerpo.nombres);
    const apellidos = texto(cuerpo.apellidos);
    if (nombres.length < 2) return { ok: false, campo: "nombres", motivo: "Escribe tus nombres." };
    if (apellidos.length < 2) return { ok: false, campo: "apellidos", motivo: "Escribe tus apellidos." };
    if (nombres.length > 60 || apellidos.length > 60) {
      return { ok: false, campo: "nombres", motivo: "Ese nombre es demasiado largo." };
    }
    const afiliacion = texto(cuerpo.afiliacion).slice(0, 80) || null;
    const name = titulo(`${nombres} ${apellidos}`);
    return {
      ok: true,
      nombreDni: null,
      datos: {
        ...base,
        name,
        display_name: titulo(`${primera(nombres)} ${primera(apellidos)}`),
        dni_hash: null, career: null, study_year: null, level: null,
        affiliation: afiliacion,
      },
    };
  }

  // ── con hack: carrera, correo institucional y DNI ──
  const carrera = texto(cuerpo.carrera);
  if (carrera.length < 3) return { ok: false, campo: "carrera", motivo: "Escribe tu carrera." };
  if (carrera.length > 80) return { ok: false, campo: "carrera", motivo: "Ese nombre de carrera es demasiado largo." };

  const anio = Number(cuerpo.anio);
  if (!Number.isInteger(anio) || anio < 1 || anio > 7) {
    return { ok: false, campo: "anio", motivo: "Elige en qué año de la carrera estás." };
  }

  const nivelCrudo = texto(cuerpo.nivel);
  const nivel = NIVELES.includes(nivelCrudo as Nivel) ? (nivelCrudo as Nivel) : null;

  const uni = await universidadDelCorreo(correo);
  if (!uni.ok) return { ok: false, campo: "correo", motivo: uni.motivo };

  const fdni = validarDni(cuerpo.dni);
  if (!fdni.ok) return { ok: false, campo: "dni", motivo: fdni.motivo };

  const consulta = await consultarDni(fdni.dni);
  if (!consulta.ok) {
    const culpaDeLaPersona = /no encontramos ese dni/i.test(consulta.motivo);
    return {
      ok: false, campo: "dni", motivo: consulta.motivo,
      reintentable: !culpaDeLaPersona,
    };
  }

  const nombreDni = nombreNatural(consulta.persona);

  // El nombre lo pone RENIEC, no el formulario: así la lista de inscritos y
  // la de asistentes del día del evento son la misma lista.
  const primerNombre = primera(consulta.persona.nombres);
  const primerApellido = primera(consulta.persona.apellidoPaterno);

  return {
    ok: true,
    nombreDni,
    datos: {
      ...base,
      name: nombreDni,
      display_name: titulo(`${primerNombre} ${primerApellido}`.trim()) || titulo(nombreDni),
      dni_hash: hashDni(fdni.dni),
      career: carrera,
      study_year: anio,
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
    (d.phone === null || (typeof d.phone === "string" && /^\+\d{8,15}$/.test(d.phone)));
  if (!base) return false;

  if (!incluyeHack(plan)) return true;

  return (
    typeof d.dni_hash === "string" && d.dni_hash.startsWith("sha256:") &&
    typeof d.career === "string" && d.career.length >= 3 &&
    typeof d.study_year === "number" && d.study_year >= 1 && d.study_year <= 7 &&
    (d.level === null || NIVELES.includes(d.level as Nivel))
  );
}
