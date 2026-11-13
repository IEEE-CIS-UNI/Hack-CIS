import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Monitor, Play, Ticket } from "lucide-react";
import BotonInscripcion from "@/components/BotonInscripcion";
import PageShell from "@/components/PageShell";
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

/** Por ahora no se muestran nombres: dos cartillas genéricas hasta confirmar a cada ponente. */
const PONENTES_POR_ANUNCIAR = [1, 2].map((k) => ({
  name: `Ponente ${k}`,
  role: "Próximamente",
  bio: "Su información se publicará pronto.",
}));

export default async function SesionPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const sesion = sesionPorN(n);
  if (!sesion) notFound();

  const d = DATOS_SESION[sesion.n];
  const Icono = sesion.icon;
  const i = SESIONES.findIndex((s) => s.n === n);
  const anterior = SESIONES[i - 1];
  const siguiente = SESIONES[i + 1];
  const ponentes = PONENTES_POR_ANUNCIAR;

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
              <Link key={x.n} href={`/bootcamp/${x.n}`} aria-current={x.n === sesion.n ? "page" : undefined} aria-label={`Sesión ${x.n}`}>
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
        <div className="sd-row">
          <section aria-labelledby="sd-sp">
            <h2 id="sd-sp" className="sd-h">Quiénes lo dictan</h2>
            <div className="sd-speakers">
              {ponentes.map((p, k) => (
                <article key={`${p.name}-${k}`} className="sd-sp">
                  <div className="sd-av" aria-hidden>
                    <span>?</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p className="sd-role">{p.role}</p>
                  <p className="sd-bio">{p.bio}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="sd-about" aria-labelledby="sd-ab">
            <h2 id="sd-ab" className="sd-h">De qué va</h2>
            <div className="sd-ic">
              <Icono aria-hidden strokeWidth={1.6} />
            </div>
            <p className="sd-desc">{d.resumen}</p>
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
            <b>Por confirmar</b>
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
          <p>El horario y el enlace de la sesión se publican aquí, y solo los ven las personas inscritas.</p>
        </section>

        {/* Estructura interna de la sesión (izquierda) y video (derecha) */}
        <div className="sd-row sd-row2">
          <section aria-labelledby="sd-tl">
            <h2 id="sd-tl" className="sd-h">Cómo se desarrolla la sesión</h2>
            <ol className="sd-tl">
              {BLOQUES.map((b) => (
                <li key={b.title}>
                  <span className="sd-when">{b.title}</span>
                  <h3>Por definir</h3>
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
