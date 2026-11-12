import type { Metadata } from "next";
import Bienvenida from "@/components/Bienvenida";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import StarField from "@/components/StarField";

export const metadata: Metadata = {
  title: "Confirmando tu inscripción · HACK[CIS] UNI 2026",
  robots: { index: false },   // es la vuelta de un enlace privado
};

export default function BienvenidaPage() {
  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className="flex min-h-[85vh] items-center px-5 pt-28 pb-16 sm:px-10">
        <div className="mx-auto w-full max-w-4xl">
          <Bienvenida />
        </div>
      </main>
      <Footer />
    </>
  );
}
