"use client";

import { useSyncExternalStore } from "react";
import { EVENT } from "@/lib/config";

let snapshot = 0;

function subscribe(onChange: () => void) {
  snapshot = Math.floor(Date.now() / 1000);
  onChange();
  const id = setInterval(() => {
    snapshot = Math.floor(Date.now() / 1000);
    onChange();
  }, 1000);
  return () => clearInterval(id);
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => 0;

const target = Math.floor(new Date(EVENT.registrationOpensAt).getTime() / 1000);

export default function Countdown({ className = "" }: { className?: string }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = now > 0;
  const left = Math.max(0, target - now);
  const open = ready && left === 0;
  const pad = (v: number) => (ready ? String(v).padStart(2, "0") : "--");

  const parts = [
    { label: "d", value: Math.floor(left / 86400) },
    { label: "h", value: Math.floor((left % 86400) / 3600) },
    { label: "m", value: Math.floor((left % 3600) / 60) },
    { label: "s", value: left % 60 },
  ];

  return (
    <div className={`hud flex items-center gap-3 text-mist/80 ${className}`}>
      <span className="led size-1.5 rounded-full bg-magenta" aria-hidden />
      {open ? (
        <span>Inscripciones abiertas</span>
      ) : (
        <>
          <span>Abren el {EVENT.registrationOpensLabel}</span>
          <span className="flex gap-2 text-white tabular-nums" aria-live="off">
            {parts.map((p) => (
              <span key={p.label}>
                {pad(p.value)}
                <span className="text-lavender">{p.label}</span>
              </span>
            ))}
          </span>
        </>
      )}
    </div>
  );
}
