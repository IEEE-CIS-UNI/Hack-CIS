import Image from "next/image";
import { TicketCountdown } from "./Countdown";
import Sil, { type SilKind } from "./silhouettes";

type Credit = { kind: SilKind; role: string; width: string };

const PEOPLE: Credit[] = [
  { kind: "man", role: "Mentor", width: "9em" },
  { kind: "womanBun", role: "Jurada", width: "11em" },
  { kind: "womanCurly", role: "Mentora", width: "8em" },
  { kind: "manBeard", role: "Jurado", width: "10em" },
  { kind: "woman", role: "Mentora", width: "12em" },
  { kind: "manSwept", role: "Mentor", width: "9.5em" },
];

const PRIZES: Credit[] = [
  { kind: "trophy", role: "Track Finanzas", width: "7em" },
  { kind: "gift", role: "Track Telco", width: "8.5em" },
  { kind: "medal", role: "Track Impacto Social", width: "6.5em" },
];

function Line({ kind, role, width }: Credit) {
  return (
    <li className="cr">
      <Sil kind={kind} />
      <span className="role">{role}</span>
      <i className="dots" aria-hidden />
      <span className="red" style={{ width }} aria-label="Por revelar" />
    </li>
  );
}

export default function DarkRoom() {
  return (
    <section id="oscuridad" className="pad film">
      <div className="letterbox t" aria-hidden />
      <div className="letterbox b" aria-hidden />
      <div className="wrap" style={{ paddingTop: 34 }}>
        <p className="kick">Hay algo en la oscuridad · CIS[HACK] UNI 2026 presenta</p>
        <h2 className="bk soon">Próximamente</h2>
        <p className="sub">Con la participación especial de</p>
        <div className="credits">
          <h3>Mentores y jurados</h3>
          <ul>
            {PEOPLE.map((c, i) => (
              <Line key={i} {...c} />
            ))}
          </ul>
          <h3>Premios</h3>
          <ul>
            {PRIZES.map((c) => (
              <Line key={c.role} {...c} />
            ))}
          </ul>
        </div>
        <TicketCountdown />
      </div>
      <div className="film-robot" aria-hidden>
        <p>¡Shhh! Es secreto</p>
        <Image src="/robot.webp" width={330} height={300} unoptimized alt="" />
      </div>
    </section>
  );
}
