/**
 * POST /api/inscripcion — primer paso: validar y mandar el correo.
 *
 * Aquí NO se guarda nada todavía. Se valida todo, se crea el usuario en
 * Supabase Auth con los datos colgados de él, y Supabase manda el correo de
 * confirmación. La ficha en «people» y las inscripciones nacen recién cuando
 * la persona hace clic en ese correo (/api/completar).
 *
 * Ese orden es el que convierte el correo institucional en una prueba: hasta
 * que no entra a su bandeja, no existe inscripción.
 */

import { createClient } from "@supabase/supabase-js";
import { validarInscripcion } from "@/lib/inscripcion";
import { emitirBoleto } from "@/lib/boleto";
import { SUPABASE_CLAVE, SUPABASE_URL, urlDelSitio } from "@/lib/supabase";
import { dentroDelLimite, ipDe, json, leerCuerpo, RespuestaMala } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const lim = dentroDelLimite(ipDe(req), "inscripcion", 10);
  if (!lim.ok) {
    return json({ ok: false, reintentable: true, motivo: "Vamos muy rápido. Espera un minuto y reintenta." }, 429);
  }

  let cuerpo;
  try { cuerpo = await leerCuerpo(req); }
  catch (e) { return json({ ok: false, motivo: (e as RespuestaMala).message }, 400); }

  const r = await validarInscripcion(cuerpo);
  if (!r.ok) {
    // 502 cuando el que falló fue un proveedor nuestro, 422 cuando el dato
    // está mal: la interfaz necesita distinguirlos para no culpar a nadie.
    return json({ ok: false, campo: r.campo, motivo: r.motivo, reintentable: r.reintentable ?? false },
      r.reintentable ? 502 : 422);
  }

  if (!SUPABASE_URL || !SUPABASE_CLAVE) {
    return json({ ok: false, reintentable: true, motivo: "La base de datos no está configurada." }, 500);
  }

  // Implícito: ver la nota en lib/supabase.ts. Con PKCE el enlace del correo
  // volvería con un código que el navegador no sabría canjear.
  const sb = createClient(SUPABASE_URL, SUPABASE_CLAVE, { auth: { persistSession: false, flowType: "implicit" } });

  const { error } = await sb.auth.signInWithOtp({
    email: r.datos.email,
    options: {
      data: r.datos,                                   // viaja con el usuario
      emailRedirectTo: `${urlDelSitio()}/bienvenida`,
    },
  });

  if (error) {
    // Supabase limita los correos por dirección: decirlo claro evita que la
    // persona reintente diez veces creyendo que no funcionó.
    const saturado = /rate|seconds|limit/i.test(error.message);
    return json({
      ok: false,
      reintentable: true,
      motivo: saturado
        ? "Ya te mandamos un correo hace un momento. Revisa tu bandeja (y el spam) antes de pedir otro."
        : "No pudimos enviarte el correo de confirmación. Inténtalo de nuevo en un minuto.",
    }, saturado ? 429 : 502);
  }

  return json({
    ok: true,
    correo: r.datos.email,
    nombre: r.nombreDni,
    // Los metadatos del usuario solo se escriben al crearlo: quien se
    // reinscribe con otro track guardaría el viejo. El boleto lleva lo que
    // acabamos de validar, firmado, y manda sobre los metadatos.
    boleto: emitirBoleto(r.datos),
    mensaje: "Te mandamos un correo para confirmar tu inscripción.",
  });
}
