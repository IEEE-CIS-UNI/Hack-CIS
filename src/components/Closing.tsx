"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Countdown from "./Countdown";
import Visor from "./Visor";

export default function Closing() {
  const [mood, setMood] = useState<"idle" | "happy">("idle");

  return (
    <section className="relative flex flex-col items-center px-5 pt-24 pb-28 text-center sm:px-10">
      <Visor mood={mood} />
      <h2 className="display mt-12 text-[clamp(2.8rem,9.5vw,9rem)]">
        250 lugares.
        <br />
        <span className="text-lavender">Uno es tuyo.</span>
      </h2>
      <div className="mt-9 flex flex-col items-center gap-6">
        <a
          href="/registro"
          onPointerEnter={() => setMood("happy")}
          onPointerLeave={() => setMood("idle")}
          onFocus={() => setMood("happy")}
          onBlur={() => setMood("idle")}
          className="group inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-xl font-bold text-ink shadow-[0_0_50px_-5px_rgba(182,156,255,0.8)] transition-all hover:scale-105 hover:bg-lavender"
        >
          Inscríbete
          <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" aria-hidden />
        </a>
        <Countdown />
      </div>
    </section>
  );
}
