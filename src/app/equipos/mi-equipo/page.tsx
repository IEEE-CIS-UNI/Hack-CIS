import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import MiEquipo from "@/components/MiEquipo";

export const metadata: Metadata = {
  title: "Mi equipo · HACK[CIS] UNI 2026",
  robots: { index: false },
};

export default function MiEquipoPage() {
  return (
    <PageShell wide>
      <p className="pg-kick">Hackathon</p>
      <h1 className="pg-title">Mi <span className="lav">equipo</span></h1>
      <MiEquipo />
    </PageShell>
  );
}
