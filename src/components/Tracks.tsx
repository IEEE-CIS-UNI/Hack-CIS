"use client";

import { useState } from "react";
import { HeartHandshake, Landmark, Lock, RadioTower } from "lucide-react";
import { BuildingSilhouette } from "./silhouettes";

const TRACKS = [
  {
    icon: Landmark,
    title: "IA & Finanzas",
    community: "CIS UP",
    text: "Personalización comercial inteligente, evaluación de riesgos o asistentes de educación financiera.",
    tone: "#8b5cf6",
  },
  {
    icon: RadioTower,
    title: "IA & Telco y Operaciones",
    community: "UNI",
    text: "Automatización de procesos, atención al cliente o predicción de fallas.",
    tone: "#22c7ee",
  },
  {
    icon: HeartHandshake,
    title: "IA & Impacto Social",
    community: "DSC PUCP",
    text: "Ciberseguridad, IoT para sostenibilidad o educación.",
    tone: "#d946ef",
  },
];

export default function Tracks() {
  const [active, setActive] = useState(0);

  return (
    <section id="tracks" className="relative pt-24">
      <div className="px-5 pb-10 sm:px-10">
        <p className="hud text-lavender">Tracks</p>
        <h2 className="display mt-4 text-[clamp(2.6rem,8vw,7.5rem)]">
          Elige tu <span className="text-lavender">batalla</span>
        </h2>
        <p className="mt-5 max-w-xl text-lg text-mist/80">
          Tres sponsors, tres retos reales. Los presentan en vivo en el kickoff y tú decides en cuál competir.
        </p>
      </div>

      <div className="flex flex-col lg:h-[80svh] lg:min-h-[36rem] lg:flex-row">
        {TRACKS.map((t, i) => {
          const on = active === i;
          const Icon = t.icon;
          return (
            <article
              key={t.title}
              className="slab"
              data-active={on}
              style={{ "--tone": t.tone } as React.CSSProperties}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
            >
              <button
                type="button"
                aria-expanded={on}
                onClick={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="relative flex h-full w-full flex-col p-6 text-left sm:p-8"
              >
                <span className="flex items-start justify-between">
                  <span style={{ color: t.tone }}>
                    <Icon className="size-12 sm:size-14" aria-hidden />
                  </span>
                  <span style={{ color: t.tone }} className={`transition-opacity duration-500 ${on ? "opacity-60" : "opacity-25"}`}>
                    <BuildingSilhouette className="w-24 sm:w-32" />
                  </span>
                </span>

                <span
                  aria-hidden
                  className={`display absolute bottom-8 left-8 hidden text-2xl transition-opacity duration-300 [writing-mode:vertical-rl] lg:block ${
                    on ? "opacity-0" : "opacity-100"
                  }`}
                  style={{ rotate: "180deg" }}
                >
                  {t.title}
                </span>

                <span className="mt-auto block pt-6">
                  <span
                    className={`display block text-[clamp(1.8rem,3.4vw,3.4rem)] transition-opacity duration-300 ${
                      on ? "lg:opacity-100" : "lg:opacity-0"
                    }`}
                  >
                    {t.title}
                  </span>
                  <span
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ${
                      on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <span className="block overflow-hidden">
                      <span className="mt-4 block max-w-md text-base text-mist/85 sm:text-lg">{t.text}</span>
                      <span className="hud mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-mist/80">
                        <span>
                          Comunidad: <strong className="text-white">{t.community}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-lavender">
                          <Lock className="size-3.5" aria-hidden /> Sponsor por revelar
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
