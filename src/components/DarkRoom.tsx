"use client";

import { useEffect, useRef } from "react";
import { EVENT } from "@/lib/config";
import { isFancyDesktop } from "@/lib/perf";
import Sil, { type SilKind } from "./silhouettes";

const PRIZES: { kind: SilKind; label: string }[] = [
  { kind: "trophy", label: "Track Finanzas" },
  { kind: "gift", label: "Track Telco" },
  { kind: "medal", label: "Track Impacto Social" },
];

const PEOPLE: { kind: SilKind; role: string }[] = [
  { kind: "man", role: "Mentor" },
  { kind: "womanBun", role: "Jurada" },
  { kind: "womanCurly", role: "Mentora" },
  { kind: "manBeard", role: "Jurado" },
  { kind: "woman", role: "Mentora" },
  { kind: "manSwept", role: "Mentor" },
];

function Room({ lit }: { lit: boolean }) {
  return (
    <div className={`roomgrid ${lit ? "layer-lit" : "layer-dark"}`}>
      <div>
        <h4>Premios</h4>
        <ul className="g3">
          {PRIZES.map((p) => (
            <li key={p.kind}>
              <span data-sil={p.kind}>
                <Sil kind={p.kind} />
              </span>
              <b>{p.label}</b>
              <u>Por revelar</u>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Mentores y jurados</h4>
        <ul className="g6">
          {PEOPLE.map((p, i) => (
            <li key={i}>
              <span data-sil={p.kind}>
                <Sil kind={p.kind} />
              </span>
              <b>{p.role}</b>
              <u>Por revelar</u>
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
    <section id="oscuridad" className="pad dark">
      <div className="wrap">
        <span className="label">Premios y mentores</span>
        <h2 className="h2">
          Hay algo
          <br />
          en la <span className="lav">oscuridad</span>
        </h2>
        <p className="lead">
          Premios, mentores y jurados se revelan el {EVENT.registrationOpensLabel}. Mientras tanto, enciende la linterna:
          mueve el cursor o desliza el dedo.
        </p>
        <div ref={room} className="room" data-room>
          <Room lit={false} />
          <div ref={lit} className="lit" aria-hidden>
            <Room lit />
          </div>
        </div>
      </div>
    </section>
  );
}
