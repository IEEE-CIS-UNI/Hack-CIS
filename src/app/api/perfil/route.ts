/**
 * GET/PATCH /api/perfil — la ficha de quien ya está inscrito.
 *
 * Lo que se puede cambiar y lo que no:
 *
 *   sí  — teléfono, carrera, año, track, nivel, GitHub, LinkedIn.
 *   no  — nombre, correo, DNI, universidad. Eso es la identidad verificada;
 *         si cambiara a voluntad, la verificación no habría servido de nada.
 */

import { conToken, tokenDe } from "@/lib/supabase";
import { TRACKS, NIVELES, type Nivel, type Track } from "@/lib/inscripcion";
import { normalizarTelefono } from "@/lib/telefono";
import { json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

const CAMPOS = "id, name, email, phone, career, study_year, track, level, institution_id, discord_id, discord_username, linkedin_url, github_url, photo_url, badge_number, qr_token, created_at";

async function sesionDe(req: Request) {
  const token = tokenDe(req);
  if (!token) return { error: json({ ok: false, motivo: "Necesitas iniciar sesión." }, 401) };
  const sb = conToken(token);
  // Explícito: sin el token, getUser() se cuelga en el servidor (ver la nota
  // en api/completar).
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) {
    return { error: json({ ok: false, motivo: "Tu sesión venció. Vuelve a entrar." }, 401) };
  }
  return { sb, usuario: data.user };
}

export async function GET(req: Request) {
  const s = await sesionDe(req);
  if (s.error) return s.error;

  const { data, error } = await s.sb
    .from("hackers")
    .select(`${CAMPOS}, institutions(name, short_name)`)
    .eq("auth_user_id", s.usuario.id)
    .maybeSingle();

  if (error) return json({ ok: false, motivo: "No pudimos leer tu ficha." }, 500);
  if (!data) return json({ ok: false, sinInscripcion: true, motivo: "Todavía no estás inscrito." }, 404);

  return json({ ok: true, hacker: data });
}

export async function PATCH(req: Request) {
  const s = await sesionDe(req);
  if (s.error) return s.error;

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const cambios: Record<string, unknown> = {};

  if (cuerpo.telefono !== undefined) {
    const tel = normalizarTelefono(cuerpo.telefono, String(cuerpo.pais ?? "PE"));
    if (!tel.ok) return json({ ok: false, campo: "telefono", motivo: tel.motivo }, 422);
    cambios.phone = tel.e164;
  }

  if (cuerpo.carrera !== undefined) {
    const c = String(cuerpo.carrera).trim().replace(/\s+/g, " ");
    if (c.length < 3 || c.length > 80) {
      return json({ ok: false, campo: "carrera", motivo: "Escribe tu carrera." }, 422);
    }
    cambios.career = c;
  }

  if (cuerpo.anio !== undefined) {
    const a = Number(cuerpo.anio);
    if (!Number.isInteger(a) || a < 1 || a > 7) {
      return json({ ok: false, campo: "anio", motivo: "Elige en qué año estás." }, 422);
    }
    cambios.study_year = a;
  }

  if (cuerpo.track !== undefined) {
    if (!TRACKS.some((t) => t.id === cuerpo.track)) {
      return json({ ok: false, campo: "track", motivo: "Elige un track válido." }, 422);
    }
    cambios.track = cuerpo.track as Track;
  }

  if (cuerpo.nivel !== undefined) {
    if (cuerpo.nivel !== null && !NIVELES.includes(cuerpo.nivel as Nivel)) {
      return json({ ok: false, campo: "nivel", motivo: "Elige un nivel válido." }, 422);
    }
    cambios.level = cuerpo.nivel;
  }

  // La foto se sube al depósito desde el navegador; aquí solo se guarda a
  // dónde quedó. Se exige que la URL pertenezca a nuestro depósito y a la
  // carpeta de esta persona: si no, cualquiera podría apuntar su «foto» a
  // una imagen ajena o a un sitio de terceros.
  if (cuerpo.foto !== undefined) {
    const v = String(cuerpo.foto ?? "").trim();
    if (!v) {
      cambios.photo_url = null;
    } else {
      const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos/${s.usuario.id}/`;
      if (!v.startsWith(base)) {
        return json({ ok: false, campo: "foto", motivo: "Esa imagen no es tuya." }, 422);
      }
      cambios.photo_url = v;
    }
  }

  for (const [campo, columna] of [["linkedin", "linkedin_url"], ["github", "github_url"]] as const) {
    if (cuerpo[campo] === undefined) continue;
    const v = String(cuerpo[campo] ?? "").trim();
    if (!v) { cambios[columna] = null; continue; }
    if (!/^https?:\/\/[^\s]+\.[^\s]+$/.test(v)) {
      return json({ ok: false, campo, motivo: "Pega el enlace completo, empezando por https://" }, 422);
    }
    cambios[columna] = v;
  }

  if (!Object.keys(cambios).length) {
    return json({ ok: false, motivo: "No mandaste nada que cambiar." }, 400);
  }

  const { data, error } = await s.sb
    .from("hackers")
    .update(cambios)
    .eq("auth_user_id", s.usuario.id)
    .select(CAMPOS)
    .maybeSingle();

  if (error) {
    if (error.code === "23514") return json({ ok: false, motivo: error.message }, 422);
    return json({ ok: false, motivo: "No pudimos guardar los cambios." }, 500);
  }
  if (!data) return json({ ok: false, sinInscripcion: true, motivo: "Todavía no estás inscrito." }, 404);

  return json({ ok: true, hacker: data });
}
