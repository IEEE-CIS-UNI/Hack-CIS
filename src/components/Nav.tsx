"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#mision", label: "La misión" },
  { href: "/#bootcamp", label: "Bootcamp" },
  { href: "/#tracks", label: "Tracks" },
  { href: "/#quinto", label: "El 5.º miembro" },
  { href: "/#granfinal", label: "Gran Final" },
  { href: "/#oscuridad", label: "Premios y mentores" },
  { href: "/#sponsors", label: "Sponsors" },
  { href: "/#comunidad", label: "Comunidad" },
  { href: "/#faq", label: "FAQ" },
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
      <header className="top">
        <Link href="/" className="logo">
          <span>
            HACK<b>[CIS]</b>
          </span>
          <small>UNI 2026</small>
        </Link>
        <div className="top-r">
          <a href="/registro" className="pill solid">
            Inscríbete
          </a>
          <button ref={openRef} type="button" className="pill line" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(true)}>
            Menú ≡
          </button>
        </div>
      </header>

      {open && (
        <div id="menu" className="overlay" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="bar">
            <span className="hud">Navegación</span>
            <button ref={closeRef} type="button" className="x" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
