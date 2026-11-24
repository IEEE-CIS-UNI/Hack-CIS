import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * La cinta «NUEVO»: una tira de cinta adhesiva amarilla, un poco chueca, con los bordes
 * rasgados, como pegada sobre lo que cambió. Sin emojis: es solo CSS (ver .cinta en globals.css).
 */
export function Cinta({ children = "Nuevo", chica = false, atencion = false }: { children?: React.ReactNode; chica?: boolean; atencion?: boolean }) {
  return (
    <span className={`cinta${chica ? " chica" : ""}${atencion ? " atencion" : ""}`} aria-label={atencion ? "Atención" : "Nuevo"}>
      <span>{children}</span>
    </span>
  );
}

/** «ATENCIÓN»: se revela el tercer track, el track dorado, gracias a Millennium. */
export function AvisoTrackDorado() {
  return (
    <section className="aviso-nuevo" aria-label="Atención: nuevo track dorado">
      <div className="wrap">
        <div className="aviso-caja dorada">
          <Cinta atencion>Atención</Cinta>
          <p className="aviso-t">Revelamos el tercer track: <span className="oro">el track dorado</span></p>
          <p className="aviso-p">
            Gracias a <b>Millennium</b>, <b>Fintech</b> es el track dorado: <b>S/ 1 000</b> para el equipo ganador y una{" "}
            <b>carta oferta para cada integrante</b> para entrar a trabajar en Millennium, con una entrevista de por medio.
          </p>
          <p className="aviso-p">
            Acepta hasta <b>40 equipos</b> y <b>15 pasan a construir</b>: más lugares para tu idea.
          </p>
          <Image src="/logos/millennium-blanco.png" width={640} height={274} alt="Millennium" unoptimized className="aviso-logo" />
          <Link href="/tracks/fintech" className="aviso-l">
            Conocer el track dorado <ArrowRight aria-hidden size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** El aviso del cambio de regla de equipos (para la portada y el bootcamp). */
export default function AvisoEquipos({ enlace = true }: { enlace?: boolean }) {
  return (
    <section className="aviso-nuevo" aria-label="Novedad: equipos">
      <div className="wrap">
        <div className="aviso-caja">
          <Cinta />
          <p className="aviso-t">A pedido de ustedes</p>
          <p className="aviso-p">
            Ya <b>no es obligatorio</b> que tu equipo tenga carreras o facultades distintas. Armen su equipo, de 2 a 4
            personas, con quienes quieran. <b>¡Aprovechen el bootcamp para formar equipos!</b>
          </p>
          <p className="aviso-p">
            <b>La plataforma de equipos abre el miércoles 25 de noviembre a las 10:00 p. m.</b> y cierra el jueves 26 a las 11:59 p. m.
          </p>
          {enlace && (
            <Link href="/equipos" className="aviso-l">
              Ver cuándo abre <ArrowRight aria-hidden size={13} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
