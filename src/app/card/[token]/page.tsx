import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import StarField from "@/components/StarField";
import ConfirmarAsistencia, { type Asistencia } from "@/components/ConfirmarAsistencia";
import TarjetaHack from "@/components/TarjetaHack";
import { Video } from "lucide-react";
import { SESIONES } from "@/lib/contenido";
import { DATOS_SESION } from "@/lib/sesiones";
import { SUPABASE_CLAVE, SUPABASE_URL } from "@/lib/supabase";
import type { Persona } from "@/lib/resumen";

/**
 * Tu card y tu código de Discord, con un enlace privado y permanente.
 *
 * Existe para quien no puede entrar al panel porque su correo gasta los enlaces de un
 * solo uso antes de que los abra (pasa con varias universidades). Esta página solo
 * MUESTRA: abrirla no gasta nada, así que ningún escáner la rompe. Quien tiene el
 * enlace ve el nombre, la universidad, el número y el código de esa persona; nunca su
 * correo, celular ni DNI.
 */

export const metadata: Metadata = {
  title: "Tu card · HACK[CIS] UNI 2026",
  robots: { index: false, follow: false },   // es un enlace privado
  referrer: "no-referrer",                   // que el enlace no viaje a otros sitios al hacer clic
};

export const dynamic = "force-dynamic";

type Datos = {
  display_name: string;
  institution: string | null;
  photo_url: string | null;
  hack: { number: number; code: string | null; redeemed: boolean; espera?: boolean; posicion?: number | null } | null;
  sesiones: string[];
};

async function leer(token: string): Promise<Datos | null> {
  if (!/^[a-f0-9]{32}$/.test(token) || !SUPABASE_URL || !SUPABASE_CLAVE) return null;
  const sb = createClient(SUPABASE_URL, SUPABASE_CLAVE, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("card_por_token", { p_token: token });
  if (error || !data) return null;
  return data as Datos;
}

type EnlaceZoom = { slug: string; url: string; id: string };

/** Los enlaces de Zoom de las sesiones a las que está inscrita esa persona (y solo esas). */
async function leerEnlaces(token: string): Promise<Record<string, EnlaceZoom>> {
  if (!/^[a-f0-9]{32}$/.test(token) || !SUPABASE_URL || !SUPABASE_CLAVE) return {};
  const sb = createClient(SUPABASE_URL, SUPABASE_CLAVE, { auth: { persistSession: false } });
  const { data } = await sb.rpc("enlaces_por_token", { p_token: token });
  return Object.fromEntries(((data as EnlaceZoom[] | null) ?? []).map((e) => [e.slug, e]));
}

/** Estado de su confirmación de asistencia a la hackathon (null si el enlace no es válido). */
async function leerAsistencia(token: string): Promise<Asistencia | null> {
  if (!/^[a-f0-9]{32}$/.test(token) || !SUPABASE_URL || !SUPABASE_CLAVE) return null;
  const sb = createClient(SUPABASE_URL, SUPABASE_CLAVE, { auth: { persistSession: false } });
  const { data } = await sb.rpc("asistencia_por_token", { p_token: token });
  return (data as Asistencia | null) ?? null;
}

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await leer(token);
  const asistencia = d ? await leerAsistencia(token) : null;
  const enlaces = d ? await leerEnlaces(token) : {};

  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className="flex min-h-[85vh] items-center px-5 pt-28 pb-16 sm:px-10">
        <div className="mx-auto w-full max-w-4xl">
          {!d ? (
            <div className="rg animate-pop-in">
              <p className="rg-step">Enlace no válido</p>
              <h1 className="rg-q">No encontramos<br /><span>tu card</span></h1>
              <p className="rg-help">
                Revisa que el enlace esté completo, tal como te lo mandamos. Si sigue fallando, escríbenos y lo resolvemos.
              </p>
            </div>
          ) : (
            <div className="animate-pop-in">
              <p className="rg-step">Listo</p>
              <h1 className="rg-q">
                ¡{d.display_name.split(" ")[0]},<br />ya estás <span>inscrito</span>!
              </h1>
              <p className="rg-help">
                {d.hack
                  ? "Tu lugar en la hackathon está confirmado. Aquí tienes tu card y tu código de Discord."
                  : "Tu lugar en el bootcamp está confirmado."}
              </p>

              {d.hack && (
                <div style={{ marginTop: 26 }}>
                  <ConfirmarAsistencia modo={{ tipo: "token", token }} inicial={asistencia} />
                </div>
              )}

              {d.hack && (
                <div className="box" style={{ marginTop: 0 }}>
                  <TarjetaHack
                    persona={{
                      id: "", name: d.display_name, display_name: d.display_name, email: "", phone: null,
                      career_id: null, career: null, career_other: null, cycle: null, level: null, affiliation: null,
                      photo_url: d.photo_url, linkedin_url: null, github_url: null, discord_username: null,
                      sponsors_consent: false, qr_token: "", institution: d.institution, verified: true,
                    } satisfies Persona}
                    hack={{ slug: "hack", number: d.hack.number, code: d.hack.code, redeemed: d.hack.redeemed, created_at: "", waiting: d.hack.espera === true, position: d.hack.posicion ?? null }}
                    token={null}
                  />
                </div>
              )}

              {d.sesiones.length > 0 && (
                <div className="box" style={{ marginTop: 18 }}>
                  <p className="box-h">Tus sesiones del bootcamp</p>
                  <p style={{ margin: "0 0 14px", color: "var(--mist)", fontSize: ".92rem", lineHeight: 1.5 }}>
                    El enlace de Zoom de cada sesión está aquí. También te lo mandamos 30 minutos antes por WhatsApp, Discord y el correo de Luma.
                  </p>
                  <ul className="rows">
                    {d.sesiones.map((slug) => {
                      const s = SESIONES.find((x) => x.slug === slug);
                      const ses = s ? DATOS_SESION[s.n] : null;
                      const zoom = enlaces[slug];
                      return s ? (
                        <li key={slug} style={{ flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <b>{s.title}</b>
                            <small>{ses ? `${ses.fecha} · ${ses.horario} (hora de Lima) · virtual` : "Bootcamp · virtual"}</small>
                          </div>
                          {zoom && (
                            <a href={zoom.url} target="_blank" rel="noopener noreferrer" className="more solid" style={{ padding: "9px 16px" }}>
                              <Video aria-hidden size={15} /> Unirme en Zoom
                            </a>
                          )}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}

              <p className="rg-small" style={{ marginTop: 22 }}>
                Este enlace es solo tuyo{d.hack ? ": tiene tu código de Discord, así que no lo compartas" : ""}. Para cambiar tus datos
                o subir una foto, entra a <a href="/mi-inscripcion">tu panel</a>.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
