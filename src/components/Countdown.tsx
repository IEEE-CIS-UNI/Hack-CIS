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

function useCountdown() {
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

  return { open, pad, parts };
}

export function TicketCountdown() {
  const { open, pad, parts } = useCountdown();

  return (
    <div className="ticket">
      <small>{open ? "Ya en cartelera" : `Estreno · ${EVENT.registrationOpensLabel}`}</small>
      {!open && (
        <div className="cd" aria-live="off">
          {parts.map((p) => (
            <span key={p.label}>
              <b>{pad(p.value)}</b>
              <i>{p.label}</i>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Countdown() {
  const { open, pad, parts } = useCountdown();

  return (
    <div className="count-box">
      <span className="hud">{open ? "Inscripciones abiertas" : `Inscripciones abren el ${EVENT.registrationOpensLabel}`}</span>
      {!open && (
        <div className="cd" aria-live="off">
          {parts.map((p) => (
            <span key={p.label}>
              <b>{pad(p.value)}</b>
              <i>{p.label}</i>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
