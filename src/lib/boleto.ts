/**
 * El boleto: los datos validados, firmados por el servidor.
 *
 * Por qué existe. Los datos de la inscripción viajaban pegados al usuario de
 * Supabase Auth, en sus metadatos. Pero esos metadatos solo se escriben
 * cuando el usuario NACE: si alguien se inscribe, se da cuenta de que eligió
 * mal el track y se vuelve a inscribir, Supabase manda el correo nuevo y
 * guarda los datos VIEJOS. Silenciosamente.
 *
 * Así que al enviar el formulario el servidor firma lo que validó y le da ese
 * boleto al navegador. Al volver del correo, el navegador lo devuelve y el
 * servidor comprueba la firma: si cuadra, son sus propios datos, de esta
 * inscripción, sin tocar.
 *
 * La firma es lo que hace que esto no sea confiar en el cliente. Sin la sal
 * del servidor nadie puede fabricar un boleto, y cualquier cambio de un byte
 * lo invalida. Además se comprueba que el correo del boleto sea el mismo que
 * la persona acaba de confirmar: un boleto robado no sirve en otra sesión.
 *
 * Caduca en 24 horas, igual que la paciencia para terminar un formulario.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const VIGENCIA_MS = 24 * 60 * 60 * 1000;

/**
 * Sin secreto propio cae al mismo que usa el hash del DNI, y si tampoco está
 * se lanza: un boleto firmado con una sal conocida no está firmado.
 */
function secreto() {
  const s = process.env.INSCRIPCION_SECRETO ?? process.env.DNI_PEPPER;
  if (!s) throw new Error("Falta INSCRIPCION_SECRETO (o DNI_PEPPER) en el entorno.");
  return s;
}

const b64url = (b: Buffer) => b.toString("base64url");

function firmar(cuerpo: string) {
  return createHmac("sha256", secreto()).update(cuerpo).digest("base64url");
}

/** Devuelve «datos.firma», listo para guardar en el navegador. */
export function emitirBoleto(datos: unknown) {
  const cuerpo = b64url(Buffer.from(JSON.stringify({ datos, exp: Date.now() + VIGENCIA_MS })));
  return `${cuerpo}.${firmar(cuerpo)}`;
}

export type Boleto<T> = { ok: true; datos: T } | { ok: false; motivo: string };

export function abrirBoleto<T>(boleto: unknown): Boleto<T> {
  if (typeof boleto !== "string" || !boleto.includes(".")) {
    return { ok: false, motivo: "boleto ausente o mal formado" };
  }

  const corte = boleto.lastIndexOf(".");
  const cuerpo = boleto.slice(0, corte);
  const firma = boleto.slice(corte + 1);

  // Comparación en tiempo constante: comparar firmas con === filtra el
  // secreto a quien mida cuánto tarda en fallar.
  const esperada = Buffer.from(firmar(cuerpo));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return { ok: false, motivo: "la firma no corresponde" };
  }

  try {
    const { datos, exp } = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8"));
    if (typeof exp !== "number" || Date.now() > exp) {
      return { ok: false, motivo: "el boleto venció" };
    }
    return { ok: true, datos: datos as T };
  } catch {
    return { ok: false, motivo: "el boleto no se pudo leer" };
  }
}
