/**
 * Utilidades de la plataforma de equipos (/equipos): habilidades, mensajes de error y una llamada a la base que devuelve el
 * motivo ya traducido. Toda la lógica vive en las funciones de la base (supabase/024-equipos-libres.sql); aquí solo se llaman.
 */
import { navegador } from "@/lib/supabase";

/**
 * Cuándo está abierta la plataforma de equipos. Son las mismas fechas que `equipos_config` en la base (migración 024), que es
 * la que manda: esto solo sirve para mostrar la cuenta regresiva a quien todavía no inició sesión. Si se cambian, cambiar las dos.
 */
export const EQUIPOS_ABRE = "2026-11-25T20:00:00-05:00";
export const EQUIPOS_CIERRA = "2026-11-26T23:59:59-05:00";

export const HABILIDADES = [
  { id: "frontend", et: "Frontend" },
  { id: "backend", et: "Backend" },
  { id: "datos_ia", et: "Datos e IA" },
  { id: "diseno", et: "Diseño" },
  { id: "negocio", et: "Negocio" },
  { id: "pitch", et: "Pitch" },
  { id: "movil", et: "Móvil" },
  { id: "devops", et: "Nube / DevOps" },
] as const;

export const etiquetaHabilidad = (id: string) => HABILIDADES.find((h) => h.id === id)?.et ?? id;

const ERRORES: Record<string, string> = {
  sin_sesion: "Entra con tu cuenta para continuar.",
  sin_perfil: "No encontramos tu inscripción. Entra a tu panel y complétala.",
  equipos_cerrados: "La plataforma de equipos no está abierta en este momento.",
  no_elegible: "Para formar equipo necesitas tener tu lugar en la hackathon confirmado.",
  ya_tiene_equipo: "Ya estás en un equipo. Para unirte a otro, primero sal del tuyo (o elimínalo si eres líder).",
  ya_te_pidio: "Esa persona ya pidió unirse a tu equipo: respóndele en «Solicitudes e invitaciones».",
  ya_te_invito: "Ese equipo ya te invitó: acepta la invitación que aparece arriba.",
  sin_equipo: "Todavía no estás en un equipo.",
  no_lider: "Solo la persona líder del equipo puede hacer esto.",
  equipo_lleno: "El equipo ya tiene 4 integrantes.",
  equipo_incompleto: "El equipo necesita al menos 2 integrantes.",
  equipo_inexistente: "Ese equipo ya no está disponible.",
  nombre_invalido: "El nombre del equipo debe tener entre 3 y 40 caracteres.",
  nombre_repetido: "Ya existe un equipo con ese nombre. Elige otro.",
  descripcion_larga: "La descripción puede tener hasta 240 caracteres.",
  invitacion_invalida: "Esa invitación ya no está disponible.",
  ya_invitado: "Ya hay una invitación o solicitud pendiente.",
  persona_no_disponible: "Esa persona ya no está disponible (tiene equipo o no tiene su lugar confirmado).",
  track_inexistente: "Ese track no está disponible.",
  track_aun_no: "Todavía no se abre la elección de track.",
  track_cerrado: "La elección de track ya cerró.",
  track_lleno: "Este track ya llegó a su tope de equipos. Elige otro.",
  url_invalida: "Revisa el enlace: debe empezar con https:// (y el grupo de WhatsApp con https://chat.whatsapp.com/).",
  habilidad_invalida: "Elige hasta 5 habilidades de la lista.",
  frase_larga: "La frase puede tener hasta 140 caracteres.",
  idea_larga: "La idea puede tener hasta 1500 caracteres.",
};

export const motivoDe = (mensaje: string) => {
  const clave = Object.keys(ERRORES).find((k) => new RegExp(`\\b${k}\\b`).test(mensaje));
  return clave ? ERRORES[clave] : "No pudimos completar la acción. Inténtalo de nuevo en un momento.";
};

/** Llama a una función de la base con la sesión de quien mira y devuelve el dato o el motivo en español. */
export async function llamar<T = unknown>(fn: string, params?: Record<string, unknown>): Promise<{ ok: true; data: T } | { ok: false; motivo: string }> {
  try {
    const { data, error } = await navegador().rpc(fn, params);
    if (error) return { ok: false, motivo: motivoDe(error.message) };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, motivo: "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo." };
  }
}

// ───────── tipos de lo que devuelve la base ─────────
export type EstadoEquipos = {
  abre: string; cierra: string; abierto: boolean; puede: boolean; tiene_equipo: boolean;
  motivo: "ok" | "sin_perfil" | "no_inscrito" | "en_espera" | "sin_confirmar";
  perfil: { buscando: boolean; habilidades: string[]; frase: string | null };
};
export type PersonaBusca = {
  id: string; nombre: string; universidad: string | null; universidad_nombre: string | null; carrera: string | null; area: string | null;
  ciclo: number | null; nivel: string | null; habilidades: string[]; frase: string | null;
};
export type EquipoAbierto = {
  id: string; nombre: string; descripcion: string | null; buscando: string[]; n: number; pedido: boolean;
  miembros: { nombre: string; universidad: string | null; lider: boolean }[];
};
export type Pendientes = {
  recibidas: { id: string; equipo: string; equipo_id: string; n: number; descripcion: string | null; lider: string }[];
  enviadas: { id: string; equipo: string; equipo_id: string }[];
  solicitudes: { id: string; persona_id: string; nombre: string; universidad: string | null; carrera: string | null; ciclo: number | null; nivel: string | null; habilidades: string[]; frase: string | null }[];
  invitadas: { id: string; persona_id: string; nombre: string }[];
};
export type Miembro = {
  id: string; nombre: string; lider: boolean; yo: boolean; universidad: string | null; carrera: string | null; ciclo: number | null;
  correo: string | null; celular: string | null; discord: string | null; linkedin: string | null; github: string | null; habilidades: string[];
};
export type MiEquipoDetalle = {
  id: string; nombre: string; descripcion: string | null; buscando: string[]; abierto: boolean; soy_lider: boolean; n: number;
  track: null | { slug: string; nombre: string; sponsor: string | null; abre: string | null; cierra: string | null };
  whatsapp_url: string | null; repo_url: string | null; slides_url: string | null; idea: string | null; miembros: Miembro[];
};
