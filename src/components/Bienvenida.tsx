"use client";

/**
 * A donde vuelve el enlace del correo.
 *
 * Supabase deja la sesión en la URL; el cliente la detecta solo. En cuanto
 * existe, se le pide al servidor que cree la ficha y las inscripciones con los
 * datos que viajaron pegados al usuario. Hasta aquí la inscripción no existía.
 *
 * Al terminar, la persona ve su card para compartir (si entró a la hack), su
 * código de Discord y las sesiones del bootcamp en las que quedó.
 *
 * Es idempotente: recargar esta página no duplica a nadie.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, TriangleAlert } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { CLAVE_BOLETO } from "@/lib/config";
import { SESIONES } from "@/lib/contenido";
import { inscripcionHack, type Resumen } from "@/lib/resumen";
import ElegirClave from "./ElegirClave";
import TarjetaHack from "./TarjetaHack";

type Avisos = { hackLleno?: boolean; sinVerificar?: boolean; sesiones?: string[] };

type Estado =
  | { fase: "cargando"; paso: string }
  | { fase: "listo"; resumen: Resumen; avisos: Avisos }
  | { fase: "error"; motivo: string; yaInscrito?: boolean; tecnico?: string };

export default function Bienvenida() {
  const [estado, setEstado] = useState<Estado>({ fase: "cargando", paso: "abriendo tu sesión" });
  const [token, setToken] = useState<string | null>(null);
  const [claveLista, setClaveLista] = useState(false);
  // En desarrollo React monta dos veces. Este guardia hace que el alta ocurra
  // una sola vez, y es la ÚNICA defensa que necesita: no hay bandera de "sigue
  // montado" porque la limpieza del primer montaje la apagaría y el guardia
  // impediría que el segundo arrancara trabajo nuevo.
  const yaCorrio = useRef(false);

  useEffect(() => {
    if (yaCorrio.current) return;
    yaCorrio.current = true;

    (async () => {
      try {
        const sb = navegador();

        // detectSessionInUrl trabaja de forma asíncrona: si preguntamos de
        // inmediato todavía no hay sesión. Se espera al evento y, por si ya
        // había ocurrido, se consulta una vez.
        let sesion = (await sb.auth.getSession()).data.session;
        if (!sesion) {
          setEstado({ fase: "cargando", paso: "esperando el enlace del correo" });
          sesion = await new Promise((resolve) => {
            const { data } = sb.auth.onAuthStateChange((_e, s) => {
              if (s) { data.subscription.unsubscribe(); resolve(s); }
            });
            setTimeout(() => { data.subscription.unsubscribe(); resolve(null); }, 5000);
          });
        }
        if (!sesion) {
          // Cuando el enlace no sirve, Supabase explica por qué en el propio
          // fragmento de la URL. «Ya se usó», «venció» y «la URL de retorno no
          // está permitida» son tres arreglos distintos.
          const trozo = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const motivoSupabase = trozo.get("error_description") ?? trozo.get("error_code");
          const traeToken = trozo.has("access_token");
          const campos = [...trozo.keys()].join(", ") || "(ninguno)";
          console.error("[bienvenida] no hubo sesión:", { motivoSupabase, traeToken, campos });

          setEstado({
            fase: "error",
            motivo: motivoSupabase
              ? `${motivoSupabase.replace(/\+/g, " ")} Vuelve a inscribirte y te mandamos un enlace nuevo.`
              : traeToken
              ? "Recibimos el enlace pero no pudimos abrir la sesión. Pide uno nuevo."
              : "Este enlace ya se usó o venció. Vuelve a inscribirte y te mandamos uno nuevo.",
            tecnico: `enlace: ${campos}`,
          });
          return;
        }

        setToken(sesion.access_token);
        // Con tope de tiempo: una promesa sin cortar deja la pantalla girando
        // para siempre, que es justo lo que no puede pasar aquí.
        setEstado({ fase: "cargando", paso: "guardando tu inscripción" });
        const corte = new AbortController();
        const reloj = setTimeout(() => corte.abort(), 20000);
        // El boleto puede no estar: si abrió el correo en el teléfono y llenó
        // el formulario en la computadora, el servidor usa los metadatos.
        let boleto: string | null = null;
        try { boleto = localStorage.getItem(CLAVE_BOLETO); } catch { /* sin boleto se sigue igual */ }

        let datos;
        try {
          const res = await fetch("/api/completar", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${sesion.access_token}` },
            body: JSON.stringify({ boleto }),
            signal: corte.signal,
          });
          datos = await res.json();
        } finally {
          clearTimeout(reloj);
        }

        // Ya se usó: dejarlo sería guardar datos viejos en la próxima vuelta.
        if (datos.ok) { try { localStorage.removeItem(CLAVE_BOLETO); } catch { /* da igual */ } }

        if (datos.ok) {
          setEstado({ fase: "listo", resumen: datos.resumen, avisos: datos.avisos ?? {} });
        } else {
          setEstado({ fase: "error", motivo: datos.motivo, yaInscrito: datos.yaInscrito });
        }
      } catch {
        setEstado({ fase: "error", motivo: "No pudimos confirmar tu inscripción. Inténtalo de nuevo." });
      }
    })();
  }, []);

  if (estado.fase === "cargando") {
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">Confirmando</p>
        <h1 className="rg-q">Un<br /><span>segundo</span></h1>
        <p className="rg-help" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Loader2 className="size-6 animate-spin text-lavender" aria-hidden />
          {estado.paso}…
        </p>
      </div>
    );
  }

  if (estado.fase === "error") {
    return (
      <div className="rg animate-pop-in">
        <p className="rg-step">{estado.yaInscrito ? "Ya estabas" : "No pudimos"}</p>
        <h1 className="rg-q">
          {estado.yaInscrito
            ? <>Ya tienes<br /><span>tu lugar</span></>
            : <>Algo no<br /><span style={{ color: "#ff7ae6" }}>cuadra</span></>}
        </h1>
        <p className="rg-help">{estado.motivo}</p>
        {estado.tecnico && <p className="rg-small">{estado.tecnico}</p>}
        <div className="rg-actions">
          <Link href="/mi-inscripcion" className="more">Ver mi inscripción</Link>
          <Link href="/registro" className="more">Volver al formulario</Link>
        </div>
      </div>
    );
  }

  const { resumen, avisos } = estado;
  const hack = inscripcionHack(resumen);
  const sesiones = resumen.enrollments
    .filter((e) => e.slug.startsWith("bootcamp-"))
    .map((e) => SESIONES.find((s) => s.slug === e.slug))
    .filter((s): s is (typeof SESIONES)[number] => !!s);
  const primerNombre = resumen.person.display_name.split(" ")[0] ?? "";

  return (
    <div className="page-w animate-pop-in">
      <p className="rg-step" style={{ marginTop: 0 }}>Listo</p>
      <h1 className="rg-q">
        {hack ? <>Eres parte de<br /><span>HACK[CIS]</span></> : <>Ya estás<br /><span>inscrito</span></>}
      </h1>
      <p className="rg-help">
        {primerNombre && <>{primerNombre}, tu</>}{!primerNombre && <>Tu</>} lugar quedó reservado y tu correo
        está verificado. Elige una contraseña y entras a tu panel cuando quieras, sin esperar correos.
      </p>

      {avisos.hackLleno && (
        <p className="rg-msg warn box" style={{ marginTop: 22, display: "flex", gap: 10 }}>
          <TriangleAlert className="size-5 shrink-0" aria-hidden />
          Los 250 cupos de la hackathon ya se llenaron, así que no pudimos reservarte uno. Tu inscripción al bootcamp sí quedó.
        </p>
      )}
      {avisos.sinVerificar && (
        <p className="rg-msg warn box" style={{ marginTop: 22, display: "flex", gap: 10 }}>
          <TriangleAlert className="size-5 shrink-0" aria-hidden />
          Para la hackathon necesitas verificar tu identidad con tu correo institucional y tu DNI. Tu inscripción al bootcamp sí quedó.
        </p>
      )}

      {hack && (
        <div className="box" style={{ marginTop: 28 }}>
          <TarjetaHack
            persona={resumen.person}
            hack={hack}
            token={token}
            alCambiarFoto={(url) =>
              setEstado((e) => (e.fase === "listo" ? { ...e, resumen: { ...e.resumen, person: { ...e.resumen.person, photo_url: url } } } : e))
            }
          />
        </div>
      )}

      {sesiones.length > 0 && (
        <div className="box">
          <p className="box-h">Tus sesiones del bootcamp · 23 al 27 de noviembre</p>
          <ul className="rows">
            {sesiones.map((s) => (
              <li key={s.slug}>
                <div>
                  <b>{s.title}</b>
                  <small>Virtual · el horario se publica pronto</small>
                </div>
                <Link href={`/bootcamp/${s.n}`} className="pill-ok">Ver sesión <ArrowRight size={12} aria-hidden /></Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="box">
        <ElegirClave
          ayuda="Con ella entras directo a tu panel, tu card y tus sesiones."
          alTerminar={() => setClaveLista(true)}
        />
        {claveLista && (
          <p className="rg-msg ok" style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
            <Check className="size-5" aria-hidden /> Ya puedes entrar con tu correo y tu contraseña.
          </p>
        )}
      </div>

      <div className="rg-actions">
        <Link href="/mi-inscripcion" className="more solid">Ir a mi panel <ArrowRight aria-hidden size={14} /></Link>
      </div>
    </div>
  );
}
