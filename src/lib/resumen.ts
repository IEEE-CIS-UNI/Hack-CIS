/**
 * Lo que devuelve la función `my_overview` de la base, y cómo pedirlo.
 * Lo comparten el panel, la bienvenida y los botones de inscripción.
 */

export type Persona = {
  id: string;
  name: string;
  display_name: string;
  email: string;
  phone: string | null;
  career_id: number | null;
  career: string | null;
  career_other: string | null;
  cycle: number | null;
  level: string | null;
  affiliation: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  discord_username: string | null;
  qr_token: string;
  institution: string | null;
  verified: boolean;
};

export type Inscrito = {
  slug: string;
  number: number | null;
  code: string | null;
  redeemed: boolean;
  created_at: string;
};

export type Equipo = {
  id: string;
  name: string;
  track: string;
  track_name: string;
  is_leader: boolean;
  members: { name: string; leader: boolean }[];
};

export type Resumen = {
  person: Persona;
  enrollments: Inscrito[];
  team: Equipo | null;
};

export const estaEn = (r: Resumen | null | undefined, slug: string) =>
  !!r?.enrollments.some((e) => e.slug === slug);

export const inscripcionHack = (r: Resumen | null | undefined) =>
  r?.enrollments.find((e) => e.slug === "hack") ?? null;

/** «KQMT4821» -> «KQMT · 4821» */
export const codigoBonito = (c: string | null | undefined) =>
  c && c.length === 8 ? `${c.slice(0, 4)} · ${c.slice(4)}` : (c ?? "");

/** El número de inscrito con ceros: 42 -> «0042». */
export const numeroBonito = (n: number | null | undefined) => (n == null ? "—" : String(n).padStart(4, "0"));

/** Llama a nuestras rutas con la sesión en la cabecera. */
export async function api<T = Record<string, unknown>>(
  ruta: string,
  { metodo = "GET", cuerpo, token }: { metodo?: string; cuerpo?: unknown; token?: string | null } = {},
): Promise<{ codigo: number; datos: T & { ok?: boolean; motivo?: string; resumen?: Resumen; posicion?: number } }> {
  const res = await fetch(ruta, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  let datos;
  try { datos = await res.json(); } catch { datos = { ok: false, motivo: "Respuesta inesperada del servidor." }; }
  return { codigo: res.status, datos };
}
