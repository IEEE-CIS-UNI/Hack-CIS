/**
 * Enlace hacia un sponsor o aliado, marcado para que en sus analíticas se vea que la visita llegó desde la hackathon
 * (parámetros UTM). Usar junto con rel="noopener" (sin «noreferrer», que además borraría de dónde viene la visita).
 */
export function desde(url: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "hackcis.lat");
  u.searchParams.set("utm_medium", "sponsor");
  u.searchParams.set("utm_campaign", "hackcis-uni-2026");
  return u.toString();
}
