import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock, Monitor, Play, Ticket } from "lucide-react";
import BotonInscripcion from "@/components/BotonInscripcion";
import PageShell from "@/components/PageShell";
import UnirseZoom from "@/components/UnirseZoom";
import { SESIONES, sesionPorN } from "@/lib/contenido";
import { BLOQUES, DATOS_SESION } from "@/lib/sesiones";

/** Solo existen las sesiones del catálogo: cualquier otra ruta es 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return SESIONES.map((s) => ({ n: s.n }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const s = sesionPorN(n);
  return {
    title: s ? `${s.title} · Bootcamp · HACK[CIS] UNI 2026` : "Bootcamp · HACK[CIS] UNI 2026",
    description: s?.text,
  };
}

/** Iniciales para el avatar: sin títulos (Mg., Ing.) y como máximo dos letras. */
const iniciales = (nombre: string) =>
  nombre
    .replace(/^(Mg\.|Ing\.)\s+/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default async function SesionPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const sesion = sesionPorN(n);
  if (!sesion) notFound();

  const d = DATOS_SESION[sesion.n];
  const Icono = sesion.icon;
  const i = SESIONES.findIndex((s) => s.n === n);
  const anterior = SESIONES[i - 1];
  const siguiente = SESIONES[i + 1];
  const ponentes = d.ponentes;

  return (
    <PageShell wide>
      <div className="sd" style={{ "--tone": d.tone, "--tone2": d.tone2 } as CSSProperties}>
        <span className="sd-wm" aria-hidden>
          {sesion.n}
        </span>

        <div className="sd-bar">
          <Link href="/bootcamp" className="sd-back">
            <ArrowLeft aria-hidden size={14} /> Todas las sesiones
          </Link>
          <nav className="sd-steps" aria-label="Sesiones del bootcamp">
            {SESIONES.map((x) => (
              <Link key={x.n} href={`/bootcamp/${x.n}`} scroll={false} aria-current={x.n === sesion.n ? "page" : undefined} aria-label={`Sesión ${x.n}`}>
                {x.n}
              </Link>
            ))}
          </nav>
        </div>

        {/* Título y subtítulo */}
        <p className="pg-kick">Bootcamp · sesión {sesion.n}</p>
        <h1 className="pg-title sd-title">{sesion.title}</h1>
        <p className="pg-lead">{sesion.detalle}</p>

        {/* Ponentes (izquierda) y temática (derecha) */}
        <div className="sd-row sd-row1">
          <section className="sd-about sd-who" aria-labelledby="sd-sp">
            <h2 id="sd-sp" className="sd-h">Quién lo dicta</h2>
            {ponentes.map((p, k) => (
              <article key={`${p.name}-${k}`} className="sd-person">
                <div className="sd-av" aria-hidden>
                  {p.foto ? (
                    <Image src={p.foto} width={256} height={256} unoptimized alt="" />
                  ) : (
                    <span>{iniciales(p.name)}</span>
                  )}
                  <div className="sd-badge">
                    <Icono strokeWidth={1.7} />
                  </div>
                </div>
                <h3>{p.name}</h3>
                <p className="sd-role">{p.role}</p>
                <p className="sd-bio">{p.bio}</p>
                {p.href && (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="sd-in" aria-label={`Perfil de LinkedIn de ${p.name}`}>
                    LinkedIn <ArrowUpRight aria-hidden size={12} />
                  </a>
                )}
              </article>
            ))}
          </section>

          <section className="sd-about" aria-labelledby="sd-ab">
            <h2 id="sd-ab" className="sd-h">De qué va</h2>
            <p className="sd-desc">{d.workshop ?? d.resumen}</p>
            <ul className="sd-topics">
              {d.ideas.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <BotonInscripcion slug={sesion.slug} n={sesion.n} />
          </section>
        </div>

        {/* Información práctica */}
        <section className="sd-info" aria-label="Información de la sesión">
          <div>
            <CalendarDays aria-hidden size={18} />
            <span className="hud">Fecha</span>
            <b>{d.fecha}</b>
          </div>
          <div>
            <Clock aria-hidden size={18} />
            <span className="hud">Hora</span>
            <b>{d.hora}</b>
          </div>
          <div>
            <Monitor aria-hidden size={18} />
            <span className="hud">Modalidad</span>
            <b>Virtual</b>
          </div>
          <div>
            <Ticket aria-hidden size={18} />
            <span className="hud">Acceso</span>
            <b>Gratis y abierto a todos</b>
          </div>
          <p>El enlace de la sesión se publica aquí, y solo lo ven las personas inscritas.</p>
        </section>

        {/* Enlace de Zoom: a todo el ancho, solo para quien está inscrito a la sesión */}
        <UnirseZoom slug={sesion.slug} n={sesion.n} fecha={d.fecha} horario={d.horario} />

        {/* Estructura interna de la sesión (izquierda) y video (derecha) */}
        <div className="sd-row sd-row2">
          <section aria-labelledby="sd-tl">
            <h2 id="sd-tl" className="sd-h">Cómo se desarrolla la sesión</h2>
            <ol className="sd-tl">
              {(d.bloques ?? BLOQUES).map((b, k) => (
                <li key={`${k}-${b.title}`}>
                  <span className="sd-when">Bloque {k + 1}</span>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="sd-vd">
            <h2 id="sd-vd" className="sd-h">Mírala en YouTube</h2>
            {/* Reemplazar por el enlace o el reproductor cuando el video esté disponible. */}
            <div className="sd-video" role="img" aria-label="Video de la sesión, próximamente">
              <span className="sd-play">
                <Play aria-hidden fill="currentColor" />
              </span>
              <span className="hud">Próximamente</span>
              <small>El canal de CIS publicará la sesión aquí.</small>
            </div>
          </section>
        </div>

        <div className="pg-cta">
          {anterior && (
            <Link href={`/bootcamp/${anterior.n}`} className="more">
              <ArrowLeft aria-hidden size={14} /> Sesión {anterior.n}
            </Link>
          )}
          {siguiente && (
            <Link href={`/bootcamp/${siguiente.n}`} className="more">
              Sesión {siguiente.n} <ArrowRight aria-hidden size={14} />
            </Link>
          )}
        </div>
      </div>
    </PageShell>
  );
}
