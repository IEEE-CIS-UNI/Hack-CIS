"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HELP_VIDEO_URL } from "@/lib/config";

const isFile = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

export default function HelpVideo() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
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
      <div className="help">
        <span className="tip">¿No sabes cómo postular?</span>
        <button
          ref={triggerRef}
          type="button"
          className="orb"
          onClick={() => setOpen(true)}
          aria-label="¿No sabes cómo postular? Mira el video paso a paso"
        >
          <Image src="/robot.webp" width={330} height={300} alt="" unoptimized />
        </button>
      </div>

      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Video: cómo inscribirte" onClick={() => setOpen(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 48 }}>
            <span className="d" style={{ fontSize: "1.6rem" }}>
              Así te <span className="lav">inscribes</span>
            </span>
            <button ref={closeRef} type="button" className="x" aria-label="Cerrar video" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="frame" onClick={(e) => e.stopPropagation()}>
            <div className="vid">
              {HELP_VIDEO_URL ? (
                isFile(HELP_VIDEO_URL) ? (
                  <video src={HELP_VIDEO_URL} controls playsInline style={{ width: "100%", height: "100%" }} />
                ) : (
                  <iframe
                    src={HELP_VIDEO_URL}
                    title="Cómo inscribirte"
                    allow="fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: 0 }}
                  />
                )
              ) : (
                <>
                  <span className="d" style={{ fontSize: "2rem" }}>
                    Video paso a paso
                  </span>
                  <span style={{ color: "var(--mist)" }}>Disponible cuando abran las inscripciones.</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
