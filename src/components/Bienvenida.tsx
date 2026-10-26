"use client";

/**
 * A donde vuelve el enlace del correo.
 *
 * Supabase deja la sesión en la URL; el cliente la detecta solo. En cuanto
 * existe, se le pide al servidor que cree la fila en «hackers» con los datos
 * que viajaron pegados al usuario. Hasta aquí la inscripción no existía.
 *
 * Es idempotente: recargar esta página no duplica a nadie.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { CLAVE_BOLETO, LINKS } from "@/lib/config";
import ElegirClave from "./ElegirClave";

type Estado =
  | { fase: "cargando"; paso: string }
  | { fase: "listo"; nombre: string; nuevo: boolean }
  | { fase: "error"; motivo: string; yaInscrito?: boolean; tecnico?: string };

export default function Bienvenida() {
  const [estado, setEstado] = useState<Estado>({ fase: "cargando", paso: "abriendo tu sesion" });
  const [claveLista, setClaveLista] = useState(false);
  // En desarrollo React monta dos veces. Este guardia hace que el alta ocurra
  // una sola vez, y es la ÚNICA defensa que necesita: no hay bandera de "sigue
  // montado" porque la limpieza del primer montaje la apagaría y el guardia
  // impediría que el segundo arrancara trabajo nuevo. El resultado era una
  // pantalla cargando para siempre: el único trabajo en curso tenía prohibido
  // pintar nada.
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
          // fragmento de la URL. Ignorarlo era tratar «ya se usó», «venció» y
          // «la URL de retorno no está permitida» como el mismo problema, y
          // son tres arreglos distintos.
          const trozo = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const motivoSupabase = trozo.get("error_description") ?? trozo.get("error_code");
          const traeToken = trozo.has("access_token");

          // Qué trajo el enlace, sin los valores: los nombres de los campos ya
          // dicen si vino un token, un error de Supabase, o nada.
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

        // Con tope de tiempo: una promesa sin cortar deja la pantalla girando
        // para siempre, que es justo lo que no puede pasar aquí.
        setEstado({ fase: "cargando", paso: "guardando en la base" });
        const corte = new AbortController();
        const reloj = setTimeout(() => corte.abort(), 15000);
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
          setEstado({ fase: "listo", nombre: datos.hacker?.name ?? "", nuevo: datos.nuevo });
        } else {
          // A la vista queda el motivo en castellano; el detalle técnico va a
          // la consola, donde sirve para arreglarlo y no para asustar a nadie.
          if (datos.detalle) console.error("[bienvenida] la base rechazó la inscripción:", datos.detalle);
          setEstado({ fase: "error", motivo: datos.motivo, yaInscrito: datos.yaInscrito });
        }
      } catch {
        setEstado({ fase: "error", motivo: "No pudimos confirmar tu inscripción. Inténtalo de nuevo." });
      }
    })();
  }, []);

  if (estado.fase === "cargando") {
    return (
      <div className="animate-pop-in">
        <p className="hud text-lavender">Confirmando</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">
          Un<br /><span className="text-lavender">segundo</span>
        </h1>
        <p className="mt-6 flex items-center gap-3 text-lg text-mist/85">
          <Loader2 className="size-6 animate-spin text-lavender" aria-hidden />
          {estado.paso}…
        </p>
      </div>
    );
  }

  if (estado.fase === "error") {
    return (
      <div className="animate-pop-in">
        <p className="hud text-lavender">{estado.yaInscrito ? "Ya estabas" : "No pudimos"}</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">
          {estado.yaInscrito
            ? <>Ya tienes<br /><span className="text-lavender">tu lugar</span></>
            : <>Algo no<br /><span className="text-magenta">cuadra</span></>}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-mist/85">{estado.motivo}</p>
        {estado.tecnico && (
          // Visible a propósito mientras estamos depurando: una captura de
          // pantalla basta para saber qué traía el enlace.
          <p className="hud mt-3 text-mist/40">{estado.tecnico}</p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/mi-inscripcion" className="hud rounded-full border border-white/40 px-6 py-3 text-white transition-colors hover:border-lavender hover:text-lavender">
            Ver mi inscripción
          </Link>
          <Link href="/registro" className="hud rounded-full border border-white/40 px-6 py-3 text-white transition-colors hover:border-lavender hover:text-lavender">
            Volver al formulario
          </Link>
        </div>
      </div>
    );
  }

  const primerNombre = estado.nombre.split(" ")[0] ?? "";

  return (
    <div className="animate-pop-in">
      <p className="hud text-lavender">Listo</p>
      <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">
        Eres parte de<br /><span className="text-lavender">CIS[HACK]</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-mist/85">
        {primerNombre && <>{primerNombre}, tu</>}{!primerNombre && <>Tu</>} lugar quedó reservado y tu correo
        institucional está verificado. Elige una contraseña y entras a tu panel cuando quieras,
        sin esperar correos.
      </p>

      {/* Aquí y no después: es el único momento en que ya tiene sesión abierta
          y todavía está prestando atención. Si lo dejamos para el panel, la
          mayoría se va sin ponerla y vuelve a depender del correo. */}
      <div className="glass mt-8 rounded-2xl p-6">
        <ElegirClave
          ayuda="Con ella entras directo a tu credencial y tu banner."
          alTerminar={() => setClaveLista(true)}
        />
      </div>

      {claveLista && (
        <p className="mt-6 flex items-center gap-2 text-glow">
          <Check className="size-5" aria-hidden /> Ya puedes entrar con tu correo y tu contraseña.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {LINKS.discord !== "#" && (
          <a
            href={LINKS.discord}
            className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-ink transition-colors hover:bg-lavender"
          >
            Entrar al Discord <ArrowRight className="size-5" aria-hidden />
          </a>
        )}
        <Link
          href="/mi-inscripcion"
          className="inline-flex items-center gap-3 rounded-full border border-white/40 px-8 py-4 font-bold text-white transition-colors hover:border-lavender hover:text-lavender"
        >
          Ver mi inscripción
        </Link>
      </div>
    </div>
  );
}
