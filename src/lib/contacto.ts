/**
 * Contacto y redes: todo opcional, y todo guardado en un formato único.
 *
 * Quien escribe «linkedin.com/in/ana», «https://www.linkedin.com/in/ana/» o
 * «LinkedIn.com/in/Ana» termina con el mismo valor en la base. Lo mismo con
 * GitHub (acepta el usuario o la dirección) y con Discord (sin la @, en
 * minúsculas). Las funciones son puras: sirven igual en el navegador, para
 * avisar al escribir, y en el servidor, que es quien decide.
 */

export type Normalizado = { ok: true; valor: string | null } | { ok: false; motivo: string };

const vacio = (v: unknown) => String(v ?? "").trim() === "";

export function normalizarLinkedin(v: unknown): Normalizado {
  if (vacio(v)) return { ok: true, valor: null };
  let t = String(v).trim();
  if (!/^https?:\/\//i.test(t)) t = `https://${t}`;
  const m = t.match(/^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(in|company)\/([A-Za-z0-9\-_%.]+)\/?(?:[?#].*)?$/i);
  if (!m) return { ok: false, motivo: "Pega la dirección de tu perfil, como linkedin.com/in/tuusuario." };
  return { ok: true, valor: `https://www.linkedin.com/${m[1].toLowerCase()}/${m[2].toLowerCase()}` };
}

export function normalizarGithub(v: unknown): Normalizado {
  if (vacio(v)) return { ok: true, valor: null };
  let t = String(v).trim().replace(/^@/, "");
  const m = t.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?(?:[?#].*)?$/i);
  if (m) t = m[1];
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(t)) {
    return { ok: false, motivo: "Escribe tu usuario de GitHub o la dirección de tu perfil." };
  }
  return { ok: true, valor: `https://github.com/${t.toLowerCase()}` };
}

export function normalizarDiscord(v: unknown): Normalizado {
  if (vacio(v)) return { ok: true, valor: null };
  const t = String(v).trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_.]{2,32}$/.test(t)) {
    return { ok: false, motivo: "Tu usuario de Discord lleva letras, números, guion bajo o punto (sin el # ni espacios)." };
  }
  return { ok: true, valor: t };
}

/** «¿Cómo te enteraste?»: opciones fijas, para poder contar sin leer texto suelto. */
export const ORIGENES = [
  { id: "instagram", nombre: "Instagram" },
  { id: "linkedin", nombre: "LinkedIn" },
  { id: "whatsapp", nombre: "WhatsApp o amigos" },
  { id: "universidad", nombre: "Mi universidad o instituto" },
  { id: "comunidad", nombre: "Un club o comunidad" },
  { id: "otro", nombre: "Otro" },
] as const;

export type Origen = (typeof ORIGENES)[number]["id"];

export const origenValido = (v: unknown): v is Origen => ORIGENES.some((o) => o.id === v);
