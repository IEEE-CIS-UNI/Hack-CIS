/**
 * GET/PATCH /api/perfil — la ficha de quien ya está inscrito.
 *
 * GET devuelve todo junto (persona, inscripciones y equipo) desde la función
 * `my_overview` de la base.
 *
 * Lo que se puede cambiar y lo que no:
 *
 *   sí  — teléfono, carrera, ciclo, nivel, LinkedIn, GitHub, Discord, foto.
 *   no  — nombre, correo, DNI, universidad. Eso es la identidad verificada;
 *         si cambiara a voluntad, la verificación no habría servido de nada.
 *         Además la base solo deja editar esas columnas.
 */

import { conToken, tokenDe } from "@/lib/supabase";
import { NIVELES, carrerasDelCatalogo, type Nivel } from "@/lib/inscripcion";
import { SLUG_OTRA, limpiarCarrera } from "@/lib/carreras";
import { normalizarDiscord, normalizarGithub, normalizarLinkedin } from "@/lib/contacto";
import { normalizarTelefono } from "@/lib/telefono";
import { json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

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

  const { data, error } = await s.sb.rpc("my_overview");
  if (error) return json({ ok: false, motivo: "No pudimos leer tu ficha." }, 500);
  if (!data?.person) return json({ ok: false, sinInscripcion: true, motivo: "Todavía no estás inscrito." }, 404);

  return json({ ok: true, resumen: data });
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

  // Carrera: de la lista; «Otra carrera» pide el nombre, limpio y con mayúsculas.
  if (cuerpo.carrera_id !== undefined) {
    const catalogo = await carrerasDelCatalogo();
    const c = catalogo.find((x) => x.id === Number(cuerpo.carrera_id));
    if (!c) return json({ ok: false, campo: "carrera", motivo: "Elige tu carrera de la lista." }, 422);
    cambios.career_id = c.id;
    if (c.slug === SLUG_OTRA) {
      const otra = limpiarCarrera(cuerpo.carrera_otra);
      if (!otra) return json({ ok: false, campo: "carrera", motivo: "Escribe cuál es tu carrera." }, 422);
      cambios.career_other = otra;
    } else {
      cambios.career_other = null;
    }
  }

  if (cuerpo.ciclo !== undefined) {
    const a = Number(cuerpo.ciclo);
    if (!Number.isInteger(a) || a < 1 || a > 10) {
      return json({ ok: false, campo: "ciclo", motivo: "Elige en qué ciclo estás, del 1 al 10." }, 422);
    }
    cambios.cycle = a;
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

  // Que los sponsors lo conozcan al terminar el evento: opcional y se puede cambiar cuando quiera.
  if (cuerpo.sponsors !== undefined) cambios.sponsors_consent = cuerpo.sponsors === true;

  // Redes y contacto: se aceptan en cualquier forma razonable y se guardan en una sola.
  for (const [campo, columna, fn] of [
    ["linkedin", "linkedin_url", normalizarLinkedin],
    ["github", "github_url", normalizarGithub],
    ["discord", "discord_username", normalizarDiscord],
  ] as const) {
    if (cuerpo[campo] === undefined) continue;
    const r = fn(cuerpo[campo]);
    if (!r.ok) return json({ ok: false, campo, motivo: r.motivo }, 422);
    cambios[columna] = r.valor;
  }

  if (!Object.keys(cambios).length) {
    return json({ ok: false, motivo: "No mandaste nada que cambiar." }, 400);
  }

  const { data: fila, error } = await s.sb
    .from("people")
    .update(cambios)
    .eq("auth_user_id", s.usuario.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23514") return json({ ok: false, motivo: "Alguno de los datos no es válido." }, 422);
    return json({ ok: false, motivo: "No pudimos guardar los cambios." }, 500);
  }
  if (!fila) return json({ ok: false, sinInscripcion: true, motivo: "Todavía no estás inscrito." }, 404);

  const { data } = await s.sb.rpc("my_overview");
  return json({ ok: true, resumen: data });
}
