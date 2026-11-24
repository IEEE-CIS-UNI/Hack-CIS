import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { TrackList } from "@/components/Tracks";

export const metadata: Metadata = {
  title: "Tracks · HACK[CIS] UNI 2026",
  description: "Tres retos reales de empresa: IA & Energía, con Zeia; IA & Cloud, con Manantial; e IA & Fintech, con Millennium, el track dorado.",
};

export default function TracksPage() {
  return (
    <PageShell>
      <p className="pg-kick">Tracks</p>
      <h1 className="pg-title">
        Elige tu
        <br />
        <span className="lav">batalla</span>
      </h1>
      <p className="pg-lead">
        Tres sponsors, tres retos reales: Energía con Zeia, Cloud con Manantial y Fintech con Millennium, el track dorado: S/ 1 000 y una carta oferta para cada integrante del equipo ganador.
      </p>

      <div className="pg-tracks">
        <TrackList />
      </div>

      <section className="pg-sec">
        <h2>Cómo funcionan</h2>
        <ul className="pg-dots">
          <li>
            <b>Cada sponsor presenta su reto</b> al cierre del Bootcamp, el viernes 27 de noviembre.
          </li>
          <li>
            <b>El líder del equipo elige el track</b> el viernes 27, desde la página de cada track: se une y, automáticamente, todo su equipo se une con él.
          </li>
          <li>
            <b>Pasan 25 equipos a construir</b> con su agente de IA: 5 en Energía, 5 en Cloud y 15 en Fintech, el track dorado.
          </li>
          <li>
            <b>Fintech acepta hasta 40 equipos</b>, para los primeros que lo elijan. Energía y Cloud no tienen tope. En la Gran Final se anuncian, en el auditorio, los 5 equipos de Fintech que hacen pitch: al final hacen pitch 15 finalistas, 5 por track.
          </li>
          <li>
            <b>Un ganador por track</b>, que se anuncia en la Gran Final del sábado 5 de diciembre.
          </li>
          <li>
            <b>La autoría es de tu equipo.</b> Las soluciones quedan como repositorio open source con licencia MIT,
            a total disposición del sponsor del track para pilotearlas. <Link href="/bases" className="underline underline-offset-4">Lee las bases</Link>.
          </li>
        </ul>
      </section>

      <div className="pg-cta">
        <Link href="/registro" className="more solid">
          Inscríbete <ArrowRight aria-hidden size={14} />
        </Link>
        <Link href="/" className="more">
          <ArrowLeft aria-hidden size={14} /> Volver al inicio
        </Link>
      </div>
    </PageShell>
  );
}
