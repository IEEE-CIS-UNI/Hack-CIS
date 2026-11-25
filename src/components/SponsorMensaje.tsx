/** Un sponsor del evento con un globo de conversación que dice a qué viene. Sin animaciones. */
import Image from "next/image";
import s from "./SponsorMensaje.module.css";

export default function SponsorMensaje({
  nombre, url, logo, mensaje, color,
}: {
  nombre: string;
  url: string;
  logo: { src: string; width: number; height: number };
  mensaje: string;
  /** Color de la marca: fondo del globo (claro, para que se lea el texto oscuro). */
  color: string;
}) {
  return (
    <a href={url} target="_blank" rel="noopener" className={s.caja} style={{ "--marca": color } as React.CSSProperties}>
      <span className={s.globo}>{mensaje}</span>
      <Image src={logo.src} width={logo.width} height={logo.height} alt={nombre} unoptimized className={s.logo} />
    </a>
  );
}
