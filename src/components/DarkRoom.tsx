"use client";

import { useEffect, useRef } from "react";
import { EVENT } from "@/lib/config";
import { isFancyDesktop } from "@/lib/perf";
import { PersonSilhouette, PrizeSilhouette, type PersonKind, type PrizeKind } from "./silhouettes";

const PRIZES: { kind: PrizeKind; label: string }[] = [
  { kind: "trophy", label: "Track Finanzas" },
  { kind: "gift", label: "Track Telco" },
  { kind: "medal", label: "Track Impacto Social" },
];

const PEOPLE: { kind: PersonKind; role: string }[] = [
  { kind: "man", role: "Mentor" },
  { kind: "womanBun", role: "Jurada" },
  { kind: "womanCurly", role: "Mentora" },
  { kind: "manBeard", role: "Jurado" },
  { kind: "woman", role: "Mentora" },
  { kind: "manSwept", role: "Mentor" },
];

function Room({ lit }: { lit: boolean }) {
  const shape = lit ? "text-lavender" : "text-[#1a0c38]";
  const label = lit ? "text-white" : "text-white/15";
  const head = lit ? "text-lavender" : "text-white/15";

  return (
    <div className="grid gap-14 lg:grid-cols-[0.9fr_1.5fr] lg:gap-12">
      <div>
        <p className={`hud mb-5 ${head}`}>Premios</p>
        <ul className="grid grid-cols-3 gap-4">
          {PRIZES.map((p) => (
            <li key={p.kind} className="flex flex-col items-center text-center">
              <PrizeSilhouette kind={p.kind} className={`h-28 w-auto sm:h-36 ${shape}`} />
              <span className={`hud mt-3 ${label}`}>{p.label}</span>
              <span className={`hud mt-1 ${lit ? "text-glow" : "text-white/10"}`}>Por revelar</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className={`hud mb-5 ${head}`}>Mentores y jurados</p>
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {PEOPLE.map((p, i) => (
            <li key={i} className="flex flex-col items-center text-center">
              <PersonSilhouette kind={p.kind} className={`h-28 w-auto sm:h-32 ${shape}`} />
              <span className={`hud mt-3 ${label}`}>{p.role}</span>
              <span className={`hud mt-1 ${lit ? "text-glow" : "text-white/10"}`}>Por revelar</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const beam = (x: number, y: number, r: number) =>
  `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 0%, rgba(0,0,0,0.88) 38%, transparent 100%)`;

export default function DarkRoom() {
  const room = useRef<HTMLDivElement>(null);
  const lit = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = room.current;
    const layer = lit.current;
    if (!el || !layer) return;

    const paint = (x: number, y: number, r = 230) => {
      const g = beam(x, y, r);
      layer.style.setProperty("mask-image", g);
      layer.style.setProperty("-webkit-mask-image", g);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(0, 0, 4000);
      return;
    }

    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    let lastMove = -Infinity;
    const wander = isFancyDesktop();

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pending = { x: e.clientX - r.left, y: e.clientY - r.top };
      lastMove = performance.now();
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (pending) paint(pending.x, pending.y);
        });
      }
    };

    let loop = 0;
    let lastFrame = 0;
    const tick = (now: number) => {
      loop = requestAnimationFrame(tick);
      if (now - lastFrame < 50) return;
      lastFrame = now;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || now - lastMove < 2200) return;
      const t = now / 1000;
      paint(r.width * (0.5 + 0.4 * Math.sin(t * 0.45)), r.height * (0.5 + 0.3 * Math.sin(t * 0.7 + 1)));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    if (wander) loop = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(loop);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, []);

  return (
    <section id="oscuridad" className="relative overflow-hidden bg-[#03000a] px-5 py-28 sm:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent to-[#03000a]" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <p className="hud text-lavender">Premios y mentores</p>
        <h2 className="display mt-4 text-[clamp(2.6rem,8.5vw,8rem)]">
          Hay algo
          <br />
          en la <span className="text-lavender">oscuridad</span>
        </h2>
        <p className="mt-6 max-w-xl text-lg text-mist/80">
          Premios, mentores y jurados se revelan el {EVENT.registrationOpensLabel}. Mientras tanto, enciende la linterna:
          mueve el cursor o desliza el dedo.
        </p>

        <div ref={room} className="room relative mt-16">
          <Room lit={false} />
          <div ref={lit} className="lit pointer-events-none absolute inset-0" aria-hidden>
            <Room lit />
          </div>
        </div>
      </div>
    </section>
  );
}
