"use client";

import { useEffect, useRef } from "react";
import { isLowPower } from "@/lib/perf";

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const low = isLowPower();

    const draw = () => {
      const w = (canvas.width = canvas.clientWidth);
      const h = (canvas.height = canvas.clientHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx || !w || !h) return;
      const r = rng(77);
      const n = Math.min(low ? 90 : 190, Math.round((w * h) / 9000));
      const tones = ["255,255,255", "255,255,255", "214,196,255", "182,156,255", "170,230,255"];
      for (let i = 0; i < n; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = 0.4 + r() * r() * 1.5;
        ctx.fillStyle = `rgba(${tones[(r() * tones.length) | 0]},${(0.35 + r() * 0.6).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, 6.2832);
        ctx.fill();
      }
      const flares = low ? 5 : 11;
      for (let j = 0; j < flares; j++) {
        const fx = r() * w;
        const fy = r() * h;
        const L = 4 + r() * 8;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, L * 2.2);
        g.addColorStop(0, "rgba(214,196,255,.55)");
        g.addColorStop(1, "rgba(214,196,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx, fy, L * 2.2, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.95)";
        ctx.beginPath();
        ctx.moveTo(fx - L, fy);
        ctx.quadraticCurveTo(fx, fy, fx, fy - L);
        ctx.quadraticCurveTo(fx, fy, fx + L, fy);
        ctx.quadraticCurveTo(fx, fy, fx, fy + L);
        ctx.quadraticCurveTo(fx, fy, fx - L, fy);
        ctx.fill();
      }
    };

    draw();
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(draw, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="bgstars" aria-hidden />;
}
