/**
 * POST /api/universidad — qué universidad es un correo institucional.
 *
 * Pregunta a la tabla university_domains, que es la misma que usa el
 * constraint de «hackers». Antes se consultaba una lista escrita a mano en el
 * código: tenía menos universidades que la base y dejaba pasar correos que el
 * INSERT después rechazaba.
 */

import { universidadDelCorreo } from "@/lib/inscripcion";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "universidad", 40);
  if (!lim.ok) {
    return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera unos segundos y reintenta." }, 429);
  }

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const correo = String(cuerpo.correo ?? "").trim().toLowerCase();
  if (!correo) return json({ ok: false, motivo: "Escribe tu correo institucional." }, 422);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return json({ ok: false, motivo: "Ese correo no parece estar bien escrito." }, 422);
  }

  const r = await universidadDelCorreo(correo);
  if (!r.ok) return json({ ok: false, motivo: r.motivo }, 422);

  return json({ ok: true, dominio: r.dominio, universidad: r.siglas, universidadNombre: r.nombre });
}
