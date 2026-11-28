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
            Acepta hasta <b>la mitad de los equipos</b> (máximo 40) y <b>todos construyen</b>.
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

/** El aviso del cambio de reglas (para la portada y el bootcamp). */
export default function AvisoEquipos({ enlace = true }: { enlace?: boolean }) {
  return (
    <section className="aviso-nuevo" aria-label="Novedad: todos los equipos construyen">
      <div className="wrap">
        <div className="aviso-caja">
          <Cinta />
          <p className="aviso-t">¡Todos los equipos construyen!</p>
          <p className="aviso-p">
            A pedido del público y por el gran interés, con <b>más de 350 personas registradas</b>, <b>eliminamos el filtro de 25 equipos</b>.
          </p>
          <p className="aviso-p">
            <b>112 horas:</b> del sábado 28 de noviembre a las 00:00 al miércoles 2 de diciembre a las 4:00 p. m. <b>Los 15 finalistas que hacen pitch se anuncian en la misma Gran Final</b>, el sábado 5.
          </p>
          <p className="aviso-p">
            <b>Asistencia:</b> equipos de 4, mínimo 2; de 2 o 3, mínimo 1. Provincia o extranjero, mínimo 1.
          </p>
          <p className="aviso-p">
            <b>Más tiempo para armar equipo:</b> hasta el sábado 28 a las 11:59 p. m., y eligen track hasta el domingo 29 a las 12:00 m.
          </p>
          {enlace && (
            <Link href="/bases" className="aviso-l">
              Ver las bases <ArrowRight aria-hidden size={13} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
