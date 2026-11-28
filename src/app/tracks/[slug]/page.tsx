import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/components/PageShell";
import UnirseTrack from "@/components/UnirseTrack";
import ManantialTrack from "@/components/ManantialTrack";
import ZeiaTrack from "@/components/ZeiaTrack";
import MillenniumTrack from "@/components/MillenniumTrack";
import { desde } from "@/lib/enlaces";

type TrackPublico = {
  nombre: string;
  sub: string;
  desc: string;
  tono: string;
  sponsor: null | { name: string; url: string; logo: string; width: number; height: number };
};

/**
 * Hoy están revelados Energía (sponsor: Zeia), Cloud (sponsor: Manantial) y Fintech (sponsor: Millennium); para los demás esta ruta responde 404.
 * Cuando se anuncie otro, se agrega aquí con su ficha (y en la tabla `tracks` de la
 * base se pone `revealed = true` y se le da su nombre y slug). Energía tiene página
 * propia con el branding de Zeia (ver components/ZeiaTrack), Cloud con el de Manantial (components/ManantialTrack) y
 * Fintech con el de Millennium (components/MillenniumTrack).
 */
const TRACKS_PUBLICOS: Record<string, TrackPublico> = {
  energia: {
    nombre: "Energía",
    sub: "Zeia · IA & Energía",
    desc: "Zeia es una empresa peruana de monitoreo energético en tiempo real: sensores IoT y software que muestran dónde se va cada sol de energía. El equipo ganador se lleva S/ 500.",
    tono: "#38e5c4",
    sponsor: { name: "Zeia", url: desde("https://zeia.com.pe/"), logo: "/logos/zeia.png", width: 308, height: 92 },
  },
  cloud: {
    nombre: "Educación",
    sub: "Manantial · IA & Educación",
    desc: "Manantial es una consultora peruana de tecnología, especialista en migración cloud, DevOps y ciberseguridad. El equipo ganador se lleva S/ 500.",
    tono: "#ff6b6b",
    sponsor: { name: "Manantial", url: desde("https://manantial.pe/"), logo: "/logos/manantial-color.png", width: 3578, height: 1386 },
  },
  fintech: {
    nombre: "Fintech",
    sub: "Millennium · IA & Fintech",
    desc: "Millennium es un grupo peruano de finanzas con foco en la inclusión financiera impulsada por IA, con las marcas Lima Bikes y Lizzo. El equipo ganador se lleva S/ 1 000.",
    tono: "#35a7e6",
    sponsor: { name: "Millennium", url: desde("https://millennium.ky/"), logo: "/logos/millennium-color.png", width: 1000, height: 429 },
  },
};

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
  if (slug === "energia") return <ZeiaTrack slug={slug} />;
  if (slug === "cloud") return <ManantialTrack slug={slug} />;
  if (slug === "fintech") return <MillenniumTrack slug={slug} />;

  return (
    <PageShell>
      <p className="pg-kick">Track revelado</p>
      <h1 className="pg-title" style={{ color: t.tono }}>{t.nombre}</h1>
      <p className="pg-lead">{t.desc}</p>

      {t.sponsor && (
        <a
          href={t.sponsor.url} target="_blank" rel="noopener"
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
          <li><b>El viernes 27 de noviembre</b>, durante la presentación de sponsors (8:30 p. m.), se abre la elección de track, con plazo hasta el domingo 29 a las 12:00 m.</li>
          <li><b>El líder</b> se une al track y, automáticamente, todo su equipo se une con él.</li>
          <li><b>Equipos de 2 a 4 personas</b>, de las carreras o facultades que quieran: a pedido de ustedes, ya no es obligatorio que sean distintas.</li>
          <li><b>Del sábado 28 a las 00:00 al miércoles 2 a las 4:00 a. m.</b> construyen y entregan su proyecto. Los 5 finalistas de cada track se anuncian el sábado 5.</li>
        </ul>
      </section>

      <div className="pg-cta">
        <Link href="/tracks" className="more"><ArrowLeft aria-hidden size={14} /> Todos los tracks</Link>
      </div>
    </PageShell>
  );
}
