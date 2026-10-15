import type { Metadata } from "next";
import Countdown from "@/components/Countdown";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import StarField from "@/components/StarField";
import { LINKS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Inscripción · CIS[HACK] UNI 2026",
};

export default function RegistroPage() {
  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className="reg">
        <div className="in">
          <span className="label">Inscripción</span>
          <h1 className="h2">
            Las inscripciones
            <br />
            <span className="lav">abren pronto</span>
          </h1>
          <p className="lead">
            Aquí vivirá el formulario de inscripción. Mientras tanto, entra a la comunidad para enterarte primero.
          </p>
          <div className="cta-row" style={{ marginTop: 30 }}>
            <a className="cta" href={LINKS.whatsapp}>
              Unirme al WhatsApp
            </a>
            <Countdown />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
