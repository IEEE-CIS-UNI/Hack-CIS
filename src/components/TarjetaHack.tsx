"use client";

/**
 * La card de «ya estoy dentro» y el código de Discord.
 *
 * La card se dibuja en el navegador (ver lib/banner) y es la misma imagen que
 * se ve, se descarga y se comparte. La foto es opcional y puede ser cualquier
 * imagen que la persona prefiera; sin foto, la card lleva su primer nombre y
 * su primer apellido.
 *
 * El código (4 letras + 4 números) es privado: NO sale en la imagen que se
 * comparte. Se canjea una vez en el bot del servidor de Discord.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Copy, Download, Loader2, Share2, Trash2 } from "lucide-react";
import { navegador } from "@/lib/supabase";
import { LINKS } from "@/lib/config";
import { compartir, descargar, dibujarBanner } from "@/lib/banner";
import { api, codigoBonito, type Inscrito, type Persona } from "@/lib/resumen";

const MAX_BYTES = 3 * 1024 * 1024;

export default function TarjetaHack({
  persona,
  hack,
  token,
  alCambiarFoto,
}: {
  persona: Persona;
  hack: Inscrito;
  token: string | null;
  alCambiarFoto: (url: string | null) => void;
}) {
  // La foto recién elegida se ve al instante, antes de terminar de subirse.
  const [fotoLocal, setFotoLocal] = useState<string | null>(null);
  const foto = fotoLocal ?? persona.photo_url;

  const [vista, setVista] = useState<string | null>(null);
  const blob = useRef<Blob | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  // Redibuja cuando cambia lo que sale en la card.
  useEffect(() => {
    let vivo = true;
    let url: string | null = null;
    (async () => {
      const b = await dibujarBanner({
        nombre: persona.display_name,
        universidad: persona.institution,
        numero: hack.number,
        foto,
      });
      if (!vivo || !b) return;
      blob.current = b;
      url = URL.createObjectURL(b);
      setVista(url);
    })();
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [persona.display_name, persona.institution, hack.number, foto]);

  const subirFoto = useCallback(
    async (f: File) => {
      if (!token) return;
      if (f.size > MAX_BYTES) {
        setAviso({ tipo: "error", texto: "La imagen pesa más de 3 MB. Elige una más liviana." });
        return;
      }
      setSubiendo(true);
      setAviso(null);
      const local = URL.createObjectURL(f);
      setFotoLocal(local);
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
          upsert: true, contentType: f.type, cacheControl: "3600",
        });
        if (error) {
          setFotoLocal(null);
          setAviso({ tipo: "error", texto: "No pudimos subir la imagen. Inténtalo de nuevo." });
          return;
        }

        const { data: pub } = sb.storage.from("fotos").getPublicUrl(ruta);
        const { datos } = await api("/api/perfil", { metodo: "PATCH", token, cuerpo: { foto: pub.publicUrl } });
        if (!datos.ok) {
          setFotoLocal(null);
          setAviso({ tipo: "error", texto: datos.motivo ?? "No pudimos guardar la foto." });
          return;
        }
        // El parámetro de tiempo evita que el navegador siga mostrando la foto
        // vieja desde su caché después de reemplazarla.
        alCambiarFoto(`${pub.publicUrl}?v=${Date.now()}`);
        setFotoLocal(null);
      } catch {
        setFotoLocal(null);
        setAviso({ tipo: "error", texto: "No pudimos conectarnos. Inténtalo de nuevo." });
      } finally {
        setSubiendo(false);
        URL.revokeObjectURL(local);
      }
    },
    [token, alCambiarFoto],
  );

  async function quitarFoto() {
    if (!token) return;
    setSubiendo(true);
    const { datos } = await api("/api/perfil", { metodo: "PATCH", token, cuerpo: { foto: "" } });
    setSubiendo(false);
    if (datos.ok) { setFotoLocal(null); alCambiarFoto(null); }
    else setAviso({ tipo: "error", texto: datos.motivo ?? "No pudimos quitar la foto." });
  }

  const nombreArchivo = `hackcis-2026-${persona.display_name.split(" ")[0]?.toLowerCase() ?? "inscrito"}.png`;

  async function bajar() {
    if (blob.current) descargar(blob.current, nombreArchivo);
  }

  async function compartirCard() {
    if (!blob.current) return;
    const hecho = await compartir(
      blob.current,
      nombreArchivo,
      "¡Ya estoy dentro de HACK[CIS] UNI 2026 · The Agentic Era! hackcis.lat",
    );
    if (!hecho) descargar(blob.current, nombreArchivo);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(hack.code ?? "");
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* sin portapapeles: el código se puede leer y escribir */ }
  }

  return (
    <div className="tc">
      <div className="tc-img">
        {vista ? (
          // La card se arma en el navegador: next/image no aporta nada aquí.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vista} alt={`Tu card: ${persona.display_name}, inscrito a HACK[CIS] UNI 2026`} />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-lavender" aria-hidden />
          </div>
        )}
      </div>

      <div className="tc-side">
        <p className="box-h" style={{ marginBottom: 6 }}>Tu card</p>
        <h3>¡Compártela!</h3>
        <p>
          Sube una foto o la imagen que quieras. Si no subes ninguna, sale tu nombre y tu primer apellido.
        </p>

        <div className="tc-btns">
          <button type="button" className="more solid" onClick={() => archivo.current?.click()} disabled={subiendo}>
            {subiendo ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
            {foto ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {foto && (
            <button type="button" className="more" onClick={quitarFoto} disabled={subiendo}>
              <Trash2 className="size-4" aria-hidden /> Quitar
            </button>
          )}
        </div>
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

        <div className="tc-btns">
          <button type="button" className="more" onClick={compartirCard} disabled={!vista}>
            <Share2 className="size-4" aria-hidden /> Compartir
          </button>
          <button type="button" className="more" onClick={bajar} disabled={!vista}>
            <Download className="size-4" aria-hidden /> Descargar
          </button>
        </div>

        {aviso && <p className={`rg-msg ${aviso.tipo === "ok" ? "ok" : "err"}`} style={{ marginTop: 14 }}>{aviso.texto}</p>}

        {hack.code && (
          <div className="code" style={{ marginTop: 26 }}>
            <p className="box-h" style={{ margin: 0 }}>Tu código de Discord</p>
            <b>{codigoBonito(hack.code)}</b>
            <p>
              Es solo tuyo y se usa una vez. Pégalo en el bot del servidor de Discord de HACK[CIS] para entrar a los canales de la hack.
            </p>
            <div className="tc-btns" style={{ marginTop: 14 }}>
              <button type="button" className="more" onClick={copiar}>
                {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copiado ? "Copiado" : "Copiar código"}
              </button>
              {LINKS.discord !== "#" && (
                <a href={LINKS.discord} target="_blank" rel="noopener noreferrer" className="more solid">
                  Ir a Discord
                </a>
              )}
            </div>
            {hack.redeemed && <p className="rg-msg ok" style={{ marginTop: 10 }}>Ya lo canjeaste en Discord.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
