"use client";

/**
 * «Únete a la reunión»: la tarjeta con el enlace de Zoom de cada sesión del bootcamp.
 *
 * El enlace no está en el código: sale de la base con enlace_sesion(), que solo lo entrega a quien tiene sesión
 * iniciada e inscrita a esa sesión. Según quién mira:
 *   sin sesión     -> invita a inscribirse o a entrar a su panel
 *   sin la sesión  -> le dice que se inscriba con el botón de arriba
 *   inscrita       -> el botón «Unirme en Zoom» con el ID de la reunión
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Video } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { api } from "@/lib/resumen";

type Enlace = { url: string; id: string; inicio: string | null; fin: string | null };
export type EstadoZoom =
  | { f: "cargando" }
  | { f: "sinSesion" }
  | { f: "noInscrito" }
  | { f: "sinEnlace" }
  | ({ f: "ok" } & Enlace);

/** La tarjeta en sí, sin consultas: así se puede ver y probar cada estado. */
export function TarjetaZoom({ estado, n, fecha, horario, ahora, inscribir, inscribiendo, error }: { estado: EstadoZoom; n: string; fecha: string; horario: string; ahora: number | null; inscribir?: () => void; inscribiendo?: boolean; error?: string | null }) {
  const enVivo =
    estado.f === "ok" && ahora != null && estado.inicio && estado.fin
      ? ahora >= new Date(estado.inicio).getTime() - 15 * 60_000 && ahora <= new Date(estado.fin).getTime()
      : false;
  const termino = estado.f === "ok" && ahora != null && estado.fin ? ahora > new Date(estado.fin).getTime() : false;

  return (
    <section className="sd-zoom" aria-labelledby="sd-zm">
      <div className="sd-zoom-txt">
        <span className="hud">{enVivo ? "En vivo ahora" : "Únete a la reunión"}</span>
        <h2 id="sd-zm">Entra por Zoom</h2>
        <p className="sd-zoom-cuando">
          <span><CalendarDays aria-hidden size={16} /> {fecha}</span>
          <span><Clock aria-hidden size={16} /> {horario} (hora de Lima)</span>
        </p>
      </div>

      <div className="sd-zoom-acc">
        {estado.f === "cargando" && <span className="more" aria-busy="true">Un segundo…</span>}

        {estado.f === "ok" && !termino && (
          <>
            <a href={estado.url} target="_blank" rel="noopener noreferrer" className={`more solid${enVivo ? " vivo" : ""}`}>
              <Video aria-hidden size={16} /> Unirme en Zoom <ArrowRight aria-hidden size={14} />
            </a>
            <small>ID de reunión: {estado.id}</small>
          </>
        )}
        {estado.f === "ok" && termino && <small>La sesión ya terminó. Pronto publicamos la grabación aquí abajo.</small>}

        {estado.f === "sinSesion" && (
          <>
            <Link href={`/registro?plan=bootcamp&sesion=${n}`} className="more solid">
              Inscribirme a esta sesión <ArrowRight aria-hidden size={14} />
            </Link>
            <small>
              ¿Ya te inscribiste? <Link href="/mi-inscripcion">Entra a tu panel</Link> y aquí aparece tu enlace.
            </small>
          </>
        )}
        {estado.f === "noInscrito" && (
          <>
            <button type="button" className="more solid" onClick={inscribir} disabled={inscribiendo}>
              {inscribiendo ? "Inscribiéndote…" : "Inscribirme y ver el enlace"} <ArrowRight aria-hidden size={14} />
            </button>
            <small>Un clic: te inscribes a esta sesión del bootcamp (gratis) y aquí aparece tu enlace de Zoom.</small>
            {error && <small role="alert" style={{ color: "#ff9bd2" }}>{error}</small>}
          </>
        )}
        {estado.f === "sinEnlace" && <small>El enlace de esta sesión se publica aquí pronto.</small>}
      </div>
    </section>
  );
}

export default function UnirseZoom({ slug, n, fecha, horario }: { slug: string; n: string; fecha: string; horario: string }) {
  const [estado, setEstado] = useState<EstadoZoom>({ f: "cargando" });
  const [ahora, setAhora] = useState<number | null>(null); // se fija al montar: servidor y navegador no escriben distinto
  const [inscribiendo, setInscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Pregunta a la base por el enlace de esta sesión y pone el estado que corresponde. */
  async function leer(vivo: () => boolean) {
    try {
      const sb = navegador();
      const { data } = await sb.auth.getSession();
      if (vivo()) setAhora(Date.now());
      if (!data.session) { if (vivo()) setEstado({ f: "sinSesion" }); return; }
      const { data: r, error: err } = await sb.rpc("enlace_sesion", { p_slug: slug });
      if (!vivo()) return;
      if (err || !r) { setEstado({ f: "sinEnlace" }); return; }
      if (r.estado === "ok") setEstado({ f: "ok", url: r.url, id: r.id, inicio: r.inicio, fin: r.fin });
      else if (r.estado === "no_inscrito") setEstado({ f: "noInscrito" });
      else if (r.estado === "sin_sesion") setEstado({ f: "sinSesion" });
      else setEstado({ f: "sinEnlace" });
    } catch {
      if (vivo()) setEstado({ f: "sinSesion" });
    }
  }

  useEffect(() => {
    let vivo = true;
    // Consulta al abrir la página; los estados se fijan cuando responde la base, no de forma síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    leer(() => vivo);
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /** Quien tiene cuenta y no está en la sesión se inscribe con un clic (el bootcamp es gratis y abierto) y ve su enlace. */
  async function inscribir() {
    setInscribiendo(true);
    setError(null);
    try {
      const { data } = await navegador().auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setEstado({ f: "sinSesion" }); return; }
      const { datos } = await api("/api/matricular", { metodo: "POST", token, cuerpo: { slug } });
      if (!datos.ok) { setError(datos.motivo ?? "No pudimos inscribirte. Inténtalo de nuevo."); return; }
      await leer(() => true);
    } catch {
      setError("No pudimos inscribirte. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setInscribiendo(false);
    }
  }

  return <TarjetaZoom estado={estado} n={n} fecha={fecha} horario={horario} ahora={ahora} inscribir={inscribir} inscribiendo={inscribiendo} error={error} />;
}
