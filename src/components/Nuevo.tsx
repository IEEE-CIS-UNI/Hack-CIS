import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * La cinta «NUEVO»: una tira de cinta adhesiva amarilla, un poco chueca, con los bordes
 * rasgados, como pegada sobre lo que cambió. Sin emojis: es solo CSS (ver .cinta en globals.css).
 */
export function Cinta({ children = "Nuevo", chica = false }: { children?: React.ReactNode; chica?: boolean }) {
  return (
    <span className={`cinta${chica ? " chica" : ""}`} aria-label="Nuevo">
      <span>{children}</span>
    </span>
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
