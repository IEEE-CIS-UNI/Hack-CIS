/** POST /api/validar-codigo — formato, año de ingreso y, si hay padrón, carrera. */

import { validarCodigo, universidadPorCorreo, buscarEnPadron } from "@/lib/validacion";
import { cargarPadron } from "@/lib/padron";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "validar-codigo", 40);
  if (!lim.ok) return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera unos segundos y reintenta." }, 429);

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  // La universidad la decide el correo, nunca el formato del código.
  const uc = cuerpo.correo ? universidadPorCorreo(cuerpo.correo) : null;
  const siglas = uc?.ok ? uc.universidad : null;

  const r = validarCodigo(cuerpo.codigo, { universidad: siglas });
  if (!r.ok) return json({ ok: false, codigo: r.codigo, motivo: r.motivo }, 422);

  const pad = buscarEnPadron(r.codigo, cargarPadron(), siglas);

  return json({
    ok: true,
    codigo: r.codigo,
    largo: r.largo,
    anioIngreso: r.anioIngreso,
    sufijo: r.sufijo,
    certeza: r.certeza,
    padron: pad.disponible
      ? {
          consultado: true,
          encontrado: !!pad.persona,
          carrera: pad.carrera ?? null,
          facultad: pad.facultad ?? null,
          ciclo: pad.ciclo ?? null,
          estado: pad.estado ?? null,
          motivo: pad.motivo ?? null,
        }
      : { consultado: false },
  });
}
