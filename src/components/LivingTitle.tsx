"use client";

import { useEffect, useRef } from "react";
import { isFancyDesktop } from "@/lib/perf";

type Line = { text: string; className?: string };

export default function LivingTitle({ lines, className = "" }: { lines: Line[]; className?: string }) {
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const label = lines.map((l) => l.text).join(" ");

  useEffect(() => {
    if (!isFancyDesktop()) return;
    let raf = 0;

    const apply = (cx: number, cy: number) => {
      letters.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / 380);
        el.style.fontWeight = String(Math.round(600 + k * 300));
      });
    };
    const reset = () => {
      letters.current.forEach((el) => {
        if (el) el.style.fontWeight = "";
      });
    };
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply(e.clientX, e.clientY));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, []);

  let index = 0;
  return (
    <h1 aria-label={label} className={`display ${className}`}>
      {lines.map((line) => (
        <span key={line.text} className={`block ${line.className ?? ""}`} aria-hidden>
          {[...line.text].map((ch, i) => {
            if (ch === " ") {
              return (
                <span key={i} className="inline-block w-[0.28em]">
                  {" "}
                </span>
              );
            }
            const slot = index++;
            return (
              <span
                key={i}
                ref={(el) => {
                  letters.current[slot] = el;
                }}
                className="inline-block"
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
