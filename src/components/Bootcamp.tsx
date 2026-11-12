import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TEMAS_BOOTCAMP } from "@/lib/contenido";

export default function Bootcamp() {
  return (
    <section id="bootcamp" className="pad">
      <div className="wrap bc">
        <div className="bc-info">
          <span className="label">Bootcamp</span>
          <h2 className="h2">
            Llega <span className="lav">listo</span>
          </h2>
          <p className="lead">
            Una semana de charlas y talleres con expertos para que todos arranquen el hackathon en igualdad de
            condiciones. Es virtual y está abierto a todos los inscritos.
          </p>

          <div className="bc-when">
            <b>23–27</b>
            <span>nov · virtual</span>
            <ul>
              <li>Armas tu equipo de 2 a 4 personas</li>
              <li>Cierra con el pitch de los sponsors, el 27/11</li>
              <li>Mismo material para todos</li>
            </ul>
          </div>

          <Link href="/bootcamp" className="more">
            Conoce más <ArrowRight aria-hidden size={14} />
          </Link>
        </div>

        <ul className="bc-list">
          {TEMAS_BOOTCAMP.map((t) => {
            const Icon = t.icon;
            return (
              <li key={t.title}>
                <Icon aria-hidden strokeWidth={1.6} />
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
