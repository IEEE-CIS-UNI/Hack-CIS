import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Equipos from "@/components/Equipos";

export const metadata: Metadata = {
  title: "Arma tu equipo · HACK[CIS] UNI 2026",
  description: "Crea tu equipo, invita a personas o únete a uno antes de elegir track.",
  robots: { index: false },
};

export default function EquiposPage() {
  return (
    <PageShell>
      <p className="pg-kick">Hackathon</p>
      <h1 className="pg-title">Arma tu<br /><span className="lav">equipo</span></h1>
      <p className="pg-lead">De 2 a 4 personas, de las carreras o facultades que quieran. Primero se arma el equipo; el viernes 27, después del pitch de los sponsors, el líder elige el track.</p>
      <Equipos />
    </PageShell>
  );
}
