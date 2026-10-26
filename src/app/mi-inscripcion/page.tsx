import type { Metadata } from "next";
import Footer from "@/components/Footer";
import MiInscripcion from "@/components/MiInscripcion";
import Nav from "@/components/Nav";
import StarField from "@/components/StarField";

export const metadata: Metadata = {
  title: "Mi inscripción · CIS[HACK] UNI 2026",
  robots: { index: false },   // es la ficha privada de cada persona
};

export default function MiInscripcionPage() {
  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className="flex min-h-[85vh] items-center px-5 pt-28 pb-16 sm:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <MiInscripcion />
        </div>
      </main>
      <Footer />
    </>
  );
}
