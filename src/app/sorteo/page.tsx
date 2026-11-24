import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Sorteo from "@/components/Sorteo";

export const metadata: Metadata = {
  title: "Sorteo en vivo · HACK[CIS] UNI 2026",
  description: "Sorteo en vivo de 3 cursos de WE Educación para quienes se queden hasta el final del bootcamp.",
  robots: { index: false },
};

export default function SorteoPage() {
  return (
    <PageShell wide>
      <p className="pg-kick">Bootcamp</p>
      <h1 className="pg-title">Sorteo <span className="lav">en vivo</span></h1>
      <Sorteo />
    </PageShell>
  );
}
