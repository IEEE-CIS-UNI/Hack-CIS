/** Reglas de la apertura en vivo de la elección de track (ver components/AperturaTrack). */
export const PRESENTACION = "viernes 27 de noviembre a las 8:30 p. m.";

/** Si falta una hora o menos, la organización ya la lanzó (la hora de respaldo queda mucho más lejos). */
export const lanzada = (abre: string, ahora: number) => {
  const falta = Date.parse(abre) - ahora;
  return falta > 0 && falta <= 60 * 60_000;
};

const PRESENTACION_MS = Date.parse("2026-11-27T20:30:00-05:00");

/** Cada cuánto preguntar a la base: seguido solo alrededor de la presentación, para no cargarla antes. */
export const preguntarCada = (abre: string, ahora: number) => {
  const cerca = ahora > PRESENTACION_MS - 45 * 60_000;
  const base = lanzada(abre, ahora) ? 30_000 : cerca ? 15_000 : 10 * 60_000;
  return base + Math.random() * 5_000;
};
