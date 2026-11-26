"use client";

/**
 * El recuadro «Mi equipo» del panel para quien aún no tiene equipo. Solo aparece si puede formar uno (lugar confirmado):
 * a quien está en lista de espera o sin confirmar ya se lo explica «Tu lugar en la hackathon».
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { llamar, type EstadoEquipos } from "@/lib/equipos";
import { fechaLima } from "./EquiposUI";

export default function SinEquipo() {
  const [e, setE] = useState<(EstadoEquipos & { antes: boolean }) | null>(null);

  useEffect(() => {
    // Se vuelve a mirar cada tanto: la persona puede confirmar su lugar (arriba) o puede abrirse la plataforma.
    let vivo = true;
    const mirar = async () => {
      const r = await llamar<EstadoEquipos>("equipos_estado");
      if (vivo && r.ok) setE({ ...r.data, antes: Date.now() < Date.parse(r.data.abre) });
    };
    mirar();
    const t = setInterval(mirar, 20_000);
    return () => { vivo = false; clearInterval(t); };
  }, []);

  if (!e || !e.puede) return null;
  return (
    <div className="box">
      <p className="box-h">Mi equipo</p>
      <p className="rg-help" style={{ marginTop: 0 }}>
        Todavía no tienes equipo.{" "}
        {e.abierto ? `La plataforma ya está abierta y cierra el ${fechaLima(e.cierra)} (hora de Lima). El track lo elige quien lidera el viernes 27, cuando terminen los pitches de los sponsors.`
          : e.antes ? `La plataforma para armarlo se abre el ${fechaLima(e.abre)} (hora de Lima).`
          : "El plazo para armar equipos ya cerró."}
      </p>
      {(e.abierto || e.antes) && <Link href="/equipos" className="more solid" style={{ marginTop: 14 }}>Arma tu equipo <ArrowRight aria-hidden size={14} /></Link>}
    </div>
  );
}
