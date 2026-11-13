import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/components/PageShell";
import UnirseTrack from "@/components/UnirseTrack";

type TrackPublico = {
  nombre: string;
  sub: string;
  desc: string;
  tono: string;
  sponsor: null | { name: string; url: string; logo: string; width: number; height: number };
};

/**
 * Hoy NINGÚN track está revelado, así que esta ruta responde 404 para todos.
 * Cuando se anuncie uno, se agrega aquí con su ficha (y en la tabla `tracks`
 * de la base se pone `revealed = true` y se le da su nombre y slug).
 */
const TRACKS_PUBLICOS: Record<string, TrackPublico> = {};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(TRACKS_PUBLICOS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TRACKS_PUBLICOS[slug];
  return { title: `${t?.sub ?? "Track"} · HACK[CIS] UNI 2026`, description: t?.desc };
}

export default async function TrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TRACKS_PUBLICOS[slug];
  if (!t) notFound();

  return (
    <PageShell>
      <p className="pg-kick">Track revelado</p>
      <h1 className="pg-title" style={{ color: t.tono }}>{t.nombre}</h1>
      <p className="pg-lead">{t.desc}</p>

      {t.sponsor && (
        <a
          href={t.sponsor.url} target="_blank" rel="noopener noreferrer"
          className="tk-power" style={{ marginTop: 28, display: "inline-flex", fontFamily: "var(--tech)", fontSize: ".56rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--mist)", alignItems: "center", gap: 14 }}
        >
          Powered by
          <Image src={t.sponsor.logo} width={t.sponsor.width} height={t.sponsor.height} alt={t.sponsor.name} unoptimized style={{ height: 46, width: "auto" }} />
        </a>
      )}

      <section className="pg-sec">
        <div className="box">
          <p className="box-h">Únete a este track</p>
          <UnirseTrack slug={slug} />
        </div>
      </section>

      <section className="pg-sec">
        <h2>Cómo funciona</h2>
        <ul className="pg-dots">
          <li><b>El viernes 27 de noviembre</b>, después del pitch de los sponsors, cada equipo elige su track.</li>
          <li><b>El líder</b> crea el equipo: pone el nombre y los DNI de sus compañeros, y todos quedan asignados de una vez.</li>
          <li><b>Equipos de 2 a 4 personas</b>, con al menos 2 carreras o facultades distintas.</li>
          <li><b>Antes del sábado 28 por la noche</b> el equipo entrega su primera propuesta.</li>
        </ul>
      </section>

      <div className="pg-cta">
        <Link href="/tracks" className="more"><ArrowLeft aria-hidden size={14} /> Todos los tracks</Link>
      </div>
    </PageShell>
  );
}
