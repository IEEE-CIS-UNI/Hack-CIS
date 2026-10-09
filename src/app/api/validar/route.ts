/**
 * POST /api/validar — el veredicto final.
 *
 *   200  valido            entra directo
 *   202  revision_manual   entra a la cola de un admin
 *   422  invalido          hay una contradicción real
 */

import { validarInscripcion } from "@/lib/validacion";
import { cargarPadron } from "@/lib/padron";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "validar", 15);
  if (!lim.ok) return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera unos segundos y reintenta." }, 429);

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const r = await validarInscripcion(
    { dni: cuerpo.dni, codigo: cuerpo.codigo, correo: cuerpo.correo },
    { padron: cargarPadron() },
  );

  // Aquí va el guardado del inscrito cuando exista la base de datos:
  // el perfil ya trae el DNI hasheado y nunca el número en claro.

  const estado = r.estado === "valido" ? 200 : r.estado === "revision_manual" ? 202 : 422;
  return json(r, estado);
}
