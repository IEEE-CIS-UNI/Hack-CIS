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
    title: "Propuesta",
    when: "Vie 27 → sáb 28 nov · noche",
    text: "Los equipos escuchan los retos de los sponsors, eligen Track y entregan su propuesta.",
    count: "80",
    unit: "equipos aprox.",
  },
  {
    title: "Finalistas",
    when: "Lun 30 nov · 6:00 pm",
    text: "Pasan 15 equipos, 5 por Track. Los demás se llevan todo lo aprendido.",
    count: "15",
    unit: "equipos",
  },
  {
    title: "Build",
    when: "Lun 30 nov · 10:00 pm → sáb 5 dic",
    text: "Unas 100 horas para construir con tu agente de IA, con mentores y mini-retos con premios de por medio.",
    count: "100",
    unit: "horas",
  },
  {
    title: "Gran Final",
    when: "Sáb 5 dic · 9:00 am–5:00 pm · Auditorio CTIC",
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
