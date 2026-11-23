"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#mision", label: "La misión" },
  { href: "/#bootcamp", label: "Bootcamp" },
  { href: "/#tracks", label: "Tracks" },
  { href: "/#quinto", label: "El 5.º miembro" },
  { href: "/#granfinal", label: "Gran Final" },
  { href: "/#feria", label: "La feria" },
  { href: "/#premios", label: "Premios" },
  { href: "/#sponsors", label: "Sponsors" },
  { href: "/#comunidad", label: "Comunidad" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * ¿Hay una sesión iniciada en este navegador? Se lee del almacenamiento donde Supabase la guarda, sin cargar su librería
 * (el menú está en todas las páginas y la portada debe seguir liviana). En el servidor siempre es «no».
 */
function haySesion() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /^sb-.+-auth-token$/.test(k)) {
        const v = JSON.parse(localStorage.getItem(k) ?? "null");
        if (v?.refresh_token || v?.access_token) return true;
      }
    }
  } catch { /* sin almacenamiento: se muestra «Inscríbete» */ }
  return false;
}
// «storage» avisa de cambios hechos en OTRAS pestañas; la sesión que se abre o se cierra en esta misma pestaña avisa con «hackcis:sesion».
const alCambiarSesion = (aviso: () => void) => {
  window.addEventListener("storage", aviso);
  window.addEventListener("hackcis:sesion", aviso);
  return () => { window.removeEventListener("storage", aviso); window.removeEventListener("hackcis:sesion", aviso); };
};

export default function Nav() {
  const conSesion = useSyncExternalStore(alCambiarSesion, haySesion, () => false);
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
          {conSesion ? (
            <Link href="/mi-inscripcion" className="pill solid">
              Mi panel
            </Link>
          ) : (
            <a href="/registro" className="pill solid">
              Inscríbete
            </a>
          )}
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
