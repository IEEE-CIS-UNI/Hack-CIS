"use client";

/**
 * «Agrúpenme» (supabase/049). Se llega con el enlace personal del correo (?t=clave). Nada se guarda al abrir la página:
 * hay que tocar el botón, así los lectores automáticos de enlaces del correo no apuntan a nadie.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Users } from "lucide-react";
import { navegador } from "@/lib/supabase";

type Datos = { estado: "invalido" | "con_equipo" | "cerrado" | "sin_cupo" | "listo"; nombre?: string; apuntado?: boolean; total?: number };

export default function Agrupame() {
  const [datos, setDatos] = useState<Datos | "cargando" | "error">("cargando");
  const [ocupado, setOcupado] = useState(false);

  const llamar = useCallback(async (accion: "apuntar" | "quitar" | null) => {
    const token = new URLSearchParams(window.location.search).get("t") ?? "";
    try {
      const { data, error } = await navegador().rpc("agrupar_por_token", { p_token: token, p_accion: accion });
      setDatos(error || !data ? "error" : (data as Datos));
    } catch { setDatos("error"); }
  }, []);

  useEffect(() => {
    // Consulta al abrir la página; el estado se fija cuando responde la base.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    llamar(null);
  }, [llamar]);

  const pulsar = async (accion: "apuntar" | "quitar") => { setOcupado(true); await llamar(accion); setOcupado(false); };

  if (datos === "cargando") return <p className="rg-help" style={{ display: "flex", gap: 10, alignItems: "center" }}><Loader2 className="size-5 animate-spin" aria-hidden /> Un segundo…</p>;
  if (datos === "error") return <div className="box" style={{ marginTop: 28 }}><p className="rg-msg err">No pudimos cargar tu enlace.</p><div className="rg-actions"><button type="button" className="more solid" onClick={() => llamar(null)}>Reintentar</button></div></div>;

  const armar = <div className="rg-actions"><Link href="/equipos" className="more">Armar mi equipo por mi cuenta <ArrowRight aria-hidden size={14} /></Link></div>;

  if (datos.estado === "invalido") return <div className="box" style={{ marginTop: 28 }}><p className="rg-help">Este enlace no es válido. Abre el botón desde el correo que te enviamos.</p>{armar}</div>;
  if (datos.estado === "con_equipo") return <div className="box" style={{ marginTop: 28 }}><p className="rg-msg ok"><Check size={16} aria-hidden style={{ display: "inline", verticalAlign: -3 }} /> {datos.nombre}, ya estás en un equipo.</p><div className="rg-actions"><Link href="/equipos/mi-equipo" className="more solid">Ver mi equipo <ArrowRight aria-hidden size={14} /></Link></div></div>;
  if (datos.estado === "cerrado") return <div className="box" style={{ marginTop: 28 }}><p className="rg-help">La lista para agrupar cerró a las 9:30 p. m. Todavía puedes armar o unirte a un equipo hasta las 11:59 p. m.</p>{armar}</div>;
  if (datos.estado === "sin_cupo") return <div className="box" style={{ marginTop: 28 }}><p className="rg-help">No encontramos un cupo activo en la hackathon con este enlace. Si crees que es un error, responde el correo.</p></div>;

  return (
    <div className="box" style={{ marginTop: 28 }}>
      {datos.apuntado ? (
        <>
          <p className="rg-msg ok" style={{ fontSize: "1.15rem" }}><Check size={18} aria-hidden style={{ display: "inline", verticalAlign: -3 }} /> Listo, {datos.nombre}: estás en la lista.</p>
          <p className="rg-help">A las 9:30 p. m. armamos los grupos y te escribimos con quién quedaste. Si antes entras a un equipo por tu cuenta, no pasa nada.</p>
          <p className="rg-help" style={{ fontSize: ".9rem" }}>Personas en la lista ahora: <strong style={{ color: "#fff" }}>{datos.total}</strong></p>
          <div className="rg-actions"><button type="button" className="more" disabled={ocupado} onClick={() => pulsar("quitar")}>Quitarme de la lista</button></div>
        </>
      ) : (
        <>
          <p className="rg-help" style={{ marginTop: 0 }}><strong style={{ color: "#fff" }}>{datos.nombre}</strong>, te juntamos con otras personas que tampoco tienen equipo (de 2 a 4). A las 9:30 p. m. te escribimos con tu grupo.</p>
          <p className="rg-help" style={{ fontSize: ".88rem", opacity: .85 }}>Al apuntarte confirmas que participarás en la hackathon y aceptas que tus compañeros de equipo vean tu nombre, correo y celular.</p>
          <div className="rg-actions">
            <button type="button" className="more solid" disabled={ocupado} onClick={() => pulsar("apuntar")}>
              {ocupado ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Users aria-hidden size={14} />} Sí, agrúpenme
            </button>
          </div>
          {armar}
        </>
      )}
    </div>
  );
}
