import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import StarField from "@/components/StarField";
import s from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página perdida en el espacio · HACK[CIS] UNI 2026",
  robots: { index: false },
};

/** La 404: el robot en la base espacial, con un «?» sobre la cabeza, buscando una página que se perdió. */
export default function NotFound() {
  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className={s.main}>
        <p className="pg-kick">Error 404</p>
        <h1 className={`bk ${s.cuatro}`}>404</h1>
        <p className={s.titulo}>Esta página se perdió en el espacio</p>
        <p className={s.texto}>
          Ni el robot la encuentra. Puede que el enlace esté mal escrito o que la página ya no exista. Mientras
          tanto, la base sigue en pie: volvamos al inicio.
        </p>

        <div className={s.escena} aria-hidden>
          <div className={s.duda}>
            <span>?</span>
          </div>
          <Image src="/scene.webp" width={1190} height={607} alt="" unoptimized priority className={s.img} />
        </div>

        <div className={s.acciones}>
          <Link href="/" className="cta">
            Volver al inicio <ArrowRight aria-hidden size={18} />
          </Link>
          <Link href="/mi-inscripcion" className="more">Mi inscripción</Link>
          <Link href="/bases" className="more">Las bases</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
