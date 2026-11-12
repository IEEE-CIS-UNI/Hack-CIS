/**
 * POST /api/equipo   — el líder crea el equipo de un track.
 * DELETE /api/equipo — salir del equipo (mientras el track siga abierto).
 *
 * El líder manda el nombre del equipo y los DNI de los demás. Los DNI se
 * cifran AQUÍ, con la misma sal que la inscripción: la base solo compara
 * huellas y el número nunca viaja ni se guarda. La función `create_team` hace
 * todo o nada y valida el tamaño, que estén inscritos, que no tengan equipo y
 * que haya al menos 2 carreras distintas.
 *
 * Esta ruta responde cuál de los DNI falló (por posición) y, al acertar,
 * solo el primer nombre y apellido de cada integrante: es lo justo para que el líder
 * confirme a quién agregó, sin convertir esto en un buscador de personas.
 */

import { conToken, tokenDe } from "@/lib/supabase";
import { hashDni, validarDni } from "@/lib/validacion";
import { traducirError } from "@/lib/errores";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Cada intento con un DNI inscrito o no revela algo: se limita fuerte.
  const lim = dentroDelLimite(ipDe(req), "equipo", 12);
  if (!lim.ok) return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera un minuto." }, 429);

  const token = tokenDe(req);
  if (!token) return json({ ok: false, motivo: "Necesitas iniciar sesión." }, 401);

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const track = String(cuerpo.track ?? "").trim();
  const nombre = String(cuerpo.nombre ?? "");
  const crudos = Array.isArray(cuerpo.dnis) ? cuerpo.dnis.slice(0, 6) : [];

  const hashes: string[] = [];
  for (let i = 0; i < crudos.length; i++) {
    const f = validarDni(crudos[i]);
    if (!f.ok) return json({ ok: false, posicion: i + 1, motivo: f.motivo }, 422);
    hashes.push(hashDni(f.dni));
  }

  const sb = conToken(token);
  const { data, error } = await sb.rpc("create_team", { p_track: track, p_name: nombre, p_dni_hashes: hashes });
  if (error) {
    const t = traducirError(error.message, error.code);
    if (t.estado >= 500) console.error("[equipo] create_team:", error);
    return json({ ok: false, motivo: t.motivo, posicion: t.posicion }, t.estado);
  }

  const { data: resumen } = await sb.rpc("my_overview");
  return json({ ok: true, equipo: data, resumen });
}

export async function DELETE(req: Request) {
  const token = tokenDe(req);
  if (!token) return json({ ok: false, motivo: "Necesitas iniciar sesión." }, 401);

  const sb = conToken(token);
  const { error } = await sb.rpc("leave_team");
  if (error) {
    const t = traducirError(error.message, error.code);
    return json({ ok: false, motivo: t.motivo }, t.estado);
  }
  const { data: resumen } = await sb.rpc("my_overview");
  return json({ ok: true, resumen });
}
