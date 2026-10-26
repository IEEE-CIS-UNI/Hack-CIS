"use client";

/**
 * La ficha de quien ya está inscrito: verla y corregirla.
 *
 * Lo que se puede cambiar es lo que cambia en la vida real (el celular, el
 * track, el año). El nombre, el correo y la universidad están verificados y
 * se muestran como lo que son: hechos, no campos.
 *
 * Sin sesión no pide contraseña: manda un enlace al correo. Es el mismo
 * mecanismo de la inscripción, así que no hay una contraseña más que recordar
 * ni una que se pueda filtrar.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, LogIn, LogOut, Mail } from "lucide-react";
import { navegador, urlDelSitio } from "@/lib/supabase";
import Credencial from "./Credencial";
import ElegirClave from "./ElegirClave";
import { PAISES, PAIS_POR_DEFECTO, formatearE164, normalizarTelefono, paisPorCodigo } from "@/lib/telefono";

const TRACKS = [
  { id: "finanzas", titulo: "IA & Finanzas" },
  { id: "telco", titulo: "IA & Telco y Operaciones" },
  { id: "impacto_social", titulo: "IA & Impacto Social" },
] as const;

const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;

type Hacker = {
  id: string; name: string; email: string; phone: string | null;
  career: string | null; study_year: number | null; track: string | null;
  level: string | null; discord_username: string | null;
  linkedin_url: string | null; github_url: string | null;
  photo_url: string | null; badge_number: string | number | null; qr_token: string | null;
  institutions?: { name: string; short_name: string } | null;
};

type Vista =
  | { fase: "cargando" }
  | { fase: "sinSesion" }
  | { fase: "correoEnviado"; correo: string }
  | { fase: "sinInscripcion" }
  | { fase: "ficha"; hacker: Hacker };

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/5 py-4 last:border-0">
      <p className="hud text-mist/50">{etiqueta}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const ENTRADA = "rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/25 focus:border-lavender";

export default function MiInscripcion() {
  const [vista, setVista] = useState<Vista>({ fase: "cargando" });
  const [token, setToken] = useState<string | null>(null);

  // borrador de edición
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [carrera, setCarrera] = useState("");
  const [anio, setAnio] = useState("");
  const [track, setTrack] = useState("");
  const [nivel, setNivel] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const [correoEntrada, setCorreoEntrada] = useState("");
  const [claveEntrada, setClaveEntrada] = useState("");
  const [entrando, setEntrando] = useState(false);
  // La foto recién subida manda sobre la de la ficha hasta que se recargue.
  const [foto, setFoto] = useState<string | null>(null);
  const [enviandoEnlace, setEnviandoEnlace] = useState(false);

  /** Copia la ficha al formulario de edición. */
  const cargarEnFormulario = useCallback((h: Hacker) => {
    const tel = h.phone ?? "";
    const p = tel ? paisPorCodigo(tel.replace(/\D/g, "")) : null;
    setPais(p?.iso ?? PAIS_POR_DEFECTO);
    setTelefono(tel ? formatearE164(tel).replace(/^\+\d+\s/, "") : "");
    setCarrera(h.career ?? "");
    setAnio(h.study_year ? String(h.study_year) : "");
    setTrack(h.track ?? "");
    setNivel(h.level ?? "");
    setLinkedin(h.linkedin_url ?? "");
    setGithub(h.github_url ?? "");
  }, []);

  /** Pide la ficha al servidor y decide qué pantalla mostrar. */
  const cargarFicha = useCallback(async (acceso: string) => {
    setToken(acceso);
    try {
      const res = await fetch("/api/perfil", { headers: { Authorization: `Bearer ${acceso}` } });
      const datos = await res.json();
      if (datos.ok) {
        cargarEnFormulario(datos.hacker);
        setVista({ fase: "ficha", hacker: datos.hacker });
      } else if (datos.sinInscripcion) {
        setVista({ fase: "sinInscripcion" });
      } else {
        setVista({ fase: "sinSesion" });
      }
    } catch {
      setVista({ fase: "sinSesion" });
    }
  }, [cargarEnFormulario]);

  /** Entrar con correo y contraseña. */
  async function entrarConClave() {
    const correo = correoEntrada.trim().toLowerCase();
    if (!correo.includes("@") || !claveEntrada) {
      setAviso({ tipo: "error", texto: "Escribe tu correo y tu contraseña." });
      return;
    }
    setEntrando(true);
    setAviso(null);
    try {
      const { data, error } = await navegador().auth.signInWithPassword({
        email: correo,
        password: claveEntrada,
      });
      if (error || !data.session) {
        // Un mensaje igual para correo inexistente y clave errada: decir cuál
        // de los dos falló le confirma a un desconocido qué correos existen.
        setAviso({ tipo: "error", texto: "Correo o contraseña incorrectos." });
        return;
      }
      setClaveEntrada("");
      setVista({ fase: "cargando" });
      await cargarFicha(data.session.access_token);
    } catch {
      setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
    } finally {
      setEntrando(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { data } = await navegador().auth.getSession();
      if (!data.session) { setVista({ fase: "sinSesion" }); return; }
      await cargarFicha(data.session.access_token);
    })();
    // Al montar. No lleva bandera de «sigue montado»: con el guardia de
    // arriba, apagarla dejaría la pantalla cargando para siempre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pedirEnlace() {
    const correo = correoEntrada.trim().toLowerCase();
    if (!correo.includes("@")) { setAviso({ tipo: "error", texto: "Escribe tu correo institucional." }); return; }
    setEnviandoEnlace(true);
    setAviso(null);
    try {
      const sb = navegador();
      const { error } = await sb.auth.signInWithOtp({
        email: correo,
        options: { shouldCreateUser: false, emailRedirectTo: `${urlDelSitio()}/mi-inscripcion` },
      });
      if (error) {
        // shouldCreateUser: false hace que un correo no inscrito falle aquí.
        setAviso({
          tipo: "error",
          texto: /rate|seconds|limit/i.test(error.message)
            ? "Ya te mandamos un enlace hace poco. Revisa tu bandeja."
            : "No encontramos una inscripción con ese correo. ¿Te inscribiste con otro?",
        });
        return;
      }
      setVista({ fase: "correoEnviado", correo });
    } finally {
      setEnviandoEnlace(false);
    }
  }

  async function guardar() {
    if (!token) return;
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          telefono, pais, carrera, anio: Number(anio), track,
          nivel: nivel || null, linkedin, github,
        }),
      });
      const datos = await res.json();
      if (datos.ok) {
        cargarEnFormulario(datos.hacker);
        setVista({ fase: "ficha", hacker: datos.hacker });
        setAviso({ tipo: "ok", texto: "Guardado." });
      } else {
        setAviso({ tipo: "error", texto: datos.motivo ?? "No pudimos guardar los cambios." });
      }
    } catch {
      setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
    } finally {
      setGuardando(false);
    }
  }

  async function salir() {
    await navegador().auth.signOut();
    setVista({ fase: "sinSesion" });
    setToken(null);
  }

  // ── pantallas ──

  if (vista.fase === "cargando") {
    return (
      <p className="flex items-center gap-3 text-lg text-mist/85">
        <Loader2 className="size-6 animate-spin text-lavender" aria-hidden /> Cargando tu ficha…
      </p>
    );
  }

  if (vista.fase === "correoEnviado") {
    return (
      <div className="animate-pop-in">
        <p className="hud text-lavender">Enlace enviado</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">Revisa tu<br /><span className="text-lavender">correo</span></h1>
        <p className="mt-6 max-w-xl text-lg text-mist/85">
          Te mandamos un enlace a <span className="font-bold text-white">{vista.correo}</span>. Ábrelo
          desde este mismo dispositivo y entras sin contraseña.
        </p>
      </div>
    );
  }

  if (vista.fase === "sinSesion") {
    return (
      <div className="animate-pop-in">
        <p className="hud text-lavender">Tu inscripción</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">Entra a<br /><span className="text-lavender">tu panel</span></h1>
        <p className="mt-6 max-w-xl text-lg text-mist/85">
          Con el correo institucional con el que te inscribiste y la contraseña que elegiste.
        </p>
        <div className="mt-8 flex w-full max-w-md flex-col gap-3">
          <input
            value={correoEntrada}
            onChange={(e) => setCorreoEntrada(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="tu.nombre@tuuniversidad.edu.pe"
            aria-label="Correo institucional"
            className={`${ENTRADA} w-full`}
          />
          <input
            value={claveEntrada}
            onChange={(e) => setClaveEntrada(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") entrarConClave(); }}
            type="password"
            autoComplete="current-password"
            placeholder="tu contraseña"
            aria-label="Contraseña"
            className={`${ENTRADA} w-full`}
          />
          {aviso && <p className={aviso.tipo === "ok" ? "text-glow" : "text-magenta"}>{aviso.texto}</p>}
          <button
            onClick={entrarConClave}
            disabled={entrando}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-3.5 font-bold text-ink transition-colors hover:bg-lavender disabled:bg-white/20 disabled:text-white/40"
          >
            {entrando ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <LogIn className="size-5" aria-hidden />}
            Entrar
          </button>

          {/* El enlace por correo deja de ser la puerta principal y pasa a ser
              la salida de emergencia: quien olvidó su contraseña entra igual y
              la cambia desde dentro. */}
          <button
            onClick={pedirEnlace}
            disabled={enviandoEnlace}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-mist transition-colors hover:border-lavender hover:text-lavender disabled:opacity-50"
          >
            {enviandoEnlace ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
            Olvidé mi contraseña
          </button>

          <p className="hud mt-2 text-mist/40">
            ¿aún no te inscribes? <Link href="/registro" className="text-lavender underline underline-offset-4">hazlo aquí</Link>
          </p>
        </div>
      </div>
    );
  }

  if (vista.fase === "sinInscripcion") {
    return (
      <div className="animate-pop-in">
        <p className="hud text-lavender">Casi</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,8vw,6rem)]">Aún no<br /><span className="text-lavender">te inscribes</span></h1>
        <p className="mt-6 max-w-xl text-lg text-mist/85">
          Tu correo está verificado, pero falta llenar el formulario.
        </p>
        <Link href="/registro" className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-bold text-ink transition-colors hover:bg-lavender">
          Completar mi inscripción
        </Link>
      </div>
    );
  }

  const h = vista.hacker;

  return (
    <div className="animate-pop-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="hud text-lavender">Tu inscripción</p>
          <h1 className="display mt-3 text-[clamp(2rem,6vw,4rem)]">{h.name}</h1>
        </div>
        <button onClick={salir} className="hud inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-mist transition-colors hover:border-lavender hover:text-lavender">
          <LogOut className="size-4" aria-hidden /> salir
        </button>
      </div>

      <div className="mt-8">
        <Credencial
          token={token}
          datos={{
            nombre: h.name,
            track: h.track,
            universidad: h.institutions?.name ?? null,
            numero: h.badge_number != null ? String(h.badge_number) : null,
            qrToken: h.qr_token,
            foto: foto ?? h.photo_url,
          }}
          alCambiarFoto={setFoto}
        />
      </div>

      <div className="glass mt-6 rounded-2xl px-6 py-2">
        <Fila etiqueta="verificado">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-mist">
            <Check className="size-5 shrink-0 text-glow" aria-hidden />
            <span className="font-semibold text-white">{h.email}</span>
            <span className="text-mist/60">{h.institutions?.name ?? ""}</span>
          </p>
          <p className="hud mt-2 text-mist/40">nombre, correo y universidad no se pueden cambiar</p>
        </Fila>

        <Fila etiqueta="celular">
          <div className="flex gap-3">
            <select value={pais} onChange={(e) => setPais(e.target.value)} aria-label="País" className={`${ENTRADA} w-28 shrink-0`}>
              {PAISES.map((p) => (
                <option key={p.iso} value={p.iso} className="bg-[#120a24]">{p.bandera} +{p.codigo}</option>
              ))}
            </select>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" aria-label="Celular" className={`${ENTRADA} w-full`} />
          </div>
          {telefono && !normalizarTelefono(telefono, pais).ok && (
            <p className="mt-2 text-sm text-magenta">{(normalizarTelefono(telefono, pais) as { motivo: string }).motivo}</p>
          )}
        </Fila>

        <Fila etiqueta="carrera y año">
          <input value={carrera} onChange={(e) => setCarrera(e.target.value.slice(0, 80))} aria-label="Carrera" className={`${ENTRADA} w-full`} />
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((a) => (
              <button key={a} type="button" onClick={() => setAnio(String(a))} aria-pressed={anio === String(a)}
                className={`size-11 rounded-xl border font-bold transition-colors ${anio === String(a) ? "border-lavender bg-white/10 text-white" : "border-white/15 text-mist hover:border-white/40"}`}>
                {a}
              </button>
            ))}
          </div>
        </Fila>

        <Fila etiqueta="track">
          <div className="flex flex-col gap-2">
            {TRACKS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTrack(t.id)} aria-pressed={track === t.id}
                className={`rounded-xl border px-4 py-3 text-left font-semibold transition-colors ${track === t.id ? "border-lavender bg-white/10 text-white" : "border-white/15 text-mist hover:border-white/40"}`}>
                {t.titulo}
              </button>
            ))}
          </div>
        </Fila>

        <Fila etiqueta="nivel">
          <div className="flex flex-wrap gap-2">
            {NIVELES.map((n) => (
              <button key={n} type="button" onClick={() => setNivel(nivel === n ? "" : n)} aria-pressed={nivel === n}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${nivel === n ? "border-lavender bg-white/10 text-white" : "border-white/15 text-mist hover:border-white/40"}`}>
                {n}
              </button>
            ))}
          </div>
        </Fila>

        <Fila etiqueta="enlaces (opcional)">
          <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/tuusuario" aria-label="GitHub" className={`${ENTRADA} w-full`} />
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/tuusuario" aria-label="LinkedIn" className={`${ENTRADA} mt-3`} />
        </Fila>

        {h.discord_username && (
          <Fila etiqueta="discord"><p className="font-semibold text-white">{h.discord_username}</p></Fila>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={guardar}
          disabled={guardando}
          className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 font-bold text-ink transition-colors hover:bg-lavender disabled:bg-white/20 disabled:text-white/40"
        >
          {guardando && <Loader2 className="size-5 animate-spin" aria-hidden />}
          Guardar cambios
        </button>
        {aviso && <p className={aviso.tipo === "ok" ? "text-glow" : "text-magenta"}>{aviso.texto}</p>}
      </div>

      <div className="glass mt-8 rounded-2xl px-6 py-6">
        <ElegirClave
          titulo="Cambiar mi contraseña"
          ayuda="Si la olvidaste, puedes pedir un enlace al correo y cambiarla desde aquí."
          textoBoton="Cambiar contraseña"
        />
      </div>
    </div>
  );
}
