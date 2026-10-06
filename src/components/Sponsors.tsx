import { ArrowUpRight, ImageIcon } from "lucide-react";
import { LINKS } from "@/lib/config";

function Row({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="overflow-hidden">
      <div className={`flex w-max gap-5 ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-5" aria-hidden={copy === 1}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-20 w-56 items-center justify-center gap-2 rounded-xl border border-dashed border-lavender/30 text-sm text-mist/45"
              >
                <ImageIcon className="size-5" aria-hidden /> Tu logo aquí
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const ALLIES = ["IEEE CIS UNI", "DSC PUCP", "CIS UP"];

export default function Sponsors() {
  return (
    <section id="sponsors" className="relative py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-10">
        <p className="hud text-lavender">Quiénes lo hacen posible</p>
        <h2 className="display mt-4 text-[clamp(2.6rem,8.5vw,8rem)]">
          Marcas que
          <br />
          <span className="text-lavender">apuestan</span> por ti
        </h2>

        <div className="mt-14 flex flex-wrap gap-x-10 gap-y-3">
          {ALLIES.map((a) => (
            <span key={a} className="display outline-text text-[clamp(1.8rem,4.6vw,3.8rem)]">
              {a}
            </span>
          ))}
        </div>
        <p className="hud mt-3 text-mist/50">Organiza y comunidades aliadas · logos por confirmar</p>
      </div>

      <div className="mt-12 space-y-5" aria-label="Sponsors por confirmar">
        <Row />
        <Row reverse />
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-px px-5 sm:px-10 md:grid-cols-2">
        <a
          href={LINKS.brochures}
          className="group flex items-center justify-between gap-6 border-t border-white/15 py-7 md:border-b md:pr-8"
        >
          <span>
            <span className="display block text-[clamp(1.6rem,3.4vw,2.8rem)] transition-colors group-hover:text-lavender">Sé sponsor</span>
            <span className="mt-2 block max-w-sm text-mist/75">
              Patrocina un Track y ten tu stand en la mini-feria afuera del auditorio, el día de la Gran Final.
            </span>
          </span>
          <ArrowUpRight className="size-9 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
        </a>
        <a
          href={LINKS.brochures}
          className="group flex items-center justify-between gap-6 border-t border-b border-white/15 py-7 md:pl-8"
        >
          <span>
            <span className="display block text-[clamp(1.6rem,3.4vw,2.8rem)] transition-colors group-hover:text-lavender">
              Sé mentor o jurado
            </span>
            <span className="mt-2 block max-w-sm text-mist/75">
              No pedimos dinero: pedimos tu tiempo y tu criterio para guiar a los equipos y evaluar la final.
            </span>
          </span>
          <ArrowUpRight className="size-9 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
        </a>
      </div>
    </section>
  );
}
