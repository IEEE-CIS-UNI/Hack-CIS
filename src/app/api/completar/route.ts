/**
 * POST /api/completar — segundo paso: ya confirmó el correo, se guarda.
 *
 * Llega con la sesión que Supabase creó al abrir el enlace del correo. El
 * cliente de aquí hereda esa sesión, así que las reglas de la base siguen
 * mandando: aunque este código tuviera un error, no podría escribir en la
 * ficha de otra persona ni pasar de los 250 cupos de la hackathon.
 *
 * Hace tres cosas, en este orden:
 *   1. crea la ficha (`register_person`), si no existía;
 *   2. la inscribe en lo que pidió: la hack y/o las sesiones del bootcamp;
 *   3. devuelve su estado completo para pintar la credencial.
 *
 * Es idempotente: si ya estaba inscrita, devuelve su estado en vez de romper.
 */

import { conToken, tokenDe } from "@/lib/supabase";
import { incluyeHack, metadatosValidos, type Inscripcion } from "@/lib/inscripcion";
import { traducirError } from "@/lib/errores";
import { abrirBoleto } from "@/lib/boleto";
import { json } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = tokenDe(req);
  if (!token) return json({ ok: false, motivo: "Falta la sesión. Vuelve a abrir el enlace del correo." }, 401);

  const sb = conToken(token);

  // El token va explícito a propósito. getUser() sin argumento espera a
  // initializePromise y pide un cerrojo pensado para el navegador; en el
  // servidor, sin almacenamiento de sesión, ese camino se queda colgado.
  const { data: sesion, error: errSesion } = await sb.auth.getUser(token);
  if (errSesion || !sesion?.user) {
    return json({ ok: false, motivo: "Tu enlace venció. Pide uno nuevo desde la página de inscripción." }, 401);
  }
  const usuario = sesion.user;

  if (!usuario.email_confirmed_at) {
    return json({ ok: false, motivo: "Todavía no confirmaste tu correo." }, 403);
  }

  // Primero el boleto que firmamos al enviar el formulario; si no llegó (abrió
  // el correo en otro aparato), los metadatos del usuario. El boleto manda
  // porque los metadatos solo se escriben al crear el usuario y pueden estar
  // viejos: quien se reinscribió con otro plan tiene ahí el plan anterior.
  let cuerpo;
  try { cuerpo = await req.json(); } catch { cuerpo = {}; }

  const firmado = abrirBoleto<Inscripcion>(cuerpo?.boleto);
  const meta = firmado.ok ? firmado.datos : usuario.user_metadata;
  const hayDatos = metadatosValidos(meta);

  // El correo confirmado es la única fuente fiable.
  if (hayDatos && meta.email.toLowerCase() !== (usuario.email ?? "").toLowerCase()) {
    return json({ ok: false, motivo: "Los datos no coinciden con el correo que confirmaste." }, 422);
  }

  const avisos: { hackLleno?: boolean; sinVerificar?: boolean; sesiones?: string[] } = {};

  if (hayDatos) {
    const { error } = await sb.rpc("register_person", {
      p: {
        name: meta.name, display_name: meta.display_name, phone: meta.phone, dni_hash: meta.dni_hash,
        career: meta.career, study_year: meta.study_year, level: meta.level, affiliation: meta.affiliation,
      },
    });
    if (error) {
      const t = traducirError(error.message, error.code);
      if (t.estado >= 500) console.error("[completar] register_person:", error);
      return json({ ok: false, motivo: t.motivo, yaInscrito: error.code === "23505" }, t.estado === 500 ? 500 : 409);
    }

    if (incluyeHack(meta.plan)) {
      const { error: e } = await sb.rpc("enroll_in", { p_slug: "hack" });
      if (e) {
        const t = traducirError(e.message, e.code);
        if (/cupo_lleno/.test(e.message)) avisos.hackLleno = true;
        else if (/requiere_verificacion/.test(e.message)) avisos.sinVerificar = true;
        else { console.error("[completar] enroll_in hack:", e); return json({ ok: false, motivo: t.motivo }, t.estado); }
      }
    }

    // Las sesiones una por una: si una falla no tumba a las demás.
    const fallidas: string[] = [];
    for (const slug of meta.sesiones) {
      const { error: e } = await sb.rpc("enroll_in", { p_slug: slug });
      if (e) fallidas.push(slug);
    }
    if (fallidas.length) avisos.sesiones = fallidas;
  }

  const { data: resumen, error: errResumen } = await sb.rpc("my_overview");
  if (errResumen || !resumen?.person) {
    return json({
      ok: false,
      motivo: hayDatos
        ? "No pudimos guardar tu inscripción. Inténtalo de nuevo."
        : "No encontramos los datos de tu inscripción. Vuelve a llenar el formulario.",
      reintentable: hayDatos,
    }, hayDatos ? 500 : 422);
  }

  return json({ ok: true, resumen, avisos });
}
