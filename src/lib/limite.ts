/**
 * Límite de peticiones por IP.
 *
 * Sin esto, /api/validar-dni es un consultor de DNIs gratis para todo
 * internet, pagado con nuestros créditos.
 *
 * Es una cubeta en memoria: suficiente para un servidor único. Si el sitio
 * termina en varias instancias (Vercel sin instancia fija), hay que mover
 * esto a Redis o a la base; mientras tanto limita por instancia, que ya
 * frena el abuso obvio.
 */

import "server-only";

type Cubeta = { n: number; desde: number };
const cubetas = new Map<string, Cubeta>();

const VENTANA = 60_000;

export function ipDe(req: Request) {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? h.get("x-real-ip") ?? "desconocida").trim();
}

export function dentroDelLimite(ip: string, ruta: string, cupo: number) {
  const ahora = Date.now();
  const clave = `${ip}|${ruta}`;
  const b = cubetas.get(clave) ?? { n: 0, desde: ahora };
  if (ahora - b.desde > VENTANA) { b.n = 0; b.desde = ahora; }
  b.n++;
  cubetas.set(clave, b);

  // Limpieza perezosa: sin temporizadores que mantengan vivo el proceso.
  if (cubetas.size > 5000) {
    for (const [k, v] of cubetas) if (ahora - v.desde > VENTANA * 2) cubetas.delete(k);
  }

  return { ok: b.n <= cupo, restantes: Math.max(0, cupo - b.n) };
}

/** Respuesta JSON uniforme, siempre sin caché. */
export function json(cuerpo: unknown, estado = 200, cabeceras: Record<string, string> = {}) {
  return Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store", ...cabeceras } });
}

export async function leerCuerpo(req: Request): Promise<Record<string, unknown>> {
  try {
    const t = await req.text();
    if (t.length > 4096) throw new Error("grande");
    return t ? JSON.parse(t) : {};
  } catch {
    throw new RespuestaMala("No entendimos la petición.");
  }
}

export class RespuestaMala extends Error {}
