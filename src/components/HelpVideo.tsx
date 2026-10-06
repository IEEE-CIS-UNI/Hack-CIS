"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { HELP_VIDEO_URL, MASCOT_SRC } from "@/lib/config";

const isFile = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

export default function HelpVideo() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 sm:right-6 sm:bottom-6">
        <span className="glass relative hidden max-w-[11rem] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium sm:block">
          ¿No sabes cómo postular?
        </span>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="¿No sabes cómo postular? Mira el video paso a paso"
          className="group relative size-16 shrink-0 rounded-full"
        >
          <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-glow" aria-hidden />
          <span className="relative block size-full overflow-hidden rounded-full border-2 border-lavender bg-plum shadow-[0_0_30px_rgba(139,92,246,0.8)] transition-transform group-hover:scale-105">
            <Image
              src={MASCOT_SRC}
              alt=""
              width={400}
              height={470}
              unoptimized
              className="size-full origin-top scale-[1.9] object-cover object-top"
            />
          </span>
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Video: cómo inscribirte"
          className="animate-pop-in fixed inset-0 z-[100] flex flex-col bg-ink/97"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between px-5 py-4 sm:px-8">
            <p className="display text-lg sm:text-2xl">
              Así te <span className="text-lavender">inscribes</span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar video"
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/30 hover:border-lavender hover:text-lavender"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 pb-6 sm:px-8" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video w-[min(100%,64rem,calc((100dvh_-_8rem)*16/9))] overflow-hidden rounded-2xl border border-white/15 bg-black">
              {HELP_VIDEO_URL ? (
                isFile(HELP_VIDEO_URL) ? (
                  <video src={HELP_VIDEO_URL} controls playsInline className="size-full" />
                ) : (
                  <iframe
                    src={HELP_VIDEO_URL}
                    title="Cómo inscribirte"
                    allow="fullscreen; picture-in-picture"
                    allowFullScreen
                    className="size-full"
                  />
                )
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-4 text-center">
                  <span className="flex size-20 items-center justify-center rounded-full border border-dashed border-lavender/60 text-lavender">
                    <Play className="size-9" aria-hidden />
                  </span>
                  <p className="display text-2xl">Video paso a paso</p>
                  <p className="text-mist/70">Disponible cuando abran las inscripciones.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
