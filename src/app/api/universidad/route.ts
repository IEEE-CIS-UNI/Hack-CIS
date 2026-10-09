/** POST /api/universidad — qué universidad es un correo institucional. */

import { universidadPorCorreo, dominioAceptaCorreo } from "@/lib/validacion";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "universidad", 40);
  if (!lim.ok) return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera unos segundos y reintenta." }, 429);

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const r = universidadPorCorreo(cuerpo.correo);
  if (!r.ok) return json(r, 422);

  // Un .edu.pe que no resuelve por DNS está inventado: no prueba nada.
  if (r.clase === "educativa_sin_catalogar") {
    const dns = await dominioAceptaCorreo(r.dominio);
    if (!dns.ok) {
      return json({
        ok: false, clase: "dominio_inexistente", dominio: r.dominio,
        motivo: `No encontramos el dominio «${r.dominio}». Revisa que esté bien escrito.`,
      }, 422);
    }
  }

  return json(r);
}
