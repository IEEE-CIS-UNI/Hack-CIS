"use client";

/**
 * «Quiero unirme a este track»: el líder crea el equipo.
 *
 * El líder pone el nombre del equipo y los DNI de los demás (de 1 a 3). Al
 * enviar, la base crea el equipo y asigna a todos de una vez, con ese nombre y
 * con el track de esta página. Los DNI viajan al servidor, que los cifra: ni
 * se guardan ni vuelven al navegador.
 *
 * Según quién mira, esta pantalla muestra una cosa u otra:
 *
 *   sin cuenta / sin hack   -> qué hacer primero
 *   ya tiene equipo         -> su equipo
 *   antes del viernes 27    -> cuándo se abre
 *   después del cierre      -> que ya cerró
 *   dentro de la ventana    -> el formulario
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { api, estaEn, type Equipo, type Resumen } from "@/lib/resumen";

type Ventana = { opens_at: string | null; closes_at: string | null; revealed: boolean };

type Carga =
  | { f: "cargando" }
  | { f: "listo"; token: string | null; resumen: Resumen | null; ventana: Ventana | null; ahora: number };

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Lima" });

function EquipoVista({ equipo }: { equipo: Equipo }) {
  return (
    <div>
      <p className="box-h">Tu equipo</p>
      <p style={{ fontFamily: "var(--display)", fontWeight: 700, textTransform: "uppercase", fontSize: "2.2rem", lineHeight: 1 }}>
        {equipo.name}
      </p>
      <p className="rg-help" style={{ marginTop: 6 }}>
        Track: <strong style={{ color: "#fff" }}>{equipo.track_name}</strong>
      </p>
      <ul className="team-list" style={{ marginTop: 12 }}>
        {equipo.members.map((m) => (
          <li key={m.name}>
            <Check size={14} aria-hidden className="text-glow" /> <b>{m.name}</b>
            {m.leader && <span className="pill-ok">líder</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function UnirseTrack({ slug }: { slug: string }) {
  const [carga, setCarga] = useState<Carga>({ f: "cargando" });
  const [nombre, setNombre] = useState("");
  const [dnis, setDnis] = useState<string[]>([""]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<{ motivo: string; posicion?: number } | null>(null);
  const [equipoNuevo, setEquipoNuevo] = useState<Equipo | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const sb = navegador();
        const { data: v } = await sb
          .from("tracks").select("opens_at, closes_at, revealed").eq("slug", slug).maybeSingle();
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token ?? null;
        let resumen: Resumen | null = null;
        if (token) {
          const { datos } = await api("/api/perfil", { token });
          resumen = (datos.resumen as Resumen | undefined) ?? null;
        }
        if (vivo) setCarga({ f: "listo", token, resumen, ventana: (v as Ventana | null) ?? null, ahora: Date.now() });
      } catch {
        if (vivo) setCarga({ f: "listo", token: null, resumen: null, ventana: null, ahora: Date.now() });
      }
    })();
    return () => { vivo = false; };
  }, [slug]);

  if (carga.f === "cargando") {
    return <p className="rg-help" style={{ display: "flex", gap: 10, alignItems: "center" }}><Loader2 className="size-5 animate-spin" aria-hidden /> Un segundo…</p>;
  }

  const { token, resumen, ventana, ahora } = carga;
  const equipo = equipoNuevo ?? resumen?.team ?? null;

  if (equipo) return <EquipoVista equipo={equipo} />;

  if (!token || !resumen) {
    return (
      <div>
        <p className="rg-help" style={{ marginTop: 0 }}>
          Para formar un equipo tienes que estar inscrito en la hackathon. Entra con tu cuenta o inscríbete.
        </p>
        <div className="rg-actions" style={{ marginTop: 18 }}>
          <Link href="/mi-inscripcion" className="more solid">Entrar a mi panel <ArrowRight aria-hidden size={14} /></Link>
          <Link href="/registro?plan=hack" className="more">Inscribirme a la hack</Link>
        </div>
      </div>
    );
  }

  if (!estaEn(resumen, "hack")) {
    return (
      <div>
        <p className="rg-help" style={{ marginTop: 0 }}>
          Primero tienes que estar inscrito en la hackathon. Desde tu panel puedes hacerlo si tu identidad ya está verificada.
        </p>
        <div className="rg-actions" style={{ marginTop: 18 }}>
          <Link href="/mi-inscripcion" className="more solid">Ir a mi panel <ArrowRight aria-hidden size={14} /></Link>
        </div>
      </div>
    );
  }

  if (ventana?.opens_at && ahora < Date.parse(ventana.opens_at)) {
    return (
      <div>
        <p className="rg-msg" style={{ fontSize: "1.1rem" }}>
          Los equipos se arman el <strong>{fecha(ventana.opens_at)}</strong>, después del pitch de los sponsors.
        </p>
        <p className="rg-small">Entonces aquí aparece el botón para unirte a este track.</p>
      </div>
    );
  }
  if (ventana?.closes_at && ahora > Date.parse(ventana.closes_at)) {
    return <p className="rg-msg warn">Ya cerró la elección de track.</p>;
  }

  const actualizar = (i: number, v: string) =>
    setDnis((d) => d.map((x, j) => (j === i ? v.replace(/\D/g, "").slice(0, 8) : x)));

  const puede = nombre.trim().length >= 3 && dnis.every((d) => d.length === 8);

  async function enviar() {
    setEnviando(true);
    setError(null);
    const { datos } = await api("/api/equipo", { metodo: "POST", token, cuerpo: { track: slug, nombre, dnis } });
    setEnviando(false);
    const resumenNuevo = datos.resumen as Resumen | undefined;
    if (datos.ok && resumenNuevo?.team) setEquipoNuevo(resumenNuevo.team);
    else setError({ motivo: datos.motivo ?? "No pudimos crear el equipo.", posicion: datos.posicion });
  }

  return (
    <div>
      <p className="rg-help" style={{ marginTop: 0 }}>
        Tú eres la persona líder. Ponle nombre al equipo y escribe el DNI de tus compañeros (de 1 a 3). Tienen que estar
        inscritos en la hackathon y ser de al menos 2 carreras distintas entre todos.
      </p>

      <div className="rg-two" style={{ marginTop: 22 }}>
        <div>
          <label className="rg-lbl" htmlFor="eq-nombre">Nombre del equipo</label>
          <input id="eq-nombre" value={nombre} onChange={(e) => setNombre(e.target.value.slice(0, 40))}
            placeholder="Los Cuervos" autoComplete="off" className="rg-input" />
        </div>

        {dnis.map((d, i) => (
          <div key={i}>
            <label className="rg-lbl" htmlFor={`eq-dni-${i}`}>DNI del integrante {i + 1}</label>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <input id={`eq-dni-${i}`} value={d} onChange={(e) => actualizar(i, e.target.value)}
                inputMode="numeric" autoComplete="off" placeholder="8 dígitos" className="rg-input dni tabular-nums"
                style={error?.posicion === i + 1 ? { borderColor: "#ff7ae6" } : undefined} />
              {dnis.length > 1 && (
                <button type="button" className="rg-chip rg-year" aria-label={`Quitar integrante ${i + 1}`}
                  onClick={() => setDnis((x) => x.filter((_, j) => j !== i))}><X size={16} aria-hidden /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      {dnis.length < 3 && (
        <div className="rg-actions" style={{ marginTop: 18 }}>
          <button type="button" className="more" onClick={() => setDnis((d) => [...d, ""])}>
            <Plus size={14} aria-hidden /> Añadir integrante
          </button>
        </div>
      )}

      {error && (
        <p className="rg-msg err" style={{ marginTop: 16 }}>
          {error.posicion ? `Integrante ${error.posicion}: ` : ""}{error.motivo}
        </p>
      )}

      <div className="rg-actions">
        <button className="more solid" disabled={!puede || enviando} onClick={enviar}>
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Quiero unirme a este track <ArrowRight aria-hidden size={14} />
        </button>
      </div>
      <p className="rg-small">Al crear el equipo, todos quedan asignados a este reto.</p>
    </div>
  );
}
