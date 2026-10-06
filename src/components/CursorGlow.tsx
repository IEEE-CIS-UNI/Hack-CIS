"use client";

import { useEffect, useRef } from "react";
import { isFancyDesktop } from "@/lib/perf";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isFancyDesktop()) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) return;
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      el.style.transform = `translate3d(${x - 160}px, ${y - 160}px, 0)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-30 size-80 rounded-full opacity-0 transition-opacity duration-500"
      style={{ background: "radial-gradient(circle, rgba(182,156,255,0.14) 0%, rgba(139,92,246,0.05) 45%, transparent 70%)" }}
    />
  );
}
