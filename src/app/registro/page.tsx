import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Countdown from "@/components/Countdown";
import CursorGlow from "@/components/CursorGlow";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import RegistroCliente from "@/components/RegistroCliente";
import Shader from "@/components/Shader";
import { ButtonLink } from "@/components/ui";
import { LINKS, registroAbierto } from "@/lib/config";

export const metadata: Metadata = {
  title: "Inscripción · CIS[HACK] UNI 2026",
};

/**
 * Antes del 20/10 la página muestra la cuenta regresiva. El formulario se
 * puede abrir con ?preview para probarlo sin tocar la fecha.
 */
export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const abierto = registroAbierto() || preview !== undefined;

  return (
    <>
      <Shader />
      <CursorGlow />
      <Nav />
      <main className="flex min-h-[85vh] items-center px-5 pt-28 pb-16 sm:px-10">
        <div className="mx-auto w-full max-w-4xl">
          {abierto ? <RegistroCliente /> : <Espera />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Espera() {
  return (
    <>
      <p className="hud text-lavender">Inscripción</p>
      <h1 className="display mt-4 text-[clamp(2.8rem,9vw,8rem)]">
        Las inscripciones
        <br />
        <span className="text-lavender">abren pronto</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-mist/85">
        Entra a la comunidad para enterarte primero. Cuando abran, te inscribes con tres datos:
        DNI, correo institucional y código de estudiante.
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
    </>
  );
}
