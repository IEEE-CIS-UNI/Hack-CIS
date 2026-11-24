"use client";

/**
 * Un sponsor del evento que «hace su entrada»: al llegar a la sección de sponsors, su logo aparece con un destello del color
 * de su marca (la llamita) y un globo dice a qué viene. Solo CSS más un IntersectionObserver; sin movimiento si la persona
 * pidió reducirlo.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import s from "./SponsorAnimado.module.css";

export default function SponsorAnimado({
  nombre, url, logo, mensaje, color,
}: {
  nombre: string;
  url: string;
  logo: { src: string; width: number; height: number };
  mensaje: string;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [listo, setListo] = useState(false);   // el logo se esconde recién cuando ya hay JavaScript
  const [entro, setEntro] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Solo avisa que ya cargó el JavaScript; antes de eso el logo se ve normal.
    setListo(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setEntro(true); io.disconnect(); }
    }, { threshold: 0.7 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${s.caja} ${listo ? s.listo : ""} ${entro ? s.entro : ""}`} style={{ "--marca": color } as React.CSSProperties}>
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={nombre} className={s.enlace}>
        <Image src={logo.src} width={logo.width} height={logo.height} alt={nombre} unoptimized className={s.logo} />
      </a>
      <span className={s.globo} role="note">{mensaje}</span>
    </div>
  );
}
