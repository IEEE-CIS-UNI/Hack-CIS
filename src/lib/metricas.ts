import { track } from "@vercel/analytics";

/**
 * Eventos del embudo de inscripción (Vercel Analytics). Nunca llevan datos
 * personales: solo el nombre del paso o el plan elegido.
 */
export function evento(nombre: string, datos?: Record<string, string | number | boolean>) {
  try { track(nombre, datos); } catch { /* las métricas nunca deben romper el sitio */ }
}
