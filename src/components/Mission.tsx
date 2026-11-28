"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    title: "Bootcamp",
    when: "23 → 27 nov · virtual",
    text: "Hasta 250 personas entran. Una semana para aprender, conocerse y armar equipo.",
    count: "250",
    unit: "cupos",
  },
  {
    title: "Retos",
    when: "Vie 27 nov · 8:30 p. m.",
    text: "Los equipos escuchan los retos de los sponsors y eligen su track (hasta el domingo 29 a las 12:00 m.).",
    count: "3",
    unit: "tracks",
  },
  {
    title: "Build",
    when: "Sáb 28 nov · 00:00 → mié 2 dic · 4:00 a. m.",
    text: "Todos los equipos construyen: 100 horas con su agente de IA, con mentores y mini-retos con premios de por medio.",
    count: "100",
    unit: "horas",
  },
  {
    title: "Finalistas",
    when: "Revisión: mié 2 → vie 4 dic",
    text: "Revisamos los proyectos entregados. Los 15 finalistas, 5 por track, se anuncian el mismo sábado 5, en la Gran Final.",
    count: "15",
    unit: "finalistas",
  },
  {
    title: "Gran Final",
    when: "Sáb 5 dic · todo el día · Auditorio FIIS",
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
    <section id="mision" ref={ref} className="funnel">
      <div className="funnel-stick">
        <div className="funnel-text">
          <span className="label">La misión</span>
          <div className="count">
            <span>{STEPS[step].count}</span>
            <small>{STEPS[step].unit}</small>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className={`step ${i === step ? "is-active" : ""}`} aria-hidden={i !== step}>
                <h3>{s.title}</h3>
                <p className="when">{s.when}</p>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="pips" aria-hidden>
            {STEPS.map((s, i) => (
              <i key={s.title} className={i <= step ? "on" : ""} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
