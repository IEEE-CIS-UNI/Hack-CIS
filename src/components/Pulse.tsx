"use client";

import { useEffect, useRef, useState } from "react";
import { isLowPower } from "@/lib/perf";
import { useInView } from "@/lib/useInView";

const GLYPHS = "▓▒░#%&?01";

function Scramble({ length, active }: { length: number; active: boolean }) {
  const [s, setS] = useState("?".repeat(length));

  useEffect(() => {
    if (!active || isLowPower()) return;
    const id = setInterval(() => {
      setS(Array.from({ length }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(""));
    }, 170);
    return () => clearInterval(id);
  }, [length, active]);

  return <span aria-hidden>{s}</span>;
}

const ROWS = [
  { rank: "1", name: 9, bar: "82%" },
  { rank: "2", name: 7, bar: "64%" },
  { rank: "3", name: 10, bar: "48%" },
  { rank: "4", name: 8, bar: "31%" },
];

export default function Pulse() {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref);

  return (
    <section ref={ref} id="pulso" className="pad" style={{ overflowX: "clip" }}>
      <div className="wrap pulse">
        <div>
          <span className="label">Leaderboard</span>
          <h2 className="h2">
            Retos sorpresa.
            <br />
            <span className="lav">Puntos en vivo.</span>
          </h2>
          <p className="lead">
            Mientras los 15 finalistas construyen, llegan retos que nadie ve venir y la tabla se mueve en tiempo real. Es
            pública, y puedes compartir tu posición cuando vayas primero.
          </p>
        </div>

        <div className="board">
          <ol aria-label="Vista previa del leaderboard, aún bloqueada">
            {ROWS.map((r) => (
              <li key={r.rank}>
                <span className="n">{r.rank}</span>
                <div className="nm">
                  <p>
                    Equipo <Scramble length={r.name} active={visible} />
                  </p>
                  <div className="bar">
                    <i style={{ width: r.bar }} />
                  </div>
                </div>
                <span className="pt">
                  <Scramble length={3} active={visible} /> pts
                </span>
              </li>
            ))}
          </ol>
          <div className="toast" aria-hidden>
            <b>Nuevo reto sorpresa</b>+??? pts
          </div>
        </div>
      </div>
    </section>
  );
}
