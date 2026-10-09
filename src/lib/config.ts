export const EVENT = {
  registrationOpensAt: "2026-10-20T00:00:00-05:00",
  registrationOpensLabel: "20/10",
};

/**
 * Si ya se puede llenar el formulario. Vive aquí y no en la página porque
 * depende del reloj: una página que lo calcula en su cuerpo de render deja
 * de ser pura y React lo marca.
 */
export const registroAbierto = () => Date.now() >= Date.parse(EVENT.registrationOpensAt);

export const LINKS = {
  whatsapp: "#",
  discord: "#",
  linkedin: "#",
  instagram: "#",
  brochures: "#contacto",
};

export const HELP_VIDEO_URL = process.env.NEXT_PUBLIC_HELP_VIDEO_URL ?? "";

export const MASCOT_SRC = "/mascot.svg";
