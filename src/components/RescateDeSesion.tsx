"use client";

/**
 * Rescata una sesión que aterrizó donde no debía.
 *
 * Cuando la URL de retorno del correo no está en la lista blanca de Supabase,
 * Supabase no avisa: descarta la URL pedida y manda a la persona al Site URL,
 * que es la portada. Llega con la sesión en el fragmento y una página que no
 * sabe qué hacer con ella, así que no pasa nada y parece que el enlace está
 * roto.
 *
 * Esto lo detecta y la lleva a /bienvenida con el fragmento intacto, que es
 * donde se completa la inscripción. Es una red de seguridad, no un permiso
 * para configurar mal: lo correcto sigue siendo tener las URL de retorno en
 * Authentication → URL Configuration.
 */

import { useEffect } from "react";

export default function RescateDeSesion() {
  useEffect(() => {
    const trozo = window.location.hash;
    if (!trozo || !/access_token=|error_code=|error_description=/.test(trozo)) return;

    // replace y no push: el enlace es de un solo uso, volver atrás no sirve
    // de nada y dejaría el token en el historial.
    window.location.replace(`/bienvenida${trozo}`);
  }, []);

  return null;
}
