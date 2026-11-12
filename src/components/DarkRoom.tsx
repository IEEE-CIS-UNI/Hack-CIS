import Image from "next/image";
import { TicketCountdown } from "./Countdown";

/**
 * Jurados, mentores y premios todavía no están cerrados: la sección queda en
 * «Próximamente», sin la lista de créditos con nombres tachados.
 */
export default function DarkRoom() {
  return (
    <section id="oscuridad" className="pad film">
      <div className="letterbox t" aria-hidden />
      <div className="letterbox b" aria-hidden />
      <div className="wrap" style={{ paddingTop: 34 }}>
        <p className="kick">Hay algo en la oscuridad · HACK[CIS] UNI 2026 presenta</p>
        <h2 className="bk soon">Próximamente</h2>
        <p className="sub">Mentores, jurados y premios</p>
        <p className="film-note">Los anunciamos muy pronto.</p>
        <TicketCountdown />
      </div>
      <div className="film-robot" aria-hidden>
        <p>¡Shhh! Es secreto</p>
        <Image src="/robot.webp" width={330} height={300} unoptimized alt="" />
      </div>
    </section>
  );
}
