/**
 * Clientes de Supabase.
 *
 * Hay dos, y la diferencia importa:
 *
 *   navegador()  — guarda la sesión en el navegador y la restaura sola. Es el
 *                  que sabe leer el enlace del correo de confirmación.
 *   conToken(t)  — para las rutas de API. Actúa COMO la persona que mandó la
 *                  petición, así que las políticas de la base siguen vigentes:
 *                  aunque el servidor se equivoque, no puede tocar la fila de
 *                  otro. Por eso aquí no hay service_role.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigurado = Boolean(URL && ANON);

/** Falla temprano y con un mensaje que se entiende, no con «fetch failed». */
function exigirConfig() {
  if (!supabaseConfigurado) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.",
    );
  }
}

let cliente: SupabaseClient | null = null;

/** Singleton: dos clientes en la misma pestaña se pisan la sesión. */
export function navegador() {
  exigirConfig();
  cliente ??= createClient(URL, ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,   // lee el #access_token del correo
      // Implícito a propósito, no PKCE: el correo de inscripción lo pide el
      // servidor y lo abre el navegador. PKCE guarda un verificador en quien
      // inició la petición, y ese cliente de servidor ya no existe cuando la
      // persona hace clic: el canje fallaría siempre.
      flowType: "implicit",
      // Solo en desarrollo. Cuando la librería no logra abrir la sesión desde
      // el enlace del correo, el motivo únicamente sale por este canal: lo
      // registra con _debug y, apagado, devuelve una sesión nula sin decir
      // por qué. Es la diferencia entre «no funciona» y saber qué arreglar.
      debug: typeof window !== "undefined" && window.location.hostname === "localhost",
    },
  });
  return cliente;
}

/** Cliente de servidor que hereda la sesión de quien llama. */
export function conToken(token: string) {
  exigirConfig();
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** El token que viaja en «Authorization: Bearer ...». */
export function tokenDe(req: Request) {
  const cabecera = req.headers.get("authorization") ?? "";
  const [tipo, valor] = cabecera.split(" ");
  return tipo?.toLowerCase() === "bearer" && valor ? valor : null;
}

/** La URL pública del sitio, para que el correo sepa a dónde volver. */
export function urlDelSitio() {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicita) return explicita.replace(/\/$/, "");
  // Vercel la inyecta sola en cada despliegue, incluidas las vistas previas.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
