"use client";

/**
 * La credencial del inscrito: foto, número, QR y el banner para compartir.
 *
 * El QR lleva el «qr_token» de la fila, no el nombre ni el correo: si alguien
 * fotografía una credencial ajena solo se lleva un identificador opaco que
 * sin la base no dice nada de esa persona.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { navegador } from "@/lib/supabase";
import { dibujarBanner, descargar } from "@/lib/banner";

const TRACKS: Record<string, string> = {
  finanzas: "IA & Finanzas",
  telco: "IA & Telco y Operaciones",
  impacto_social: "IA & Impacto Social",
};

const MAX_BYTES = 3 * 1024 * 1024;

export type DatosCredencial = {
  nombre: string;
  track: string | null;
  universidad: string | null;
  numero: string | null;
  qrToken: string | null;
  foto: string | null;
};

export default function Credencial({
  datos,
  token,
  alCambiarFoto,
}: {
  datos: DatosCredencial;
  token: string | null;
  alCambiarFoto: (url: string | null) => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!datos.qrToken) return;
    QRCode.toDataURL(datos.qrToken, {
      width: 420,
      margin: 1,
      color: { dark: "#0b0118", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [datos.qrToken]);

  const subirFoto = useCallback(
    async (f: File) => {
      if (!token) return;
      if (f.size > MAX_BYTES) {
        setAviso({ tipo: "error", texto: "La imagen pesa más de 3 MB. Elige una más liviana." });
        return;
      }
      setSubiendo(true);
      setAviso(null);
      try {
        const sb = navegador();
        const { data: sesion } = await sb.auth.getUser(token);
        const uid = sesion?.user?.id;
        if (!uid) {
          setAviso({ tipo: "error", texto: "Tu sesión venció. Vuelve a entrar." });
          return;
        }

        // Nombre fijo dentro de la carpeta de la persona: subir otra foto
        // reemplaza la anterior en vez de ir dejando archivos sueltos.
        const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
        const ruta = `${uid}/perfil.${ext}`;

        const { error } = await sb.storage.from("fotos").upload(ruta, f, {
          upsert: true,
          contentType: f.type,
          cacheControl: "3600",
        });
        if (error) {
          setAviso({ tipo: "error", texto: "No pudimos subir la imagen. Inténtalo de nuevo." });
          return;
        }

        const { data: pub } = sb.storage.from("fotos").getPublicUrl(ruta);
        // El parámetro de tiempo evita que el navegador siga mostrando la
        // foto vieja desde su caché después de reemplazarla.
        const url = `${pub.publicUrl}?v=${Date.now()}`;

        const res = await fetch("/api/perfil", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ foto: pub.publicUrl }),
        });
        const r = await res.json();
        if (!r.ok) {
          setAviso({ tipo: "error", texto: r.motivo ?? "No pudimos guardar la foto." });
          return;
        }
        alCambiarFoto(url);
        setAviso({ tipo: "ok", texto: "Foto actualizada." });
      } catch {
        setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
      } finally {
        setSubiendo(false);
      }
    },
    [token, alCambiarFoto],
  );

  async function bajarBanner() {
    setBajando(true);
    setAviso(null);
    try {
      const blob = await dibujarBanner({
        nombre: datos.nombre,
        track: datos.track,
        universidad: datos.universidad,
        numero: datos.numero,
        foto: datos.foto,
      });
      if (!blob) {
        setAviso({ tipo: "error", texto: "No pudimos generar la imagen." });
        return;
      }
      descargar(blob, `cishack-2026-${datos.nombre.split(" ")[0]?.toLowerCase() ?? "inscrito"}.png`);
    } finally {
      setBajando(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-start gap-6">
        {/* foto */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => archivo.current?.click()}
            disabled={subiendo}
            aria-label={datos.foto ? "Cambiar foto" : "Subir foto"}
            className="group relative size-32 overflow-hidden rounded-full border-2 border-lavender/60 bg-white/5 transition-colors hover:border-lavender"
          >
            {datos.foto ? (
              // Imagen de un depósito externo con nombre fijo: next/image
              // querría optimizarla en el servidor y aquí no aporta nada.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={datos.foto} alt="" className="size-full object-cover" />
            ) : (
              <span className="display flex size-full items-center justify-center text-4xl text-lavender">
                {(datos.nombre[0] ?? "?").toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-ink/70 opacity-0 transition-opacity group-hover:opacity-100">
              {subiendo ? (
                <Loader2 className="size-7 animate-spin text-white" aria-hidden />
              ) : (
                <Camera className="size-7 text-white" aria-hidden />
              )}
            </span>
          </button>
          <input
            ref={archivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirFoto(f);
              e.target.value = "";
            }}
          />
          <p className="hud mt-2 text-center text-mist/40">
            {datos.foto ? "cambiar" : "subir foto"}
          </p>
        </div>

        {/* datos */}
        <div className="min-w-[12rem] flex-1">
          <p className="hud text-mist/50">inscrito n.º</p>
          <p className="display text-4xl text-white">{datos.numero ?? "—"}</p>
          {datos.track && TRACKS[datos.track] && (
            <p className="mt-3 inline-block rounded-full border border-violet/60 bg-white/5 px-4 py-1.5 text-sm font-semibold text-mist">
              {TRACKS[datos.track]}
            </p>
          )}
        </div>

        {/* QR */}
        <div className="shrink-0 text-center">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Código QR de tu credencial" className="size-32 rounded-xl bg-white p-1.5" />
          ) : (
            <div className="size-32 animate-pulse rounded-xl bg-white/10" />
          )}
          <p className="hud mt-2 text-mist/40">para el ingreso</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={bajarBanner}
          disabled={bajando}
          className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 font-bold text-ink transition-colors hover:bg-lavender disabled:bg-white/20 disabled:text-white/40"
        >
          {bajando ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Download className="size-5" aria-hidden />}
          Descargar mi banner
        </button>
        <p className="hud text-mist/40">para tus redes</p>
      </div>

      {aviso && (
        <p className={`mt-4 ${aviso.tipo === "ok" ? "text-glow" : "text-magenta"}`}>{aviso.texto}</p>
      )}
    </div>
  );
}
