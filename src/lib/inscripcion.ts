/**
 * La inscripción, de extremo a extremo.
 *
 * Orden de las comprobaciones, de la más barata a la más cara:
 *
 *   1. forma      — nombre, carrera, año, track: puro texto, cuesta cero.
 *   2. teléfono   — se normaliza a E.164 sin salir del proceso.
 *   3. correo     — el dominio decide la universidad, contra la tabla
 *                   university_domains, que es la misma que usa el constraint
 *                   de la base. Si aquí pasa, el INSERT no va a rebotar.
 *   4. DNI        — lo último, porque es la única que sale a la red y la
 *                   única que cuesta créditos.
 *
 * Lo que sale de aquí es exactamente lo que se guarda: nada se arma después.
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { validarDni, consultarDni, hashDni, nombreNatural, normalizar } from "./validacion";
import { normalizarTelefono } from "./telefono";

export const TRACKS = [
  { id: "finanzas",       nombre: "IA & Finanzas",               comunidad: "CIS UP" },
  { id: "telco",          nombre: "IA & Telco y Operaciones",    comunidad: "UNI" },
  { id: "impacto_social", nombre: "IA & Impacto Social",         comunidad: "DSC PUCP" },
] as const;

export const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;

export type Track = (typeof TRACKS)[number]["id"];
export type Nivel = (typeof NIVELES)[number];

/** Lo que se guarda en hackers. Los nombres son los de las columnas. */
export type Inscripcion = {
  name: string;
  email: string;
  phone: string;
  dni_hash: string;
  career: string;
  study_year: number;
  track: Track;
  level: Nivel | null;
  institution_id: string;
};

export type Fallo = { ok: false; campo: string; motivo: string; reintentable?: boolean };
export type Exito = { ok: true; datos: Inscripcion; nombreDni: string };

const texto = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");

/**
 * Catálogo de dominios, leído de la base.
 *
 * Es la misma tabla que valida el constraint de hackers, así que preguntarle
 * a ella evita el caso feo: el formulario dice que sí y el INSERT dice que no.
 */
export async function universidadDelCorreo(correo: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { ok: false as const, motivo: "La base de datos no está configurada." };

  const dominio = correo.split("@").pop()!.toLowerCase();
  const sb = createClient(url, anon, { auth: { persistSession: false } });

  const { data, error } = await sb
    .from("university_domains")
    .select("domain, institution_id, institutions(name, short_name, is_eligible)")
    .eq("domain", dominio)
    .maybeSingle();

  if (error) return { ok: false as const, motivo: "No pudimos consultar el catálogo de universidades." };
  if (!data) {
    return {
      ok: false as const,
      motivo: `«${dominio}» no está en nuestra lista de universidades. Usa el correo que te dio la tuya, y si crees que es un error escríbenos.`,
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
 * Valida todo y devuelve la fila lista para guardar.
 *
 * Regla heredada del diseño anterior y que se mantiene: que un servicio
 * externo se caiga no es culpa de quien se inscribe. Si la API de DNI falla,
 * se devuelve `reintentable` para que la interfaz lo diga así y no acuse a
 * la persona de haber escrito mal su documento.
 */
export async function validarInscripcion(cuerpo: Record<string, unknown>): Promise<Exito | Fallo> {
  // ── 1. forma ──
  const carrera = texto(cuerpo.carrera);
  if (carrera.length < 3) return { ok: false, campo: "carrera", motivo: "Escribe tu carrera." };
  if (carrera.length > 80) return { ok: false, campo: "carrera", motivo: "Ese nombre de carrera es demasiado largo." };

  const anio = Number(cuerpo.anio);
  if (!Number.isInteger(anio) || anio < 1 || anio > 7) {
    return { ok: false, campo: "anio", motivo: "Elige en qué año de la carrera estás." };
  }

  const track = texto(cuerpo.track) as Track;
  if (!TRACKS.some((t) => t.id === track)) {
    return { ok: false, campo: "track", motivo: "Elige un track." };
  }

  const nivelCrudo = texto(cuerpo.nivel);
  const nivel = NIVELES.includes(nivelCrudo as Nivel) ? (nivelCrudo as Nivel) : null;

  // ── 2. teléfono ──
  const tel = normalizarTelefono(cuerpo.telefono, texto(cuerpo.pais) || "PE");
  if (!tel.ok) return { ok: false, campo: "telefono", motivo: tel.motivo };

  // ── 3. correo ──
  const correo = texto(cuerpo.correo).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, campo: "correo", motivo: "Ese correo no parece estar bien escrito." };
  }
  const uni = await universidadDelCorreo(correo);
  if (!uni.ok) return { ok: false, campo: "correo", motivo: uni.motivo };

  // ── 4. DNI ──
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
  return {
    ok: true,
    nombreDni,
    datos: {
      name: nombreDni,
      email: correo,
      phone: tel.e164,
      dni_hash: hashDni(fdni.dni),
      career: carrera,
      study_year: anio,
      track,
      level: nivel,
      institution_id: uni.institution_id,
    },
  };
}

/**
 * Comprueba que lo que volvió del correo sea lo que mandamos.
 *
 * Los metadatos del usuario son, en principio, editables por su dueño. Antes
 * de copiarlos a la tabla se revisan de nuevo: si algo no calza con lo que el
 * servidor validó, se descarta la inscripción en vez de guardar basura.
 */
export function metadatosValidos(m: unknown): m is Inscripcion {
  if (!m || typeof m !== "object") return false;
  const d = m as Record<string, unknown>;
  return (
    typeof d.name === "string" && d.name.length > 0 &&
    typeof d.email === "string" && d.email.includes("@") &&
    typeof d.phone === "string" && /^\+\d{8,15}$/.test(d.phone) &&
    typeof d.dni_hash === "string" && d.dni_hash.startsWith("sha256:") &&
    typeof d.career === "string" && d.career.length >= 3 &&
    typeof d.study_year === "number" && d.study_year >= 1 && d.study_year <= 7 &&
    TRACKS.some((t) => t.id === d.track) &&
    (d.level === null || NIVELES.includes(d.level as Nivel)) &&
    typeof d.institution_id === "string" && d.institution_id.length > 0
  );
}

/** Para el panel de admin y los correos: «ROSA MARÍA» -> «Rosa María». */
export const enTitulo = (s: string) =>
  normalizar(s).toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
