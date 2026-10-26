/**
 * POST /api/completar — segundo paso: ya confirmó el correo, se guarda.
 *
 * Llega con la sesión que Supabase creó al abrir el enlace del correo. El
 * cliente de aquí hereda esa sesión, así que las políticas de la base siguen
 * mandando: aunque este código tuviera un error, no podría escribir en la
 * fila de otra persona.
 *
 * Es idempotente: si ya estaba inscrita, devuelve su ficha en vez de romper.
 */

import { conToken, tokenDe } from "@/lib/supabase";
import { metadatosValidos, type Inscripcion } from "@/lib/inscripcion";
import { abrirBoleto } from "@/lib/boleto";
import { json } from "@/lib/limite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = tokenDe(req);
  if (!token) return json({ ok: false, motivo: "Falta la sesión. Vuelve a abrir el enlace del correo." }, 401);

  const sb = conToken(token);

  // El token va explícito a propósito. getUser() sin argumento espera a
  // initializePromise y pide un cerrojo pensado para el navegador; en el
  // servidor, sin almacenamiento de sesión, ese camino se queda colgado y la
  // página se quedaba en «Un segundo» para siempre.
  const { data: sesion, error: errSesion } = await sb.auth.getUser(token);
  if (errSesion || !sesion?.user) {
    return json({ ok: false, motivo: "Tu enlace venció. Pide uno nuevo desde la página de inscripción." }, 401);
  }
  const usuario = sesion.user;

  if (!usuario.email_confirmed_at) {
    return json({ ok: false, motivo: "Todavía no confirmaste tu correo." }, 403);
  }

  // ¿Ya estaba? Entonces no hay nada que crear.
  const { data: yaEsta } = await sb
    .from("hackers")
    .select("id, name, email, phone, career, study_year, track, level, institution_id, discord_id")
    .eq("auth_user_id", usuario.id)
    .maybeSingle();

  if (yaEsta) return json({ ok: true, nuevo: false, hacker: yaEsta });

  // Primero el boleto que firmamos al enviar el formulario; si no llegó (abrió
  // el correo en otro aparato), los metadatos del usuario. El boleto manda
  // porque los metadatos solo se escriben al crear el usuario y pueden estar
  // viejos: quien se reinscribió con otro track tiene ahí el track anterior.
  let cuerpo;
  try { cuerpo = await req.json(); } catch { cuerpo = {}; }

  const firmado = abrirBoleto<Inscripcion>(cuerpo?.boleto);
  const meta = firmado.ok ? firmado.datos : usuario.user_metadata;

  if (!metadatosValidos(meta)) {
    return json({
      ok: false,
      motivo: "No encontramos los datos de tu inscripción. Vuelve a llenar el formulario.",
    }, 422);
  }

  // El correo confirmado es la única fuente fiable. Vale tanto para el boleto
  // (uno ajeno no sirve en esta sesión) como para los metadatos.
  if (meta.email.toLowerCase() !== (usuario.email ?? "").toLowerCase()) {
    return json({ ok: false, motivo: "Los datos no coinciden con el correo que confirmaste." }, 422);
  }

  // Los nulos se quitan en vez de mandarse: así la columna aplica su valor
  // por defecto si lo tiene. Mandar «level: null» cuando nadie eligió nivel
  // convierte un campo opcional del formulario en un rechazo de la base.
  const fila: Record<string, unknown> = { auth_user_id: usuario.id };
  for (const [clave, valor] of Object.entries(meta)) {
    if (valor !== null && valor !== undefined) fila[clave] = valor;
  }

  // Guardar y leer van separados a propósito.
  //
  // Encadenar .select().single() al insert hace que PostgREST devuelva la
  // fila recién creada, y esa lectura vuelve a pasar por la política de
  // SELECT. Si devolviera cero filas, .single() lanza PGRST116 y el guardado
  // —que sí ocurrió— se reporta como fallo. La persona ve «no pudimos
  // guardar» mientras su inscripción está en la tabla: el peor de los
  // mundos, porque al reintentar choca con el índice único.
  const { error } = await sb.from("hackers").insert(fila);

  if (error) {
    // 23505 = índice único. O ya se inscribió con otro correo, o el DNI ya está.
    if (error.code === "23505") {
      const porDni = /dni_hash/.test(error.message);
      return json({
        ok: false,
        yaInscrito: true,
        motivo: porDni
          ? "Ese DNI ya está inscrito. Si fuiste tú, entra con el correo que usaste la primera vez."
          : "Ese correo ya está inscrito. Entra con él para ver tu ficha.",
      }, 409);
    }
    // 23514 = el constraint del correo institucional o el del track.
    if (error.code === "23514") {
      return json({ ok: false, motivo: error.message }, 422);
    }
    // El motivo es para la persona; el detalle es para quien tenga que
    // arreglarlo. Sin esto, un fallo de la base llega como «inténtalo de
    // nuevo» y no hay forma de saber qué pasó: en el plan gratuito de Vercel
    // los logs de ejecución no se guardan. No es información sensible: es
    // nuestro propio esquema, y para llegar aquí hace falta sesión válida.
    console.error("[completar] no se pudo guardar:", error);
    return json({
      ok: false,
      reintentable: true,
      motivo: "No pudimos guardar tu inscripción. Inténtalo de nuevo.",
      detalle: { codigo: error.code, mensaje: error.message, pista: error.hint, donde: error.details },
    }, 500);
  }

  // Ya está guardada. Leerla de vuelta es un lujo: si la lectura fallara, la
  // inscripción sigue siendo válida y no hay nada que avisar. Se devuelve lo
  // que acabamos de escribir.
  const { data: creado } = await sb
    .from("hackers")
    .select("id, name, email, phone, career, study_year, track, level, institution_id, discord_id")
    .eq("auth_user_id", usuario.id)
    .maybeSingle();

  return json({ ok: true, nuevo: true, hacker: creado ?? { ...fila, id: null } });
}
