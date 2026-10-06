"use client";

import { useEffect, useRef, useState } from "react";

const N = 250;
const TRACK_COLORS = ["#8b5cf6", "#4de3ff", "#d946ef"];
const TRACK_NAMES = ["Finanzas", "Telco", "Impacto social"];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Dot = { x: number; y: number; color: string; fin: boolean; win: boolean; delay: string };

function buildDots(): Dot[] {
  const rnd = mulberry32(2026);
  const teamOf: number[] = [];
  const firstOfTeam: number[] = [];
  let team = 0;
  for (let i = 0; i < N; ) {
    const size = 2 + Math.floor(rnd() * 3);
    firstOfTeam[team] = i;
    for (let k = 0; k < size && i < N; k++) teamOf[i++] = team;
    team++;
  }
  const finalist = new Set<number>();
  const winners = new Set<number>();
  for (let tr = 0; tr < 3; tr++) {
    const ids: number[] = [];
    for (let t = 0; t < team; t++) if (t % 3 === tr) ids.push(t);
    const picks = [0, 1, 2, 3, 4].map((j) => ids[Math.floor(((j + 0.5) * ids.length) / 5)]);
    picks.forEach((p) => finalist.add(p));
    winners.add(picks[2]);
  }
  const winnerDots = new Set([...winners].map((t) => firstOfTeam[t]));

  return Array.from({ length: N }, (_, i) => {
    const r = 47 * Math.sqrt((i + 0.5) / N);
    const a = i * 2.399963;
    const t = teamOf[i];
    return {
      x: Number((50 + r * Math.cos(a)).toFixed(3)),
      y: Number((50 + r * Math.sin(a)).toFixed(3)),
      color: TRACK_COLORS[t % 3],
      fin: finalist.has(t),
      win: winnerDots.has(i),
      delay: `${(rnd() * 3.6).toFixed(2)}s`,
    };
  });
}

const DOTS = buildDots();

const STEPS = [
  {
    title: "Bootcamp",
    when: "Semana previa · virtual",
    text: "250 personas entran. Una semana para aprender, conocerse y armar equipo.",
    count: "250",
    unit: "personas",
  },
  {
    title: "Propuesta",
    when: "Viernes → sábado noche",
    text: "Los equipos escuchan los retos de los sponsors, eligen Track y entregan su propuesta.",
    count: "80",
    unit: "equipos aprox.",
  },
  {
    title: "Finalistas",
    when: "Lunes · 6:00 pm",
    text: "Pasan 15 equipos, 5 por Track. Los demás se llevan todo lo aprendido.",
    count: "15",
    unit: "equipos",
  },
  {
    title: "Build",
    when: "Lunes 10:00 pm → sábado",
    text: "Unas 100 horas para construir con tu agente de IA, con retos sorpresa de por medio.",
    count: "100",
    unit: "horas",
  },
  {
    title: "Gran Final",
    when: "Sábado · 3:00–8:00 pm · Auditorio CTIC",
    text: "Pitch y demo frente al jurado. Un ganador por Track.",
    count: "3",
    unit: "ganadores",
  },
];

export default function Mission() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const calc = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    raf = requestAnimationFrame(calc);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="mision" ref={ref} className="relative" style={{ height: "560svh" }}>
      <div className="sticky top-0 flex h-svh flex-col items-center gap-2 px-5 pt-20 pb-6 sm:px-10 lg:flex-row lg:gap-10 lg:pt-16">
        <div className="relative z-10 w-full max-w-xl lg:w-1/2">
          <p className="hud text-lavender">La misión</p>

          <div className="mt-3 flex items-baseline gap-3 sm:mt-6">
            <span className="display text-[clamp(4.5rem,15vw,11rem)] [text-shadow:0_0_60px_rgba(139,92,246,0.55)]">
              {STEPS[step].count}
            </span>
            <span className="hud text-mist/80">{STEPS[step].unit}</span>
          </div>

          <div className="mt-2 grid sm:mt-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                aria-hidden={i !== step}
                className={`[grid-area:1/1] transition-all duration-500 ${
                  i === step ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                }`}
              >
                <h2 className="display text-[clamp(1.9rem,4.4vw,3.6rem)]">
                  {s.title}
                </h2>
                <p className="hud mt-2 text-glow">{s.when}</p>
                <p className="mt-3 max-w-md text-base text-mist/85 sm:text-lg">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.title} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? "w-9 bg-lavender" : "w-4 bg-white/20"}`} />
            ))}
          </div>

          <div className={`hud mt-4 flex flex-wrap gap-x-5 gap-y-1 text-mist/80 transition-opacity duration-500 ${step >= 1 ? "opacity-100" : "opacity-0"}`} aria-hidden>
            {TRACK_NAMES.map((n, i) => (
              <span key={n} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: TRACK_COLORS[i] }} />
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-1 items-center justify-center lg:w-1/2">
          <div
            className="dots w-[min(84vw,46svh)] lg:w-[min(44vw,76svh)]"
            data-step={step + 1}
            role="img"
            aria-label="Visualización: de 250 personas se pasa a 15 equipos finalistas y 3 ganadores"
          >
            {DOTS.map((d, i) => (
              <span
                key={i}
                className={`dot ${d.fin ? "fin" : ""} ${d.win ? "win" : ""}`}
                style={{ left: `${d.x}%`, top: `${d.y}%`, "--c": d.color, "--d": d.delay } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
