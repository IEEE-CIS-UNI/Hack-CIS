import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BotonInscripcion from "@/components/BotonInscripcion";
import PageShell from "@/components/PageShell";
import { SESIONES, sesionPorN } from "@/lib/contenido";

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

export default async function SesionPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const sesion = sesionPorN(n);
  if (!sesion) notFound();

  const Icono = sesion.icon;
  const siguiente = SESIONES[SESIONES.findIndex((s) => s.n === n) + 1];

  return (
    <PageShell>
      <p className="pg-kick">Bootcamp · sesión {sesion.n}</p>
      <h1 className="pg-title" style={{ fontSize: "clamp(2.4rem,10vw,5.2rem)" }}>{sesion.title}</h1>
      <p className="pg-lead">{sesion.detalle}</p>

      <p className="pg-chip">23 al 27 de noviembre · virtual · abierto a todos</p>

      <section className="pg-sec" style={{ marginTop: 40 }}>
        <div className="box" style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <Icono aria-hidden strokeWidth={1.6} style={{ width: 34, height: 34, flex: "none", color: "var(--lav)" }} />
          <div style={{ flex: 1 }}>
            <p className="box-h" style={{ marginBottom: 10 }}>Inscríbete</p>
            <BotonInscripcion slug={sesion.slug} n={sesion.n} />
          </div>
        </div>
      </section>

      <section className="pg-sec">
        <h2>Cómo funciona</h2>
        <ul className="pg-dots">
          <li><b>Es gratis</b> y está abierto a cualquier persona, participes o no en la hackathon.</li>
          <li><b>Quienes están en la hackathon</b> también pueden entrar: se inscriben con un clic desde su panel.</li>
          <li><b>El horario y el enlace</b> de la sesión se publican aquí, y solo los ven los inscritos.</li>
        </ul>
      </section>

      <div className="pg-cta">
        <Link href="/bootcamp" className="more"><ArrowLeft aria-hidden size={14} /> Todas las sesiones</Link>
        {siguiente && (
          <Link href={`/bootcamp/${siguiente.n}`} className="more">
            Sesión {siguiente.n} <ArrowRight aria-hidden size={14} />
          </Link>
        )}
      </div>
    </PageShell>
  );
}
