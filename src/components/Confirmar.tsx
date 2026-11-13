"use client";

/**
 * El enlace del correo, con nuestro propio dominio.
 *
 * El correo ya no lleva la dirección larga de Supabase: lleva
 * hackcis.lat/auth/confirmar?token_hash=…&type=…&siguiente=/bienvenida. Esta
 * página canjea ese token por una sesión y sigue a `siguiente`.
 *
 * Hacerlo aquí, en el navegador, tiene una ventaja: el token solo se gasta
 * cuando alguien realmente abre la página. Los antivirus y las vistas previas
 * de algunos correos «hacen clic» en los enlaces para revisarlos, pero no
 * ejecutan JavaScript, así que no consumen el enlace antes que la persona.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";

type TipoOtp = "signup" | "magiclink" | "email";

/** Solo rutas internas: nunca se redirige a otro sitio. */
const rutaSegura = (r: string | null) => (r && /^\/[A-Za-z0-9\-_/]*$/.test(r) && !r.startsWith("//") ? r : "/bienvenida");

export default function Confirmar() {
  const [error, setError] = useState<string | null>(null);
  const yaCorrio = useRef(false);

  useEffect(() => {
    if (yaCorrio.current) return;
    yaCorrio.current = true;

    (async () => {
      const q = new URLSearchParams(window.location.search);
      const tokenHash = q.get("token_hash");
      const tipo = (q.get("type") ?? "email") as TipoOtp;
      const siguiente = rutaSegura(q.get("siguiente"));

      if (!tokenHash) {
        setError("Este enlace está incompleto. Pide uno nuevo desde la página de inscripción.");
        return;
      }

      try {
        const sb = navegador();
        // Según cómo se creó el usuario, Supabase llama «signup», «magiclink» o
        // «email» al mismo tipo de enlace. Se prueba el que vino primero y, si
        // no, los demás: un intento fallido no gasta el token.
        const intentos = [...new Set<TipoOtp>([tipo, "email", "magiclink", "signup"])];
        for (const type of intentos) {
          const { data, error: e } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
          if (!e && data.session) {
            window.location.replace(siguiente);
            return;
          }
        }
        setError("Este enlace ya se usó o venció. Vuelve a inscribirte y te mandamos uno nuevo.");
      } catch {
        setError("No pudimos abrir tu sesión. Revisa tu conexión e inténtalo de nuevo.");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">No pudimos</p>
        <h1 className="rg-q">Algo no<br /><span style={{ color: "#ff7ae6" }}>cuadra</span></h1>
        <p className="rg-help">{error}</p>
        <div className="rg-actions">
          <Link href="/registro" className="more solid">Volver al formulario</Link>
          <Link href="/mi-inscripcion" className="more">Entrar a mi panel</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rg animate-pop-in">
      <p className="rg-step">Confirmando</p>
      <h1 className="rg-q">Un<br /><span>segundo</span></h1>
      <p className="rg-help" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Loader2 className="size-6 animate-spin text-lavender" aria-hidden /> abriendo tu sesión…
      </p>
    </div>
  );
}
