import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import s from "./HeroSponsor.module.css";

/** Colores del sponsor para su hero (cada página lleva los suyos). */
export type TemaHero = {
  fondo: string;      // fondo del hero (CSS background)
  tinta: string;      // títulos y texto fuerte
  texto: string;      // párrafos
  acento: string;     // color principal (botón, detalles)
  acento2: string;    // segundo color del degradado del nombre
  cinta: string;      // color de la cinta «Track powered by»
  cintaTexto: string; // color del texto de la cinta
  botonTexto: string; // texto del botón principal
};

/**
 * El hero de la página de un track: arriba, la cinta «Track powered by» (pegada e inclinada, como la cinta de «Nuevo») y debajo
 * el logo del sponsor en grande. Todo con los colores del sponsor. Lo usan las páginas de Zeia y de Manantial.
 */
export default function HeroSponsor({
  etiqueta, nombre, url, logo, logoAncho, logoAlto, logoMostrado, tema, children, datos,
}: {
  etiqueta: string;                 // «IA & Energía»
  nombre: string;                   // «Zeia»
  url: string;
  logo: string;
  logoAncho: number;
  logoAlto: number;
  logoMostrado: number;             // ancho del logo en pantalla, en px (no más que su resolución para que no se pixele)
  tema: TemaHero;
  children: ReactNode;              // el párrafo de presentación
  datos: string[];
}) {
  const vars = {
    "--fondo": tema.fondo, "--tinta": tema.tinta, "--texto": tema.texto, "--acento": tema.acento, "--acento2": tema.acento2,
    "--cinta": tema.cinta, "--cintaTxt": tema.cintaTexto, "--btnTxt": tema.botonTexto, "--logo": `${logoMostrado}px`,
  } as CSSProperties;
  return (
    <section className={s.hero} style={vars}>
      <div className={s.in}>
        <span className={s.etiqueta}>Track {etiqueta} · HACK[CIS] UNI 2026</span>

        <a href={url} target="_blank" rel="noopener" className={s.lockup} aria-label={`Track powered by ${nombre}`}>
          <span className={s.cinta}><span>Track powered by</span></span>
          <Image src={logo} width={logoAncho} height={logoAlto} alt={nombre} unoptimized priority className={s.logo} />
        </a>

        <h1 className={s.titulo}>
          El reto de <span className={s.nombre}>{nombre}</span>
        </h1>

        <p className={s.lead}>{children}</p>

        <div className={s.acciones}>
          <a href="#unete" className={`${s.btn} ${s.principal}`}>
            Unirme a este track <ArrowRight aria-hidden size={16} />
          </a>
          <a href={url} target="_blank" rel="noopener" className={`${s.btn} ${s.borde}`}>
            Conocer {nombre} ↗
          </a>
        </div>

        <ul className={s.datos}>
          {datos.map((d) => <li key={d}>{d}</li>)}
        </ul>
      </div>
    </section>
  );
}
