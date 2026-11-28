"use client";

/**
 * «Anuncio importante» al entrar a la portada: el cambio de reglas del 26 de noviembre.
 *
 * Sale una sola vez por navegador (si no se puede guardar, sale en cada visita), la fila de los equipos desaparece cuando
 * cierran y el anuncio completo se retira solo el domingo 29 al mediodía. El mismo texto sigue en la portada y en las Bases.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import s from "./AnuncioModal.module.css";

const CLAVE = "anuncio-entrega-28nov";
const CIERRAN_EQUIPOS = Date.parse("2026-11-28T23:59:59-05:00");
const SE_RETIRA = Date.parse("2026-11-29T12:00:00-05:00");

const sinCambios = () => () => {};
/** Qué corresponde mostrar al abrir la página: nada, el anuncio completo o sin la fila de los equipos. */
let alAbrir: "no" | "completo" | "sinEquipos" | null = null;
function leer() {
  if (alAbrir) return alAbrir;
  const ahora = Date.now();
  let visto = false;
  try { visto = localStorage.getItem(CLAVE) === "1"; } catch { /* almacenamiento bloqueado: se muestra */ }
  alAbrir = visto || ahora >= SE_RETIRA ? "no" : ahora >= CIERRAN_EQUIPOS ? "sinEquipos" : "completo";
  return alAbrir;
}

export default function AnuncioModal() {
  const modo = useSyncExternalStore(sinCambios, leer, () => "no" as const);
  const [cerrado, setCerrado] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const abierto = modo !== "no" && !cerrado;

  function cerrar() {
    try { localStorage.setItem(CLAVE, "1"); } catch { /* sin almacenamiento no se recuerda */ }
    alAbrir = "no";
    setCerrado(true);
  }

  useEffect(() => {
    if (!abierto) return;
    const antes = document.activeElement as HTMLElement | null;
    const desborde = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    caja.current?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") { cerrar(); return; }
      if (e.key !== "Tab" || !caja.current) return;
      // el foco no se sale del anuncio mientras está abierto
      const f = Array.from(caja.current.querySelectorAll<HTMLElement>("a[href], button"));
      const primero = f[0], ultimo = f[f.length - 1], actual = document.activeElement;
      if (e.shiftKey && (actual === primero || actual === caja.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && actual === ultimo) { e.preventDefault(); primero.focus(); }
    };
    window.addEventListener("keydown", tecla);
    return () => { window.removeEventListener("keydown", tecla); document.body.style.overflow = desborde; antes?.focus?.(); };
  }, [abierto]);

  if (!abierto) return null;

  const filas: [string, string, string, string][] = [
    ["Vie", "27", "Retos de los sponsors, 8:30 p. m.", "Elijan track hasta el dom 29, 12:00 m."],
    ["Sáb", "28", "Se construye desde las 00:00", (modo === "completo" ? "Equipos hasta las 11:59 p. m. · " : "") + "Entrega: mié 2 dic, 4:00 p. m."],
    ["Sáb", "5", "Gran Final en la FIIS · UNI", "Ahí se anuncian los finalistas que pitchean"],
  ];

  return (
    <div className={s.fondo} onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <div ref={caja} className={s.caja} role="dialog" aria-modal="true" aria-labelledby="anuncio-titulo" tabIndex={-1}>
        <button type="button" className={s.x} onClick={cerrar} aria-label="Cerrar anuncio">×</button>
        <p className={s.sobre}>Anuncio importante</p>
        <h2 id="anuncio-titulo" aria-label="¡Todos construyen!">
          <span className={s.todos} aria-hidden>¡Todos</span>
          <span className={s.construyen} aria-hidden>Construyen<i>!</i></span>
        </h2>
        <p className={s.sub}>Por problemas con los datos de los sponsors, <b>ampliamos la entrega 12 horas</b>.</p>
        <ol className={s.filas}>
          {filas.map(([dia, n, titulo, detalle]) => (
            <li key={n}>
              <span className={s.fecha}><small>{dia}</small><strong>{n}</strong></span>
              <span><b>{titulo}</b><em>{detalle}</em></span>
            </li>
          ))}
        </ol>
        <p className={s.nota}>
          <b>Fintech, track dorado:</b> cupo para la mitad de los equipos (máx. 40).<br />
          <b>Asistencia:</b> equipos de 4, mín. 2 · de 2 o 3, mín. 1 · provincia o extranjero, mín. 1.
        </p>
        <div className={s.acciones}>
          <Link href="/bases" className={s.boton} onClick={cerrar}>Ver las bases <ArrowRight aria-hidden size={16} /></Link>
          <button type="button" className={s.entendido} onClick={cerrar}>Entendido</button>
        </div>
      </div>
    </div>
  );
}
