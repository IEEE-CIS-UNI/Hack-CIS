"use client";

import { useEffect, useRef, useState } from "react";
import { isLowPower } from "@/lib/perf";
import { useInView } from "@/lib/useInView";
import { PersonSilhouette, RobotSilhouette, type PersonKind } from "./silhouettes";

const SCRIPTS = [
  {
    role: "Code Reviewer",
    lines: ["$ agente revisar --pr 12", "> analizando 14 archivos...", "> 2 bugs encontrados, 1 sugerencia", "> PR aprobado con cambios"],
  },
  {
    role: "Scrum Master",
    lines: ["$ agente planificar --sprint 1", "> 5 tareas · 4 integrantes · 100 h", "> riesgo: integración con la API del sponsor", "> daily programado: 9:00 pm"],
  },
  {
    role: "Analista de Datos",
    lines: ["$ agente analizar --dataset track.csv", "> 12,480 filas · 3 anomalías", "> hallazgo: 38 % abandona en el paso 2", "> gráfico listo para el pitch"],
  },
];

const TEXTS = SCRIPTS.map((s) => s.lines.join("\n"));
const HOLD = 64;
const CYCLES = TEXTS.map((t) => t.length + HOLD);
const TOTAL = CYCLES.reduce((a, b) => a + b, 0);

function view(t: number) {
  let m = t % TOTAL;
  for (let i = 0; i < CYCLES.length; i++) {
    if (m < CYCLES[i]) return { i, n: Math.min(m, TEXTS[i].length) };
    m -= CYCLES[i];
  }
  return { i: 0, n: 0 };
}

function Terminal() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (isLowPower()) {
      const id = setTimeout(() => setT(TEXTS[0].length), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => setT((v) => v + 1), 45);
    return () => clearInterval(id);
  }, [visible]);

  const { i, n } = view(t);
  const lines = TEXTS[i].slice(0, n).split("\n");

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-white/15 bg-void/80 shadow-[0_0_50px_-20px_rgba(77,227,255,0.35)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="size-2.5 rounded-full bg-white/20" aria-hidden />
        <span className="hud ml-3 text-mist/60">agente@cis-hack · rol: {SCRIPTS[i].role}</span>
      </div>
      <pre className="min-h-44 px-5 py-5 font-mono text-[0.8rem] leading-relaxed whitespace-pre-wrap sm:text-sm" aria-label={`Ejemplo: agente en rol de ${SCRIPTS[i].role}`}>
        {lines.map((l, k) => (
          <span key={k} className={`block ${l.startsWith("$") ? "text-lavender" : "text-glow/90"}`}>
            {l}
            {k === lines.length - 1 && <span className="caret ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] bg-glow" />}
          </span>
        ))}
      </pre>
    </div>
  );
}

const PEOPLE: PersonKind[] = ["man", "womanBun", "manBeard", "woman"];

export default function Fifth() {
  return (
    <section id="quinto" className="relative px-5 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="hud text-lavender">El 5.º miembro</p>
        <h2 className="display mt-4 text-[clamp(2.6rem,8.5vw,8rem)]">
          Tu equipo
          <br />
          ahora es de <span className="text-lavender">cinco</span>
        </h2>

        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex items-end justify-center gap-[2.5%]" role="img" aria-label="Cuatro personas y un agente de IA">
              {PEOPLE.map((k) => (
                <PersonSilhouette key={k} kind={k} className="w-[17%] text-white/20" />
              ))}
              <div className="relative w-[24%] animate-float">
                <RobotSilhouette eyes className="text-violet" />
              </div>
            </div>
            <p className="hud mt-6 text-center text-mist/70">2 a 4 humanos + 1 agente de IA</p>
            <p className="mx-auto mt-6 max-w-lg text-center text-lg text-mist/85 lg:text-left">
              Cada equipo suma un agente autónomo a su flujo de trabajo. No es el producto final: es parte del equipo que lo
              construye. En el Bootcamp aprendes a usar herramientas gratuitas para estudiantes.
            </p>
          </div>

          <div>
            <Terminal />
            <p className="hud mt-3 text-mist/50">Ejemplo ilustrativo de lo que hace un agente en tu equipo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
