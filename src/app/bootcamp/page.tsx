import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import SemanaStrip from "@/components/SemanaStrip";
import SesionCard from "@/components/SesionCard";
import { SESIONES } from "@/lib/contenido";

export const metadata: Metadata = {
  title: "Bootcamp · HACK[CIS] UNI 2026",
  description: "Una semana virtual de charlas y talleres, del 23 al 27 de noviembre, para llegar listo al hackathon.",
};

export default function BootcampPage() {
  return (
    <PageShell wide>
      <p className="pg-kick">Bootcamp</p>
      <h1 className="pg-title">
        Una semana para
        <br />
        llegar <span className="lav">listo</span>
      </h1>
      <p className="pg-lead">
        Charlas y talleres con expertos para que todos los participantes arranquen el hackathon en igualdad de
        condiciones, sin importar su carrera ni su experiencia.
      </p>
      <p className="pg-when">23–27</p>
      <span className="pg-chip">noviembre · virtual · abierto a todos</span>

      <SemanaStrip />

      <section className="pg-sec">
        <h2>Los temas</h2>
        <p>Cada uno apunta a algo concreto que vas a necesitar durante las 100 horas del build.</p>
        <div className="sc-grid">
          {SESIONES.map((t) => (
            <SesionCard key={t.slug} s={t} />
          ))}
        </div>
      </section>

      <section className="pg-sec">
        <h2>Cómo sigue</h2>
        <ul className="pg-dots">
          <li>
            <b>Durante la semana</b> armas tu equipo: de 2 a 4 integrantes, de al menos 2 carreras o facultades
            distintas.
          </li>
          <li>
            <b>Viernes 27 de noviembre:</b> cada sponsor presenta su reto y eliges en qué track competir.
          </li>
          <li>
            <b>Hasta el sábado 28 por la noche</b> tu equipo entrega su propuesta.
          </li>
          <li>
            <b>Lunes 30 a las 6:00 pm</b> se anuncian los 15 finalistas, 5 por track. Los demás se llevan todo lo
            aprendido.
          </li>
        </ul>
      </section>

      <section className="pg-sec">
        <h2>Ponentes</h2>
        <p>Los anunciamos muy pronto.</p>
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
