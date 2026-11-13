import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Niveles } from "@/components/Sponsors";
import { WA_MENTOR, WA_SPONSOR } from "@/lib/config";
import { APOYO_ROLES, SPONSOR_OFRECE, SPONSOR_PIDE } from "@/lib/contenido";

export const metadata: Metadata = {
  title: "Sponsors · HACK[CIS] UNI 2026",
  description: "Quiénes organizan y apoyan HACK[CIS] UNI 2026, y cómo sumarte como sponsor, mentor o jurado.",
};

export default function SponsorsPage() {
  return (
    <PageShell>
      <p className="pg-kick">Quiénes lo hacen posible</p>
      <h1 className="pg-title">
        Marcas que
        <br />
        <span className="lav">apuestan</span> por ti
      </h1>
      <p className="pg-lead">
        HACK[CIS] UNI 2026 es una hackathon nacional de 100 horas donde equipos universitarios y de institutos
        resuelven retos reales de empresa. Estas son las organizaciones que lo hacen posible.
      </p>

      <Niveles />

      <section className="pg-sec" id="sponsor">
        <h2>Sé sponsor</h2>
        <p>
          Patrocina un track, plantea tu reto y conoce a quienes lo resuelven. Hay un solo sponsor por track.
        </p>
        <p className="pg-kick" style={{ marginTop: 28 }}>
          Qué ofrecemos
        </p>
        <ul className="pg-dots">
          {SPONSOR_OFRECE.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="pg-kick" style={{ marginTop: 28 }}>
          Qué pedimos
        </p>
        <ul className="pg-dots">
          {SPONSOR_PIDE.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="pg-sec" id="mentores">
        <h2>Sé mentor o jurado</h2>
        <p>No pedimos dinero: pedimos tu tiempo y tu criterio para guiar a los equipos y evaluar la final.</p>
        <ul className="pg-dots">
          {APOYO_ROLES.map((r) => (
            <li key={r.role}>
              <b>{r.role}.</b> {r.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="pg-sec" id="contacto-sponsors">
        <h2>Hablemos</h2>
        <p>Escríbenos por WhatsApp a nuestro equipo de relaciones públicas y coordinamos.</p>
        <div className="pg-cta" style={{ marginTop: 22 }}>
          <a href={WA_SPONSOR} target="_blank" rel="noopener noreferrer" className="more solid">
            Quiero ser sponsor <ArrowRight aria-hidden size={14} />
          </a>
          <a href={WA_MENTOR} target="_blank" rel="noopener noreferrer" className="more">
            Quiero ser mentor o jurado <ArrowRight aria-hidden size={14} />
          </a>
        </div>
      </section>

      <div className="pg-cta">
        <Link href="/" className="more">
          <ArrowLeft aria-hidden size={14} /> Volver al inicio
        </Link>
      </div>
    </PageShell>
  );
}
