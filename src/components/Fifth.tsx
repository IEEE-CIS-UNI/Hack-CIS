"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { isLowPower } from "@/lib/perf";
import { useInView } from "@/lib/useInView";
import Sil, { type SilKind } from "./silhouettes";

const SCRIPTS = [
  {
    role: "code reviewer",
    lines: ["$ agente revisar --pr 12", "> analizando 14 archivos...", "> 2 bugs encontrados, 1 sugerencia", "> PR aprobado con cambios"],
  },
  {
    role: "scrum master",
    lines: ["$ agente planificar --sprint 1", "> 5 tareas · 4 integrantes · 100 h", "> riesgo: integración con la API del sponsor", "> daily programado: 9:00 pm"],
  },
  {
    role: "analista de datos",
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
    <div ref={ref} className="term">
      <div className="bar">
        <i />
        <i />
        <i />
        <span>agente@cis-hack · rol: {SCRIPTS[i].role}</span>
      </div>
      <pre aria-label={`Ejemplo: agente en rol de ${SCRIPTS[i].role}`}>
        {lines.map((l, k) => (
          <span key={k} className={l.startsWith("$") ? "p" : undefined} style={{ display: "block" }}>
            {l}
            {k === lines.length - 1 && <span className="caret" />}
          </span>
        ))}
      </pre>
    </div>
  );
}

const PEOPLE: SilKind[] = ["man", "womanBun", "manBeard", "woman"];

export default function Fifth() {
  return (
    <section id="quinto" className="pad">
      <div className="wrap">
        <span className="label">El 5.º miembro</span>
        <h2 className="h2">
          Tu equipo
          <br />
          ahora es de <span className="lav">cinco</span>
        </h2>

        <div className="five">
          <div>
            <div className="crew" role="img" aria-label="Cuatro personas y un agente de IA">
              {PEOPLE.map((k) => (
                <span key={k} data-sil={k}>
                  <Sil kind={k} />
                </span>
              ))}
              <Image src="/robot.webp" width={330} height={300} alt="" unoptimized />
            </div>
            <p className="cap">2 a 4 humanos + 1 agente de IA</p>
            <p className="lead" style={{ margin: "20px auto 0", textAlign: "center", maxWidth: "32rem" }}>
              Cada equipo suma un agente autónomo a su flujo de trabajo. No es el producto final: es parte del equipo que lo
              construye. En el Bootcamp aprendes a usar herramientas gratuitas para estudiantes.
            </p>
          </div>
          <div>
            <Terminal />
            <p className="note">Ejemplo ilustrativo de lo que hace un agente en tu equipo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
