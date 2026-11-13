/**
 * El catálogo de carreras, tal como está en la tabla `careers`.
 *
 * La carrera ya no se escribe: se elige de una lista, y quien no está marca
 * «Otra carrera» y escribe la suya. Así «Sistemas», «Ing. de Sistemas» e
 * «Ingeniería de Sistemas» son la misma, y los equipos pueden exigir carreras
 * distintas de verdad.
 */

export type Carrera = { id: number; slug: string; name: string; field: string };

export const SLUG_OTRA = "otra";

/** Para pintar el selector por áreas: [«Computación», [carreras…]], … en el orden del catálogo. */
export function porArea(carreras: Carrera[]): [string, Carrera[]][] {
  const mapa = new Map<string, Carrera[]>();
  for (const c of carreras) mapa.set(c.field, [...(mapa.get(c.field) ?? []), c]);
  return [...mapa.entries()];
}

/** Lo que escribe quien marca «Otra carrera»: solo letras y espacios, sin repetidos, con mayúsculas. */
export function limpiarCarrera(v: unknown): string | null {
  const t = String(v ?? "")
    .replace(/[^\p{L}\s.&-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length < 3 || t.length > 60) return null;
  return t.toLocaleLowerCase("es").replace(/(^|\s)\p{L}/gu, (c) => c.toLocaleUpperCase("es"));
}

export const CICLOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
