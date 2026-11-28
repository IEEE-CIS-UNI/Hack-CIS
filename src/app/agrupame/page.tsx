import type { Metadata } from "next";
import Agrupame from "@/components/Agrupame";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Agrúpenme · HACK[CIS] UNI 2026",
  description: "Para quienes todavía no tienen equipo.",
  robots: { index: false, follow: false },   // se llega solo con el enlace personal del correo
  referrer: "no-referrer",                   // que la clave del enlace no viaje a otros sitios
};

export default function AgrupamePage() {
  return (
    <PageShell>
      <p className="pg-kick">¿Aún sin equipo?</p>
      <h1 className="pg-title">Te <span className="lav">agrupamos</span></h1>
      <Agrupame />
    </PageShell>
  );
}
