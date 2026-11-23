/**
 * POST /api/sumarse — quien ya está dentro (por ejemplo, solo en el bootcamp)
 * completa DNI, carrera y ciclo, y queda inscrito en la hackathon.
 *
 * Solo funciona si la cuenta tiene correo institucional: la función de la base
 * (`join_hack`) lo exige. Todo ocurre en un solo paso: si algo falla, no se
 * guarda nada.
 */

import { conToken, tokenDe } from "@/lib/supabase";
import { traducirError } from "@/lib/errores";
import { carrerasDelCatalogo, NIVELES } from "@/lib/inscripcion";
import { SLUG_OTRA, limpiarCarrera } from "@/lib/carreras";
import { hashDni, validarDni } from "@/lib/validacion";
import { normalizarTelefono } from "@/lib/telefono";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

const texto = (v: unknown) => String(v ?? "").trim();

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "sumarse", 20);
  if (!lim.ok) return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera un minuto." }, 429);

  const token = tokenDe(req);
  if (!token) return json({ ok: false, motivo: "Necesitas iniciar sesión." }, 401);

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const dni = validarDni(cuerpo.dni);
  if (!dni.ok) return json({ ok: false, campo: "dni", motivo: dni.motivo }, 422);

  const catalogo = await carrerasDelCatalogo();
  const carrera = catalogo.find((c) => c.id === Number(cuerpo.carrera_id));
  if (!carrera) return json({ ok: false, campo: "carrera", motivo: "Elige tu carrera de la lista." }, 422);
  let carreraOtra: string | null = null;
  if (carrera.slug === SLUG_OTRA) {
    carreraOtra = limpiarCarrera(cuerpo.carrera_otra);
    if (!carreraOtra) return json({ ok: false, campo: "carrera", motivo: "Escribe cuál es tu carrera (solo letras, de 3 a 60)." }, 422);
  }

  const ciclo = Number(cuerpo.ciclo);
  if (!Number.isInteger(ciclo) || ciclo < 1 || ciclo > 10) {
    return json({ ok: false, campo: "ciclo", motivo: "Elige en qué ciclo estás, del 1 al 10." }, 422);
  }

  const nivelCrudo = texto(cuerpo.nivel);
  const nivel = (NIVELES as readonly string[]).includes(nivelCrudo) ? nivelCrudo : "";

  // El celular solo se pide si la cuenta no lo tiene; la base avisa si hace falta.
  let phone = "";
  if (texto(cuerpo.telefono)) {
    const tel = normalizarTelefono(texto(cuerpo.telefono), texto(cuerpo.pais) || "PE");
    if (!tel.ok) return json({ ok: false, campo: "telefono", motivo: tel.motivo }, 422);
    phone = tel.e164;
  }

  const sb = conToken(token);
  const { error } = await sb.rpc("join_hack", {
    p_dni_hash: hashDni(dni.dni),
    p_phone: phone,
    p_career: carrera.id,
    p_career_other: carreraOtra,
    p_cycle: ciclo,
    p_level: nivel,
  });
  if (error) {
    const t = traducirError(error.message, error.code);
    if (t.estado >= 500) console.error("[sumarse]", error);
    return json({ ok: false, motivo: t.motivo }, t.estado);
  }

  const { data: resumen } = await sb.rpc("my_overview");
  return json({ ok: true, resumen });
}
