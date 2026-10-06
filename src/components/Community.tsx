import { ArrowUpRight } from "lucide-react";
import { LINKS } from "@/lib/config";

const CHANNELS = [
  {
    name: "WhatsApp",
    text: "Avisos oficiales, fechas y links de las sesiones. Solo lectura, sin ruido.",
    href: LINKS.whatsapp,
  },
  {
    name: "Discord",
    text: "Material gratuito del Bootcamp para todos. Los canales de hackers se abren con tu código al inscribirte.",
    href: LINKS.discord,
  },
];

export default function Community() {
  return (
    <section id="comunidad" className="relative px-5 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="hud text-lavender">Comunidad</p>
        <h2 className="display mt-4 text-[clamp(2.6rem,8.5vw,8rem)]">
          Entra antes
          <br />
          que <span className="text-lavender">nadie</span>
        </h2>

        <div className="mt-14 border-t border-white/15">
          {CHANNELS.map((c) => (
            <a
              key={c.name}
              href={c.href}
              className="group relative flex flex-col gap-4 overflow-hidden border-b border-white/15 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10"
            >
              <span
                aria-hidden
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-violet/30 to-transparent transition-transform duration-500 group-hover:scale-x-100"
              />
              <span className="display text-[clamp(2.8rem,10vw,8rem)] transition-all duration-500 group-hover:translate-x-4 group-hover:text-lavender">
                {c.name}
              </span>
              <span className="flex items-center gap-6 sm:max-w-sm">
                <span className="text-mist/80">{c.text}</span>
                <ArrowUpRight className="size-10 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
