/**
 * POST /api/matricular — inscribirse a algo más estando ya dentro.
 *
 * Es lo que hace el botón de /bootcamp/01: quien ya tiene cuenta (porque está
 * en la hack o en otra sesión) se inscribe con un clic, sin llenar nada. Las
 * reglas viven en la función `enroll_in` de la base.
 */

import { conToken, tokenDe } from "@/lib/supabase";
import { traducirError } from "@/lib/errores";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "matricular", 30);
  if (!lim.ok) return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera un minuto." }, 429);

  const token = tokenDe(req);
  if (!token) return json({ ok: false, motivo: "Necesitas iniciar sesión." }, 401);

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const slug = String(cuerpo.slug ?? "").trim();
  if (!/^(hack|bootcamp-\d{2})$/.test(slug)) return json({ ok: false, motivo: "Esa sesión no existe." }, 404);

  const sb = conToken(token);
  const { data: nuevo, error } = await sb.rpc("enroll_in", { p_slug: slug });
  if (error) {
    const t = traducirError(error.message, error.code);
    if (t.estado >= 500) console.error("[matricular]", error);
    return json({ ok: false, motivo: t.motivo }, t.estado);
  }

  const { data: resumen } = await sb.rpc("my_overview");
  return json({ ok: true, nuevo: nuevo?.nuevo ?? false, resumen });
}
