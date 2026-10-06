import { ExternalLink, Mail } from "lucide-react";
import { LINKS } from "@/lib/config";

export default function Footer() {
  return (
    <footer id="contacto" className="relative overflow-hidden border-t border-white/10 px-5 pt-12 pb-32 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xs text-sm text-mist/70">
          Organizado por IEEE CIS UNI, en alianza con DSC PUCP y CIS Universidad del Pacífico.
        </p>
        <div className="hud flex flex-col gap-3 text-mist/80">
          <span className="inline-flex items-center gap-2">
            <Mail className="size-4" aria-hidden /> [correo de contacto]
          </span>
          <a href={LINKS.linkedin} className="inline-flex items-center gap-2 hover:text-white">
            LinkedIn <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <a href={LINKS.instagram} className="inline-flex items-center gap-2 hover:text-white">
            Instagram <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
      <p aria-hidden className="display outline-text mt-12 text-center text-[clamp(3rem,15.5vw,15rem)] leading-none whitespace-nowrap">
        CIS[HACK]
      </p>
      <p className="hud mt-4 text-center text-mist/40">© 2026 CIS[HACK] UNI · The Agentic Era</p>
    </footer>
  );
}
