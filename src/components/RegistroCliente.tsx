"use client";

/**
 * El formulario se monta solo en el navegador.
 *
 * Restaura el borrador desde localStorage al primer render, y eso no puede
 * pasar en el servidor: el HTML llegaría vacío y el cliente lo pintaría
 * lleno, que es justo la discrepancia de hidratación que rompe React.
 * Nada de este formulario necesita renderizarse en el servidor.
 */

import dynamic from "next/dynamic";

const RegistroWizard = dynamic(() => import("./RegistroWizard"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-xl animate-pulse" aria-label="Cargando el formulario">
      <div className="h-1 w-full rounded-full bg-white/10" />
      <div className="mt-10 h-14 w-2/3 rounded-xl bg-white/10" />
      <div className="mt-4 h-14 w-1/2 rounded-xl bg-white/10" />
      <div className="mt-10 h-12 w-full rounded-xl bg-white/5" />
    </div>
  ),
});

export default function RegistroCliente() {
  return <RegistroWizard />;
}
