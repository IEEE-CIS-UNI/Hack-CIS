import type { Metadata } from "next";
import Elegir from "@/components/Elegir";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Elige tu beca · HACK[CIS] UNI 2026",
  description: "Para quienes ganaron un sorteo del bootcamp.",
  robots: { index: false, follow: false },   // el enlace se envía solo a quienes ganan
};

export default function EligePage() {
  return (
    <PageShell>
      <p className="pg-kick">Ganadores del sorteo</p>
      <h1 className="pg-title">Elige tu <span className="lav">beca</span></h1>
      <Elegir />
    </PageShell>
  );
}
