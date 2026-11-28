"use client";

/**
 * El botón de inscribirse a una sesión del bootcamp (/bootcamp/01…).
 *
 * Las inscripciones ya cerraron: dice si ya estabas en la sesión y lleva a iniciar sesión o al panel.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { api, estaEn, type Resumen } from "@/lib/resumen";

type Estado =
  | { f: "cargando" }
  | { f: "sinCuenta" }
  | { f: "fuera" }
  | { f: "dentro" };

export default function BotonInscripcion({ slug }: { slug: string }) {
  const [estado, setEstado] = useState<Estado>({ f: "cargando" });

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data } = await navegador().auth.getSession();
        const token = data.session?.access_token;
        if (!token) { if (vivo) setEstado({ f: "sinCuenta" }); return; }

        const { datos } = await api("/api/perfil", { token });
        if (!vivo) return;
        const r = datos.resumen as Resumen | undefined;
        if (!datos.ok || !r) { setEstado({ f: "sinCuenta" }); return; }   // cuenta sin ficha: que complete el formulario
        setEstado(estaEn(r, slug) ? { f: "dentro" } : { f: "fuera" });
      } catch {
        if (vivo) setEstado({ f: "sinCuenta" });
      }
    })();
    return () => { vivo = false; };
  }, [slug]);

  if (estado.f === "cargando") {
    return <div className="rg-actions"><span className="more" aria-busy="true"><Loader2 className="size-4 animate-spin" aria-hidden /> Un segundo…</span></div>;
  }

  if (estado.f === "dentro") {
    return (
      <div>
        <p className="rg-msg ok" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "1.1rem" }}>
          <Check className="size-5" aria-hidden /> Ya estás inscrito a esta sesión.
        </p>
        <div className="rg-actions" style={{ marginTop: 18 }}>
          <Link href="/mi-inscripcion" className="more">Ir a mi panel <ArrowRight aria-hidden size={14} /></Link>
        </div>
      </div>
    );
  }

  if (estado.f === "sinCuenta") {
    return (
      <div>
        <div className="rg-actions" style={{ marginTop: 0 }}>
          <Link href="/mi-inscripcion" className="more solid">
            Iniciar sesión <ArrowRight aria-hidden size={14} />
          </Link>
        </div>
        <p className="rg-small">Las inscripciones ya cerraron.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="rg-small">Las inscripciones ya cerraron.</p>
      <div className="rg-actions"><Link href="/mi-inscripcion" className="more">Ir a mi panel <ArrowRight aria-hidden size={14} /></Link></div>
    </div>
  );
}
