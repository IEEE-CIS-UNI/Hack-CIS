import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PanelLanzar from "@/components/PanelLanzar";

export const metadata: Metadata = {
  title: "Lanzar tracks · HACK[CIS] UNI 2026",
  description: "Panel de la organización.",
  robots: { index: false, follow: false },
};

export default function LanzarPage() {
  return (
    <PageShell wide>
      <p className="pg-kick">Organización</p>
      <h1 className="pg-title">Lanzar <span className="lav">tracks</span></h1>
      <PanelLanzar />
    </PageShell>
  );
}
