"use client";

/**
 * «Confirma que participarás en la hackathon».
 *
 * Aparece en la card privada (/card/<token>, que no necesita iniciar sesión y por eso sirve
 * también a quienes no pueden entrar con enlaces de correo) y en el panel. Tres respuestas:
 *   pendiente    todavía no respondió,
 *   confirmado   «Confirmo que participaré»,
 *   no_participa «No podré participar» (libera su lugar para la lista de espera).
 * Quien ya canjeó su código de Discord cuenta como confirmado aunque no haya pulsado nada.
 */

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";

export type Asistencia = {
  hay_hack: boolean;
  estado?: "pendiente" | "confirmado" | "no_participa";
  canjeo_discord?: boolean;
  efectivo?: boolean;
  numero?: number | null;
  limite?: string;
};

type Modo = { tipo: "token"; token: string } | { tipo: "panel" };

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «miércoles 25 de noviembre, 3:00 p. m.» en hora de Lima. Se arma a mano para que servidor y navegador escriban lo mismo. */
const fechaLimite = (iso?: string) => {
  const l = new Date(new Date(iso ?? "2026-11-25T20:00:00Z").getTime() - 5 * 3600_000);   // Lima = UTC-5, sin horario de verano
  const h = l.getUTCHours();
  return `${DIAS[l.getUTCDay()]} ${l.getUTCDate()} de ${MESES[l.getUTCMonth()]}, ${h % 12 || 12}:${String(l.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
};

async function llamar(modo: Modo, accion: string | null): Promise<Asistencia | null> {
  const sb = navegador();
  const { data, error } = modo.tipo === "token"
    ? await sb.rpc("asistencia_por_token", { p_token: modo.token, p_accion: accion })
    : await sb.rpc("mi_asistencia", { p_accion: accion });
  if (error) throw new Error(error.message);
  return (data as Asistencia | null) ?? null;
}

export default function ConfirmarAsistencia({ modo, inicial }: { modo: Modo; inicial?: Asistencia | null }) {
  const [a, setA] = useState<Asistencia | null>(inicial ?? null);
  const [cargando, setCargando] = useState(inicial === undefined);
  const [enviando, setEnviando] = useState<null | "confirmo" | "no_participo">(null);
  const [error, setError] = useState<string | null>(null);
  const [ahora] = useState(() => Date.now());   // se fija al abrir la página: «vencido» no cambia mientras se lee

  // En el panel el estado se pide al abrirlo (en la card ya viene del servidor).
  useEffect(() => {
    if (inicial !== undefined) return;
    let vivo = true;
    llamar(modo, null).then((r) => { if (vivo) { setA(r); setCargando(false); } }).catch(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando || !a?.hay_hack) return null;

  async function responder(accion: "confirmo" | "no_participo") {
    setEnviando(accion);
    setError(null);
    try { setA(await llamar(modo, accion)); }
    catch { setError("No pudimos guardar tu respuesta. Inténtalo de nuevo en un momento."); }
    finally { setEnviando(null); }
  }

  const vencido = a.limite ? ahora > new Date(a.limite).getTime() : false;
  const limite = fechaLimite(a.limite);

  return (
    <div className="box" style={{ marginBottom: 18, borderColor: a.estado === "no_participa" ? "rgba(255,255,255,.2)" : "rgba(77,227,255,.45)" }}>
      <p className="box-h" style={{ color: "var(--cyan)" }}>Tu lugar en la hackathon</p>

      {a.estado === "confirmado" && (
        <>
          <p className="pill-ok" style={{ display: "inline-flex" }}><Check size={12} aria-hidden /> Asistencia confirmada</p>
          <p className="rg-help" style={{ marginTop: 12 }}>
            ¡Gracias! Contamos contigo. Si algo cambia y ya no puedes participar, avísanos para darle tu lugar a otra persona.
          </p>
          <div className="rg-actions" style={{ marginTop: 14 }}>
            <button className="more" disabled={!!enviando} onClick={() => responder("no_participo")}>
              {enviando === "no_participo" && <Loader2 className="size-4 animate-spin" aria-hidden />} Ya no podré participar
            </button>
          </div>
        </>
      )}

      {a.estado === "no_participa" && (
        <>
          <p className="rg-help" style={{ marginTop: 0 }}>
            Liberaste tu lugar en la hackathon. Gracias por avisar: así otra persona de la lista de espera puede entrar.
            Sigues en el bootcamp. Si cambias de idea, puedes pedir tu lugar de nuevo{vencido ? " (si todavía hay)" : ""}.
          </p>
          <div className="rg-actions" style={{ marginTop: 14 }}>
            <button className="more solid" disabled={!!enviando} onClick={() => responder("confirmo")}>
              {enviando === "confirmo" && <Loader2 className="size-4 animate-spin" aria-hidden />} Quiero participar
            </button>
          </div>
        </>
      )}

      {a.estado === "pendiente" && (
        <>
          <h3 className="d" style={{ fontSize: "clamp(1.4rem,4vw,1.9rem)", lineHeight: 1.05 }}>
            Confirma que <span className="lav">participarás</span>
          </h3>
          <p className="rg-help" style={{ marginTop: 10 }}>
            {a.canjeo_discord
              ? "Ya canjeaste tu código de Discord, así que contamos contigo. Si ya no puedes participar, avísanos."
              : vencido
                ? `El plazo terminó el ${limite}, pero todavía puedes confirmar: tu lugar se mantiene mientras no lo necesite otra persona.`
                : `Tienes hasta el ${limite} (hora de Lima). Quien no confirma pierde su lugar, y pasa a quien está en la lista de espera.`}
          </p>
          <div className="rg-actions" style={{ marginTop: 16 }}>
            <button className="more solid" disabled={!!enviando} onClick={() => responder("confirmo")}>
              {enviando === "confirmo" && <Loader2 className="size-4 animate-spin" aria-hidden />} Confirmo que participaré
            </button>
            <button className="more" disabled={!!enviando} onClick={() => responder("no_participo")}>
              {enviando === "no_participo" && <Loader2 className="size-4 animate-spin" aria-hidden />} No podré participar
            </button>
          </div>
        </>
      )}

      {error && <p className="rg-msg err" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
