"use client";

/**
 * «Data del reto»: el material de apoyo de un track. Los enlaces y archivos viven en la base (supabase/048), no en este código:
 * la base solo los entrega a quien inició sesión y tiene cupo; lo confidencial, solo a los equipos que eligieron ese track.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, ExternalLink, Loader2, Lock, LogIn } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { llamar } from "@/lib/equipos";
import { LINKS } from "@/lib/config";
import s from "./DataTrack.module.css";

type Item = { titulo: string; detalle: string | null; url: string | null; archivo: string | null; contenido: string | null; confidencial: boolean; tipo: "data" | "canal" };
type Material = { estado: "ok"; items: Item[]; bloqueados: number; canal_bloqueado: boolean } | { estado: "sin_cupo" };
type Vista = { f: "cargando" } | { f: "sinSesion" } | { f: "error" } | { f: "listo"; m: Material };

function descargar(nombre: string, contenido: string) {
  // la marca inicial hace que Excel lea bien las tildes
  const url = URL.createObjectURL(new Blob(["﻿" + contenido.replace(/^﻿/, "")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DataTrack({ slug }: { slug: string }) {
  const [vista, setVista] = useState<Vista>({ f: "cargando" });

  const cargar = useCallback(async () => {
    try {
      const { data } = await navegador().auth.getSession();
      if (!data.session) { setVista({ f: "sinSesion" }); return; }
      const r = await llamar<Material>("track_material", { p_slug: slug });
      setVista(r.ok ? { f: "listo", m: r.data } : { f: "error" });
    } catch { setVista({ f: "error" }); }
  }, [slug]);

  useEffect(() => {
    // Consulta al abrir la página; los estados se fijan cuando responde la base.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  return (
    <section id="data" className={s.data} aria-labelledby="data-titulo">
      <p className={s.sobre}>Material de apoyo</p>
      <h3 id="data-titulo">Data del reto</h3>

      {vista.f === "cargando" && <p className={s.nota}><Loader2 className="size-4 animate-spin" aria-hidden /> Un segundo…</p>}

      {vista.f === "sinSesion" && (
        <>
          <p className={s.texto}><Lock size={16} aria-hidden /> Inicia sesión con tu cuenta de la hackathon para ver la data.</p>
          <Link href="/mi-inscripcion" className={s.boton}><LogIn size={16} aria-hidden /> Iniciar sesión</Link>
          <p className={s.nota}>Después de entrar, vuelve a esta página.</p>
        </>
      )}

      {vista.f === "error" && <><p className={s.texto}>No pudimos cargar la data.</p><button type="button" className={s.boton} onClick={cargar}>Reintentar</button></>}

      {vista.f === "listo" && vista.m.estado === "sin_cupo" && (
        <p className={s.texto}><Lock size={16} aria-hidden /> La data es para quienes participan en la hackathon. Revisa que hayas entrado con el correo de tu inscripción.</p>
      )}

      {vista.f === "listo" && vista.m.estado === "ok" && (
        <>
          {vista.m.items.some((i) => i.tipo === "data") && (
            <ul className={s.lista}>
              {vista.m.items.filter((i) => i.tipo === "data").map((i) => (
                <li key={i.titulo}>
                  <div>
                    <b>{i.titulo}</b>
                    {i.detalle && <p>{i.detalle}</p>}
                    {i.confidencial && <small>Confidencial: solo para tu equipo y solo para este reto.</small>}
                  </div>
                  {i.url && <a className={s.boton} href={i.url} target="_blank" rel="noopener noreferrer">Abrir <ExternalLink size={14} aria-hidden /></a>}
                  {i.contenido && i.archivo && <button type="button" className={s.boton} onClick={() => descargar(i.archivo!, i.contenido!)}>Descargar <Download size={14} aria-hidden /></button>}
                </li>
              ))}
            </ul>
          )}
          {vista.m.bloqueados > 0 && (
            <>
              <p className={s.texto}><Lock size={16} aria-hidden /> Esta data es confidencial: aparece aquí cuando tu equipo elige este track.</p>
              <a href="#unete" className={s.boton}>Elegir este track <ArrowRight size={14} aria-hidden /></a>
            </>
          )}
          {!vista.m.items.some((i) => i.tipo === "data") && vista.m.bloqueados === 0 && <p className={s.texto}>Todavía no hay material publicado. Vuelve en un rato.</p>}
        </>
      )}

      <div className={s.canal}>
        <h4>Canales oficiales del track</h4>
        <p>En unas horas se unirán los responsables de cada reto para resolver sus consultas.</p>
        {vista.f === "listo" && vista.m.estado === "ok" && (
          <>
            {vista.m.items.filter((i) => i.tipo === "canal" && i.url).map((i) => (
              <a key={i.titulo} className={s.boton} href={i.url!} target="_blank" rel="noopener noreferrer">{i.titulo} <ExternalLink size={14} aria-hidden /></a>
            ))}
            {vista.m.canal_bloqueado && <p><Lock size={14} aria-hidden style={{ display: "inline", verticalAlign: -2 }} /> El grupo de WhatsApp aparece aquí cuando tu equipo elige este track.</p>}
          </>
        )}
        <p>En <a href={LINKS.discord} target="_blank" rel="noopener noreferrer">Discord</a>: verifícate con tu código de inscripción y pulsa «Obtener mi Track» en #info-tracks. Si cambias de track, púlsalo de nuevo.</p>
      </div>
    </section>
  );
}
