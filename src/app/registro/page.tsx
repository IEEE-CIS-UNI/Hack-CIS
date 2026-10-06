import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Countdown from "@/components/Countdown";
import CursorGlow from "@/components/CursorGlow";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import Shader from "@/components/Shader";
import { ButtonLink } from "@/components/ui";
import { LINKS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Inscripción · CIS[HACK] UNI 2026",
};

export default function RegistroPage() {
  return (
    <>
      <Shader />
      <CursorGlow />
      <Nav />
      <main className="flex min-h-[85vh] items-center px-5 pt-28 pb-16 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="hud text-lavender">Inscripción</p>
          <h1 className="display mt-4 text-[clamp(2.8rem,9vw,8rem)]">
            Las inscripciones
            <br />
            <span className="text-lavender">abren pronto</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-mist/85">
            Aquí vivirá el formulario de inscripción. Mientras tanto, entra a la comunidad para enterarte primero.
          </p>
          <div className="mt-8">
            <Countdown />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={LINKS.whatsapp}>Unirme al WhatsApp</ButtonLink>
            <ButtonLink href="/" variant="ghost">
              <ArrowLeft className="size-5" aria-hidden /> Volver al inicio
            </ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
