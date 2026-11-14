/**
 * La card para compartir.
 *
 * Se dibuja en el navegador de quien la comparte: ni un servidor generando
 * imágenes ni una cola de trabajos. Cuesta cero y sale al instante. La misma
 * imagen que se ve en pantalla es la que se descarga o se comparte.
 *
 * Formato 1080×1350, que es el retrato de Instagram y el que menos recorta
 * cuando se sube a cualquier otro lado.
 *
 * Con foto: la foto ocupa de la mitad hacia arriba y se disuelve hacia abajo,
 * y el nombre se apoya donde ya se fue. Sin foto: el nombre
 * (primer nombre y primer apellido) ocupa el centro, grande, con la sombra
 * apilada del título del sitio.
 */

export type DatosBanner = {
  /** Primer nombre y primer apellido. */
  nombre: string;
  universidad: string | null;
  numero: number | null;
  foto: string | null;
};

const ANCHO = 1080;
const ALTO = 1350;

/**
 * La familia tipográfica tal como next/font la resolvió.
 *
 * next/font genera nombres con sufijos irrepetibles, así que escribirlos a
 * mano no sirve: se leen de la variable CSS que ya puso en <html>.
 */
function familia(variable: string, respaldo: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v || respaldo;
}

/** Carga una imagen y espera a que esté lista para dibujarse. */
function cargarImagen(url: string, cruzada: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Sin esto el canvas queda «sucio» y toBlob falla: la foto vive en otro
    // dominio (el depósito de Supabase) y el navegador lo bloquea.
    if (cruzada) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Reduce la letra hasta que el texto quepa en el ancho dado. */
function ajustar(ctx: CanvasRenderingContext2D, texto: string, fuente: (px: number) => string, maxAncho: number, desde: number, hasta: number) {
  let px = desde;
  ctx.font = fuente(px);
  while (px > hasta && ctx.measureText(texto).width > maxAncho) {
    px -= 4;
    ctx.font = fuente(px);
  }
  return px;
}

/** Texto con la sombra apilada violeta del título del sitio. */
function conSombra(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, px: number) {
  const paso = Math.max(2, px * 0.012);
  for (let i = 10; i >= 1; i--) {
    ctx.fillStyle = i > 5 ? "#4d17c2" : "#7a2cf5";
    ctx.fillText(texto, x + i * paso, y + i * paso);
  }
  ctx.fillStyle = "#ececf3";
  ctx.fillText(texto, x, y);
}

export async function dibujarBanner(datos: DatosBanner): Promise<Blob | null> {
  const lienzo = document.createElement("canvas");
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return null;

  const antonio = familia("--font-antonio", "Impact, sans-serif");
  const michroma = familia("--font-michroma", "monospace");

  // Las fuentes del sitio se cargan por demanda: si se dibuja antes de que
  // estén listas, el canvas usa la de respaldo y la card sale con otra letra.
  try {
    await Promise.all([
      document.fonts.load(`700 80px ${antonio}`),
      document.fonts.load(`20px ${michroma}`),
    ]);
  } catch { /* se dibuja con lo que haya */ }

  // ── fondo ──
  ctx.fillStyle = "#08030f";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  const nebulosa1 = ctx.createRadialGradient(ANCHO * 0.85, -80, 0, ANCHO * 0.85, -80, 900);
  nebulosa1.addColorStop(0, "rgba(122,44,245,0.55)");
  nebulosa1.addColorStop(1, "rgba(122,44,245,0)");
  ctx.fillStyle = nebulosa1;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  const nebulosa2 = ctx.createRadialGradient(-60, ALTO * 0.55, 0, -60, ALTO * 0.55, 800);
  nebulosa2.addColorStop(0, "rgba(217,70,239,0.2)");
  nebulosa2.addColorStop(1, "rgba(217,70,239,0)");
  ctx.fillStyle = nebulosa2;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Estrellas con posiciones fijas: si fueran al azar, dos cards del mismo
  // evento se verían distintas sin motivo.
  ctx.fillStyle = "#ffffff";
  let semilla = 7;
  for (let i = 0; i < 90; i++) {
    semilla = (semilla * 9301 + 49297) % 233280;
    const x = (semilla / 233280) * ANCHO;
    semilla = (semilla * 9301 + 49297) % 233280;
    const y = (semilla / 233280) * ALTO;
    semilla = (semilla * 9301 + 49297) % 233280;
    const r = 0.6 + (semilla / 233280) * 1.8;
    ctx.globalAlpha = 0.25 + (semilla / 233280) * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const img = datos.foto ? await cargarImagen(datos.foto, !datos.foto.startsWith("blob:") && !datos.foto.startsWith("data:")) : null;

  // ── la escena: cohete y robot, abajo ──
  const escena = await cargarImagen("/scene.webp", false);
  if (escena) {
    const alto = (escena.height / escena.width) * ANCHO;
    // Con foto, la escena baja y se atenúa: el texto va encima y debe leerse.
    ctx.globalAlpha = img ? 0.4 : 1;
    ctx.drawImage(escena, 0, ALTO - alto + (img ? 110 : 70), ANCHO, alto);
    ctx.globalAlpha = 1;
  }
  const velo = ctx.createLinearGradient(0, ALTO - 520, 0, ALTO);
  velo.addColorStop(0, "rgba(8,3,15,0)");
  velo.addColorStop(0.7, "rgba(8,3,15,0.35)");
  velo.addColorStop(1, "rgba(8,3,15,0.9)");
  ctx.fillStyle = velo;
  ctx.fillRect(0, ALTO - 520, ANCHO, 520);

  // ── la foto: ocupa de la mitad hacia arriba y se disuelve hacia abajo ──
  if (img) {
    const H = 980;
    const capa = document.createElement("canvas");
    capa.width = ANCHO;
    capa.height = H;
    const c2 = capa.getContext("2d");
    if (c2) {
      // «cover»: llena todo el ancho sin deformar, y sube un poco el encuadre
      // porque en un retrato la cara queda en el tercio de arriba.
      const k = Math.max(ANCHO / img.width, H / img.height);
      const w = img.width * k, h = img.height * k;
      c2.drawImage(img, (ANCHO - w) / 2, -(h - H) * 0.28, w, h);
      // Máscara: opaca arriba, transparente abajo; lo que hay detrás (estrellas,
      // nebulosa, escena) aparece donde la foto se va.
      c2.globalCompositeOperation = "destination-in";
      const m = c2.createLinearGradient(0, 0, 0, H);
      m.addColorStop(0, "rgba(0,0,0,1)");
      m.addColorStop(0.42, "rgba(0,0,0,1)");
      m.addColorStop(0.66, "rgba(0,0,0,0.6)");
      m.addColorStop(0.86, "rgba(0,0,0,0.16)");
      m.addColorStop(1, "rgba(0,0,0,0)");
      c2.fillStyle = m;
      c2.fillRect(0, 0, ANCHO, H);
      c2.globalCompositeOperation = "source-over";
      ctx.drawImage(capa, 0, 0);

      // Tinte violeta que crece hacia abajo, para que la foto sea de la marca.
      const tinte = ctx.createLinearGradient(0, 260, 0, H);
      tinte.addColorStop(0, "rgba(77,23,194,0)");
      tinte.addColorStop(0.55, "rgba(77,23,194,0.36)");
      tinte.addColorStop(1, "rgba(77,23,194,0)");   // termina en cero: sin borde duro
      ctx.fillStyle = tinte;
      ctx.fillRect(0, 260, ANCHO, H - 260);
    }
    // Sombra arriba, para que «HACK[CIS]» se lea sobre cualquier foto.
    const arriba = ctx.createLinearGradient(0, 0, 0, 300);
    arriba.addColorStop(0, "rgba(8,3,15,0.7)");
    arriba.addColorStop(1, "rgba(8,3,15,0)");
    ctx.fillStyle = arriba;
    ctx.fillRect(0, 0, ANCHO, 300);
  }

  // ── cabecera: el nombre del evento, con UNI 2026 debajo, centrado ──
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 92px ${antonio}`;
  const w1 = ctx.measureText("HACK").width;
  const w2 = ctx.measureText("[CIS]").width;
  const x0 = ANCHO / 2 - (w1 + w2) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("HACK", x0, 140);
  ctx.fillStyle = "#b69cff";
  ctx.fillText("[CIS]", x0 + w1, 140);
  ctx.textAlign = "center";
  ctx.fillStyle = "#d9ccff";
  ctx.font = `22px ${michroma}`;
  ctx.fillText("U N I   2 0 2 6", ANCHO / 2, 190);

  // ── el anuncio ──
  ctx.fillStyle = "#4de3ff";
  ctx.font = `22px ${michroma}`;
  ctx.fillText("Y A   E S T O Y   D E N T R O", ANCHO / 2, img ? 668 : 275);

  const partes = datos.nombre.trim().toUpperCase().split(/\s+/);
  const nombre = partes[0] ?? "";
  const apellido = partes.slice(1).join(" ");
  let y: number;

  if (img) {
    // ── con foto: el nombre se apoya donde la foto ya se disolvió ──
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(8,3,15,0.65)";
    ctx.shadowBlur = 24;
    const px = ajustar(ctx, nombre, (p) => `700 ${p}px ${antonio}`, ANCHO - 140, 150, 80);
    ctx.fillText(nombre, ANCHO / 2, 815);
    ctx.fillStyle = "#b69cff";
    ctx.font = `700 ${Math.round(px * 0.62)}px ${antonio}`;
    ctx.fillText(apellido, ANCHO / 2, 815 + Math.round(px * 0.68));
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    y = 815 + Math.round(px * 0.68) + 62;
  } else {
    // ── sin foto: el nombre es la card ──
    const px = ajustar(ctx, nombre, (p) => `700 ${p}px ${antonio}`, ANCHO - 200, 280, 110);
    ctx.font = `700 ${px}px ${antonio}`;
    conSombra(ctx, nombre, ANCHO / 2, 560, px);
    if (apellido) {
      const px2 = ajustar(ctx, apellido, (p) => `700 ${p}px ${antonio}`, ANCHO - 200, Math.round(px * 0.7), 70);
      ctx.fillStyle = "#b69cff";
      ctx.fillText(apellido, ANCHO / 2, 560 + px2 * 0.95);
      y = 560 + px2 * 0.95 + 70;
    } else {
      y = 640;
    }
  }

  if (datos.universidad) {
    ctx.fillStyle = "#d9ccff";
    ctx.font = `34px ${antonio}`;
    ctx.fillText(datos.universidad.toUpperCase(), ANCHO / 2, y);
    y += 58;
  }

  // ── número de inscrito ──
  if (datos.numero != null) {
    const etiqueta = `INSCRITO N.º ${String(datos.numero).padStart(4, "0")}`.split("").join(" ");
    ctx.font = `22px ${michroma}`;
    const ancho = ctx.measureText(etiqueta).width + 72;
    const alto = 64;
    ctx.fillStyle = "rgba(182,156,255,0.14)";
    ctx.strokeStyle = "#7a2cf5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect((ANCHO - ancho) / 2, y - alto / 2, ancho, alto, alto / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(etiqueta, ANCHO / 2, y);
    ctx.textBaseline = "alphabetic";
  }

  // ── pie ──
  ctx.fillStyle = "#ececf3";
  ctx.font = `700 34px ${antonio}`;
  ctx.fillText("THE AGENTIC ERA · HACKATHON 100 H · 30 NOV – 5 DIC", ANCHO / 2, ALTO - 78);
  ctx.fillStyle = "#b69cff";
  ctx.font = `20px ${michroma}`;
  ctx.fillText("h a c k c i s . l a t", ANCHO / 2, ALTO - 38);

  return new Promise((resolve) => lienzo.toBlob((b) => resolve(b), "image/png"));
}

/** Dispara la descarga de la card ya dibujada. */
export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  // Sin esto el blob queda retenido en memoria toda la vida de la pestaña.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Abre el menú de compartir del teléfono con la imagen adjunta. Devuelve
 * false si el aparato no lo permite, para que la interfaz ofrezca descargar.
 */
export async function compartir(blob: Blob, nombre: string, texto: string) {
  const archivo = new File([blob], nombre, { type: "image/png" });
  if (!navigator.canShare?.({ files: [archivo] })) return false;
  try {
    await navigator.share({ files: [archivo], text: texto });
    return true;
  } catch {
    return true;   // la persona cerró el menú: no es un fallo
  }
}
