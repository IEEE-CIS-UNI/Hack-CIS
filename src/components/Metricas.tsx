"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Páginas con datos de la persona: ahí Clarity enmascara todo el texto y los campos. */
const PRIVADAS = ["/registro", "/mi-inscripcion", "/bienvenida", "/auth"];

/**
 * Microsoft Clarity (gratis): mapas de calor, grabaciones y embudo. Solo se carga si
 * existe NEXT_PUBLIC_CLARITY_ID; sin esa variable no hace nada.
 */
export default function Metricas() {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID;
  const ruta = usePathname();

  useEffect(() => {
    const privada = PRIVADAS.some((p) => ruta === p || ruta.startsWith(p + "/"));
    if (privada) document.body.setAttribute("data-clarity-mask", "True");
    else document.body.removeAttribute("data-clarity-mask");
  }, [ruta]);

  if (!id) return null;
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(id)});`}
    </Script>
  );
}
