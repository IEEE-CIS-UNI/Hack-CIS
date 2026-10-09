/**
 * POST /api/validar-dni — el nombre real detrás de un DNI.
 *
 * El token vive solo aquí. Si esta consulta se hiciera desde el navegador,
 * cualquiera podría vaciar nuestros créditos o usar la cuenta para consultar
 * DNIs ajenos.
 */

import { validarDni, consultarDni, nombreNatural, enmascararDni } from "@/lib/validacion";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "validar-dni", 15);
  if (!lim.ok) return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera unos segundos y reintenta." }, 429);

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const fmt = validarDni(cuerpo.dni);
  if (!fmt.ok) return json({ ok: false, motivo: fmt.motivo }, 400);

  const r = await consultarDni(fmt.dni);
  if (!r.ok) {
    // Que el proveedor falle no es culpa de quien se inscribe: 502, no 400.
    const esDelUsuario = /no encontramos ese dni/i.test(r.motivo);
    return json({ ok: false, motivo: r.motivo, reintentable: !esDelUsuario }, esDelUsuario ? 404 : 502);
  }

  return json({
    ok: true,
    dni: enmascararDni(fmt.dni),
    persona: {
      nombres: r.persona.nombres,
      apellidoPaterno: r.persona.apellidoPaterno,
      apellidoMaterno: r.persona.apellidoMaterno,
      nombreCompleto: nombreNatural(r.persona),
    },
  }, 200, { "X-Consultas-Restantes": String(lim.restantes) });
}
