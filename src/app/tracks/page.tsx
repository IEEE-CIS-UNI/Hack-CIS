import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { TrackList } from "@/components/Tracks";

export const metadata: Metadata = {
  title: "Tracks · HACK[CIS] UNI 2026",
  description: "Tres retos reales de empresa. Energía ya está revelado; los otros dos se anuncian pronto.",
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
        Tres sponsors, tres retos reales. Ya conoces el primero; los otros dos se revelan pronto.
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
            <b>Eliges un track</b> al inscribirte y puedes cambiarlo desde tu ficha hasta el cierre del Bootcamp.
          </li>
          <li>
            <b>Pasan 5 equipos por track</b>, 15 en total, a construir con su agente de IA.
          </li>
          <li>
            <b>Un ganador por track</b>, que se anuncia en la Gran Final del sábado 5 de diciembre.
          </li>
          <li>
            <b>La solución es de tu equipo.</b> El sponsor del track ganador recibe solo una licencia no exclusiva
            para evaluarla y pilotearla. <Link href="/bases" className="underline underline-offset-4">Lee las bases</Link>.
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
