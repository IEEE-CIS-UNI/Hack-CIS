"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Share2 } from "lucide-react";
import { isLowPower } from "@/lib/perf";
import { useInView } from "@/lib/useInView";

const GLYPHS = "▓▒░#%&?01";

function Scramble({ length, active }: { length: number; active: boolean }) {
  const [s, setS] = useState("?".repeat(length));

  useEffect(() => {
    if (!active || isLowPower()) return;
    const id = setInterval(() => {
      setS(Array.from({ length }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(""));
    }, 160);
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
    <section ref={ref} id="pulso" className="relative overflow-x-clip px-5 py-28 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="hud text-lavender">Leaderboard</p>
          <h2 className="display mt-4 text-[clamp(2.6rem,7.5vw,6.5rem)]">
            Retos sorpresa.
            <br />
            <span className="text-lavender">Puntos en vivo.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-mist/85">
            Mientras los 15 finalistas construyen, llegan retos que nadie ve venir y la tabla se mueve en tiempo real. Es
            pública, y puedes compartir tu posición cuando vayas primero.
          </p>
          <p className="hud mt-6 flex items-center gap-2 text-mist/60">
            <Share2 className="size-4" aria-hidden /> Se abre cuando empieza el build
          </p>
        </div>

        <div className="relative">
          <ol className="divide-y divide-white/10 border-y border-white/10" aria-label="Vista previa del leaderboard, aún bloqueada">
            {ROWS.map((r) => (
              <li key={r.rank} className="flex items-center gap-4 py-4 sm:gap-6 sm:py-5">
                <span className="display outline-text w-[1.1em] text-center text-[clamp(2.2rem,5vw,4rem)]">{r.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="hud truncate text-white">
                    Equipo <Scramble length={r.name} active={visible} />
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet to-glow opacity-70" style={{ width: r.bar }} />
                  </div>
                </div>
                <span className="hud text-mist/60">
                  <Scramble length={3} active={visible} /> pts
                </span>
              </li>
            ))}
          </ol>

          <div
            aria-hidden
            className="animate-toast absolute -top-6 right-0 flex items-center gap-3 rounded-xl border border-glow/40 bg-void px-4 py-3 sm:-right-4"
          >
            <Bell className="size-5 text-glow" />
            <div>
              <p className="hud text-glow">Nuevo reto sorpresa</p>
              <p className="hud text-white/70">+??? pts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
