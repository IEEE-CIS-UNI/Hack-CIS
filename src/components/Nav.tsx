"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

const LINKS = [
  { href: "#mision", label: "La misión" },
  { href: "#tracks", label: "Tracks" },
  { href: "#quinto", label: "El 5.º miembro" },
  { href: "#oscuridad", label: "Premios y mentores" },
  { href: "#pulso", label: "Leaderboard" },
  { href: "#sponsors", label: "Sponsors" },
  { href: "#comunidad", label: "Comunidad" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = openRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-5 sm:px-8">
        <a href="#top" className="display text-xl tracking-tight">
          CIS<span className="text-lavender">[HACK]</span>
          <span className="hud ml-2 hidden text-mist/60 sm:inline">UNI 2026</span>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/registro"
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-lavender"
          >
            Inscríbete
          </a>
          <button
            ref={openRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="menu"
            className="hud flex h-10 items-center gap-2.5 rounded-full border border-white/30 bg-ink/70 px-4 hover:border-lavender"
          >
            Menú
            <span className="flex flex-col gap-[3px]" aria-hidden>
              <span className="h-px w-4 bg-white" />
              <span className="h-px w-2.5 self-end bg-white" />
            </span>
          </button>
        </div>
      </header>

      {open && (
        <div
          id="menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="animate-pop-in fixed inset-0 z-[90] overflow-y-auto bg-void/97"
        >
          <div className="mx-auto flex min-h-full max-w-6xl flex-col px-5 py-5 sm:px-8">
            <div className="flex h-12 items-center justify-between">
              <span className="hud text-mist/60">Navegación</span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex size-11 items-center justify-center rounded-full border border-white/30 hover:border-lavender"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ul className="my-auto py-10">
              {LINKS.map((l) => (
                <li key={l.href} className="border-b border-white/10">
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 py-3 sm:py-4"
                  >
                    <span className="display text-[clamp(1.8rem,7vw,4.5rem)] transition-all duration-300 group-hover:translate-x-3 group-hover:text-lavender">
                      {l.label}
                    </span>
                    <ArrowUpRight
                      className="ml-auto size-6 shrink-0 translate-y-1 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
