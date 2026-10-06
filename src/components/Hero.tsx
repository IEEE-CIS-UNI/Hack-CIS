import { ArrowRight } from "lucide-react";
import AutoTyped from "./AutoTyped";
import Countdown from "./Countdown";
import LivingTitle from "./LivingTitle";

const MESSAGES = [
  "Hola. Soy tu 5to miembro. Tengo 100 horas y un reto. ¿Vienes?",
  "Cuatro humanos, un agente. Así se construye en la era agéntica.",
  "Solo 15 equipos construyen. El Bootcamp es para que seas uno de ellos.",
  "Todavía no escribes el código y ya me emociona revisarlo.",
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-svh flex-col items-center justify-center px-4 pt-20 pb-16 text-center"
    >
      <p className="hud text-mist/70">CIS[HACK] UNI 2026 · Hackathon universitario</p>

      <LivingTitle
        lines={[{ text: "THE AGENTIC" }, { text: "ERA", className: "text-lavender" }]}
        className="mt-6 text-[clamp(3rem,13.5vw,13.5rem)] leading-[0.88]"
      />

      <p className="mt-10 min-h-[4.5rem] max-w-2xl text-lg text-mist sm:min-h-[3.5rem] sm:text-xl">
        <span className="text-glow" aria-hidden>
          &gt;{" "}
        </span>
        <AutoTyped messages={MESSAGES} />
      </p>

      <div className="mt-6 flex flex-col items-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/registro"
            className="group inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 text-lg font-bold text-ink shadow-[0_0_40px_-5px_rgba(182,156,255,0.8)] transition-all hover:scale-105 hover:bg-lavender"
          >
            Inscríbete
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </a>
          <a href="#mision" className="hud px-3 py-4 text-mist/80 hover:text-white">
            Ver la misión ↓
          </a>
        </div>
        <Countdown />
      </div>
    </section>
  );
}
