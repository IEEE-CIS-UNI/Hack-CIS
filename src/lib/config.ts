export const EVENT = {
  registrationOpensAt: "2026-11-13T00:00:00-05:00",
  registrationOpensLabel: "13/11",
};

/**
 * Si ya se puede llenar el formulario. Vive aquí y no en la página porque
 * depende del reloj: una página que lo calcula en su cuerpo de render deja
 * de ser pura y React lo marca.
 */
export const registroAbierto = () => Date.now() >= Date.parse(EVENT.registrationOpensAt);

/**
 * Los «#» son los que aún no existen, no un descuido. La interfaz los trata
 * como ausentes: /bienvenida esconde el botón de Discord mientras siga así,
 * en vez de ofrecer un enlace que no lleva a ningún lado.
 */
export const LINKS = {
  whatsapp: "#",
  discord: "#",
  // Sin el ?xtok=: ese parámetro es un testigo de quien compartió el enlace,
  // no parte de la dirección del perfil.
  linkedin: "https://www.linkedin.com/company/ieee-cis-uni/",
  instagram: "https://www.instagram.com/ieeecisuni",
  brochures: "#contacto",
};

/**
 * WhatsApp de relaciones públicas de IEEE CIS UNI, para sponsors, mentores y
 * jurados. El mensaje sale escrito de antemano para que quien escribe diga de
 * dónde viene.
 */
const WA_RRPP = "51948223332";
export const waRRPP = (mensaje: string) => `https://wa.me/${WA_RRPP}?text=${encodeURIComponent(mensaje)}`;
export const WA_SPONSOR = waRRPP(
  "Hola, vi en la web de HACK[CIS] UNI 2026 que puedo ser sponsor y quisiera más información."
);
export const WA_MENTOR = waRRPP(
  "Hola, vi en la web de HACK[CIS] UNI 2026 que puedo postular como mentor o jurado y quisiera más información."
);

export const HELP_VIDEO_URL = process.env.NEXT_PUBLIC_HELP_VIDEO_URL ?? "";

/**
 * Donde el navegador guarda el boleto firmado entre que se envia el
 * formulario y se vuelve del correo. Lo escribe el formulario y lo lee
 * /bienvenida, por eso vive aqui y no dentro de ninguno de los dos.
 */
export const CLAVE_BOLETO = "cishack-boleto-v1";
