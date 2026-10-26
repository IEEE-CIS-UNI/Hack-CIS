"use client";

/**
 * Elegir o cambiar la contraseña.
 *
 * Se usa en dos momentos: justo después de confirmar el correo, y más tarde
 * desde el panel. Es el mismo formulario porque es la misma operación: quien
 * tiene sesión abierta puede fijar su contraseña.
 *
 * Por qué una contraseña propia y no el DNI: el DNI no es secreto. Está en el
 * carné, se dicta por teléfono, se deja en recepciones. Son ocho dígitos que
 * cualquiera puede probar. Una contraseña elegida por la persona es lo único
 * que separa su ficha de quien conozca su documento.
 */

import { useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { navegador } from "@/lib/supabase";

const MINIMO = 8;

const CAMPO =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/25 focus:border-lavender";

export default function ElegirClave({
  titulo = "Elige tu contraseña",
  ayuda = "Con ella entras cuando quieras, sin esperar correos.",
  textoBoton = "Guardar contraseña",
  alTerminar,
}: {
  titulo?: string;
  ayuda?: string;
  textoBoton?: string;
  alTerminar?: () => void;
}) {
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [visible, setVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const corta = clave.length > 0 && clave.length < MINIMO;
  const distintas = repetida.length > 0 && clave !== repetida;
  const puede = clave.length >= MINIMO && clave === repetida && !guardando;

  async function guardar() {
    if (!puede) return;
    setGuardando(true);
    setAviso(null);
    try {
      const { error } = await navegador().auth.updateUser({ password: clave });
      if (error) {
        // El mensaje de Supabase viene en inglés; el caso frecuente es que la
        // contraseña sea demasiado simple para su política.
        setAviso({
          tipo: "error",
          texto: /weak|short|password/i.test(error.message)
            ? "Esa contraseña es demasiado simple. Prueba una más larga."
            : "No pudimos guardarla. Inténtalo de nuevo.",
        });
        return;
      }
      setClave("");
      setRepetida("");
      setAviso({ tipo: "ok", texto: "Listo, ya puedes entrar con ella." });
      alTerminar?.();
    } catch {
      setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <p className="hud text-lavender">{titulo}</p>
      <p className="mt-2 text-mist/70">{ayuda}</p>

      <div className="mt-5 flex flex-col gap-3">
        <div className="relative">
          <input
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            placeholder={`al menos ${MINIMO} caracteres`}
            aria-label="Contraseña"
            className={`${CAMPO} pr-12`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mist/50 transition-colors hover:text-mist"
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>

        <input
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") guardar(); }}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder="repítela"
          aria-label="Repetir contraseña"
          className={CAMPO}
        />

        {corta && <p className="text-sm text-amber-300">Te faltan {MINIMO - clave.length} caracteres.</p>}
        {distintas && <p className="text-sm text-magenta">Las dos no coinciden.</p>}
        {aviso && (
          <p className={`flex items-center gap-2 ${aviso.tipo === "ok" ? "text-glow" : "text-magenta"}`}>
            {aviso.tipo === "ok" && <Check className="size-5" aria-hidden />}
            {aviso.texto}
          </p>
        )}

        <button
          onClick={guardar}
          disabled={!puede}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-3.5 font-bold text-ink transition-colors hover:bg-lavender disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
        >
          {guardando && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {textoBoton}
        </button>
      </div>
    </div>
  );
}
