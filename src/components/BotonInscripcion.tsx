"use client";

/**
 * El botón de inscribirse a una sesión del bootcamp (/bootcamp/01…).
 *
 * Cambia según quién lo mira, que es lo que evita que cada persona tenga que
 * pensar qué le falta:
 *
 *   sin cuenta                 -> lleva al formulario con esa sesión ya marcada
 *   con cuenta, sin la sesión  -> un clic y queda inscrita (aunque solo esté en la hack)
 *   con cuenta, ya inscrita    -> «ya estás inscrito»
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { api, estaEn, type Resumen } from "@/lib/resumen";

type Estado =
  | { f: "cargando" }
  | { f: "sinCuenta" }
  | { f: "puede"; token: string; hackDentro: boolean }
  | { f: "enviando"; token: string; hackDentro: boolean }
  | { f: "dentro" }
  | { f: "error"; motivo: string; token: string; hackDentro: boolean };

export default function BotonInscripcion({ slug, n }: { slug: string; n: string }) {
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
        setEstado(estaEn(r, slug) ? { f: "dentro" } : { f: "puede", token, hackDentro: estaEn(r, "hack") });
      } catch {
        if (vivo) setEstado({ f: "sinCuenta" });
      }
    })();
    return () => { vivo = false; };
  }, [slug]);

  async function inscribir(token: string, hackDentro: boolean) {
    setEstado({ f: "enviando", token, hackDentro });
    const { datos } = await api("/api/matricular", { metodo: "POST", token, cuerpo: { slug } });
    if (datos.ok) setEstado({ f: "dentro" });
    else setEstado({ f: "error", motivo: datos.motivo ?? "No pudimos inscribirte.", token, hackDentro });
  }

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
          <Link href={`/registro?plan=bootcamp&sesion=${n}`} className="more solid">
            Inscribirme a esta sesión <ArrowRight aria-hidden size={14} />
          </Link>
        </div>
        <p className="rg-small">
          Es gratis y abierto a todos. ¿Ya tienes cuenta? <Link href="/mi-inscripcion">entra aquí</Link>
        </p>
        <p className="rg-small" style={{ marginTop: 10 }}>
          ¿Quieres también la hackathon? <Link href={`/registro?plan=hack_bootcamp&sesion=${n}`}>inscríbete a las dos</Link>
        </p>
      </div>
    );
  }

  const ocupado = estado.f === "enviando";
  return (
    <div>
      <div className="rg-actions" style={{ marginTop: 0 }}>
        <button className="more solid" disabled={ocupado} onClick={() => inscribir(estado.token, estado.hackDentro)}>
          {ocupado && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Inscribirme a esta sesión <ArrowRight aria-hidden size={14} />
        </button>
      </div>
      {estado.f === "error" && <p className="rg-msg err" style={{ marginTop: 12 }}>{estado.motivo}</p>}
      <p className="rg-small">
        {estado.hackDentro ? "Ya estás en la hackathon: con un clic sumas esta sesión." : "Es gratis. Con tu cuenta no tienes que llenar nada."}
      </p>
    </div>
  );
}
