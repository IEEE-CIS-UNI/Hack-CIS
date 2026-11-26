"use client";

/**
 * «Elegir este track»: el LÍDER del equipo elige el track de todo su equipo.
 *
 * Los equipos se arman antes, en /equipos (viernes 27 a las 8:30 p. m. como máximo). El viernes 27, en la presentación de sponsors, el líder
 * entra a la página del track que quiere y toca el botón: todo su equipo queda en ese track. Algunos tracks tienen tope de
 * equipos (Fintech: 40): si ya está lleno, la base lo rechaza y aquí se avisa para que elija otro.
 *
 * Según quién mira:
 *   sin cuenta                -> entrar
 *   sin equipo                -> armarlo en /equipos
 *   integrante que no lidera  -> el track lo elige su líder
 *   antes de que abra         -> cuándo abre
 *   después del cierre        -> que ya cerró
 *   líder dentro de fechas    -> el botón (con al menos 2 integrantes)
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Users } from "lucide-react";
import { navegador } from "@/lib/supabase";
import AperturaTrack from "./AperturaTrack";
import { llamar, type MiEquipoDetalle } from "@/lib/equipos";

type Ventana = { name: string; opens_at: string | null; closes_at: string | null };
type Cupo = { slug: string; tope: number | null; ocupados: number };

type Carga =
  | { f: "cargando" }
  | { f: "listo"; sesion: boolean; equipo: MiEquipoDetalle | null; ventana: Ventana | null; cupo: Cupo | null; ahora: number };

export default function UnirseTrack({ slug }: { slug: string }) {
  const [carga, setCarga] = useState<Carga>({ f: "cargando" });
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const sb = navegador();
      const [{ data: v }, { data: sesion }, c] = await Promise.all([
        sb.from("tracks").select("name, opens_at, closes_at").eq("slug", slug).maybeSingle(),
        sb.auth.getSession(),
        llamar<Cupo[]>("track_cupos"),
      ]);
      const hay = !!sesion.session;
      const eq = hay ? await llamar<MiEquipoDetalle | null>("mi_equipo_detalle") : null;
      setCarga({
        f: "listo", sesion: hay, equipo: eq && eq.ok ? eq.data : null, ventana: (v as Ventana | null) ?? null,
        cupo: c.ok ? (c.data.find((x) => x.slug === slug) ?? null) : null, ahora: Date.now(),
      });
    } catch {
      setCarga({ f: "listo", sesion: false, equipo: null, ventana: null, cupo: null, ahora: Date.now() });
    }
  }, [slug]);

  useEffect(() => {
    // Consulta al abrir la página; los estados se fijan cuando responde la base.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  // Con la elección abierta, el número de equipos por track se actualiza solo.
  const abierta = carga.f === "listo" && !!carga.ventana?.opens_at && carga.ahora >= Date.parse(carga.ventana.opens_at)
    && (!carga.ventana.closes_at || carga.ahora <= Date.parse(carga.ventana.closes_at));
  useEffect(() => {
    if (!abierta) return;
    let vivo = true;
    const t = setInterval(async () => {
      const c = await llamar<Cupo[]>("track_cupos");
      if (vivo && c.ok) setCarga((v) => v.f === "listo" ? { ...v, cupo: c.data.find((x) => x.slug === slug) ?? v.cupo } : v);
    }, 5000 + Math.random() * 2000);
    return () => { vivo = false; clearInterval(t); };
  }, [abierta, slug]);

  if (carga.f === "cargando") {
    return <p className="rg-help" style={{ display: "flex", gap: 10, alignItems: "center" }}><Loader2 className="size-5 animate-spin" aria-hidden /> Un segundo…</p>;
  }

  const { sesion, equipo, ventana, cupo, ahora } = carga;
  const abre = ventana?.opens_at ? Date.parse(ventana.opens_at) : null;
  const cierra = ventana?.closes_at ? Date.parse(ventana.closes_at) : null;
  const lleno = !!cupo && cupo.tope !== null && cupo.ocupados >= cupo.tope;

  // Antes de abrir se avisa del tope; con la elección abierta, el número en vivo lo muestra ContadorTrack.
  const cupos = cupo && cupo.tope !== null && !abierta && (
    <p className="rg-small" style={{ marginTop: 14 }}>
      {lleno
        ? <>Este track ya llegó a su tope de <strong>{cupo.tope} equipos</strong>. Elige otro.</>
        : <>Este track acepta hasta <strong>la mitad de los equipos habilitados</strong> (máximo 40), para los primeros en elegirlo.</>}
    </p>
  );

  async function elegir() {
    setEnviando(true); setAviso(null);
    const r = await llamar("equipo_elegir_track", { p_track: slug });
    setEnviando(false);
    if (!r.ok) { setAviso({ tipo: "error", texto: r.motivo }); await cargar(); return; }
    setAviso({ tipo: "ok", texto: "¡Listo! Todo tu equipo quedó en este track." });
    await cargar();
  }

  if (!sesion) {
    return (
      <div>
        <p className="rg-help" style={{ marginTop: 0 }}>
          El track lo elige la persona líder de cada equipo. Para formar equipo tienes que estar inscrito en la hackathon. Entra a tu panel.
        </p>
        <div className="rg-actions" style={{ marginTop: 18 }}>
          <Link href="/mi-inscripcion" className="more solid">Entrar a mi panel <ArrowRight aria-hidden size={14} /></Link>
          <Link href="/equipos" className="more">Armar mi equipo</Link>
        </div>
        {cupos}
      </div>
    );
  }

  if (!equipo) {
    return (
      <div>
        <p className="rg-help" style={{ marginTop: 0 }}>
          Primero arma tu equipo, de 2 a 4 personas. Después, el viernes 27, su líder elige el track.
        </p>
        <div className="rg-actions" style={{ marginTop: 18 }}>
          <Link href="/equipos" className="more solid"><Users aria-hidden size={14} /> Armar mi equipo <ArrowRight aria-hidden size={14} /></Link>
        </div>
        {cupos}
      </div>
    );
  }

  const esteTrack = equipo.track?.slug === slug;
  const lider = equipo.miembros.find((m) => m.lider)?.nombre;

  if (esteTrack) {
    return (
      <div>
        <p className="box-h">Tu equipo</p>
        <p style={{ fontFamily: "var(--display)", fontWeight: 700, textTransform: "uppercase", fontSize: "2.2rem", lineHeight: 1 }}>{equipo.nombre}</p>
        <p className="rg-msg ok" style={{ marginTop: 12 }}><Check size={14} aria-hidden style={{ display: "inline", verticalAlign: -2 }} /> Tu equipo ya está en este track.</p>
        {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`}>{aviso.texto}</p>}
        <div className="rg-actions"><Link href="/equipos/mi-equipo" className="more">Ir a mi equipo <ArrowRight aria-hidden size={14} /></Link></div>
      </div>
    );
  }

  const antes = abre !== null && ahora < abre;
  const despues = cierra !== null && ahora > cierra;

  if (antes) {
    return (
      <div>
        <AperturaTrack abre={ventana!.opens_at!} alCambiar={cargar} nota={slug === "fintech" ? undefined : "El líder del equipo elige este track para todo el equipo."} />
        <p className="rg-small" style={{ marginTop: 12 }}>Al abrirse, aquí aparece el botón para que la persona líder elija este track para todo el equipo.</p>
        {cupos}
      </div>
    );
  }
  if (despues) return <p className="rg-msg warn">Ya cerró la elección de track.</p>;

  if (!equipo.soy_lider) {
    return (
      <div>
        <p className="rg-help" style={{ marginTop: 0 }}>
          El track lo elige la persona líder de tu equipo{lider ? <>: <strong style={{ color: "#fff" }}>{lider}</strong></> : ""}. Coordínense por WhatsApp.
        </p>
        {equipo.track && <p className="rg-small">Su track actual es <strong style={{ color: "#fff" }}>{equipo.track.nombre}</strong>.</p>}
        {cupos}
      </div>
    );
  }

  return (
    <div>
      <p className="rg-help" style={{ marginTop: 0 }}>
        Eres la persona líder de <strong style={{ color: "#fff" }}>{equipo.nombre}</strong>. Al elegir este track, todo tu equipo queda en él.
        {equipo.track ? <> Hoy están en <strong style={{ color: "#fff" }}>{equipo.track.nombre}</strong>; puedes cambiarlo mientras siga abierta la elección.</> : null}
      </p>
      {equipo.n < 2 && <p className="rg-msg warn" style={{ marginTop: 12 }}>Necesitan al menos 2 integrantes para elegir track.</p>}
      {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`} style={{ marginTop: 12 }}>{aviso.texto}</p>}
      <div className="rg-actions">
        <button className="more solid" disabled={enviando || lleno || equipo.n < 2} onClick={elegir}>
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {lleno ? "Track lleno" : "Elegir este track para mi equipo"} {!lleno && <ArrowRight aria-hidden size={14} />}
        </button>
      </div>
      {cupos}
    </div>
  );
}
