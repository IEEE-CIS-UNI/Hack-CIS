import type { Metadata } from "next";
import MonitorEquipos from "@/components/MonitorEquipos";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Monitor de equipos · HACK[CIS] UNI 2026",
  description: "Panel de la organización.",
  robots: { index: false, follow: false },
};

export default function MonitorPage() {
  return (
    <PageShell wide>
      <p className="pg-kick">Organización</p>
      <h1 className="pg-title">Equipos <span className="lav">en vivo</span></h1>
      <MonitorEquipos />
    </PageShell>
  );
}
