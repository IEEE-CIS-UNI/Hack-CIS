/**
 * El banner para compartir.
 *
 * Se dibuja en el navegador de quien lo comparte: ni un servidor generando
 * imágenes ni una cola de trabajos. Cuesta cero y sale al instante.
 *
 * Formato 1080×1350, que es el retrato de Instagram y el que menos recorta
 * cuando se sube a cualquier otro lado.
 */

export type DatosBanner = {
  nombre: string;
  track: string | null;
  universidad: string | null;
  numero: string | null;
  foto: string | null;
};

const ANCHO = 1080;
const ALTO = 1350;

const TRACKS: Record<string, string> = {
  finanzas: "IA & FINANZAS",
  telco: "IA & TELCO Y OPERACIONES",
  impacto_social: "IA & IMPACTO SOCIAL",
};

/**
 * La familia tipográfica tal como el navegador la resolvió para la página.
 *
 * next/font genera nombres con sufijos irrepetibles, así que escribirlos a
 * mano no sirve: hay que preguntárselos a un elemento que ya los use.
 */
function familia(selector: string, respaldo: string) {
  const el = document.querySelector(selector);
  if (!el) return respaldo;
  const f = getComputedStyle(el).fontFamily;
  return f || respaldo;
}

/** Carga una imagen y espera a que esté lista para dibujarse. */
function cargarImagen(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Sin esto el canvas queda «sucio» y toDataURL falla: la foto vive en
    // otro dominio (el depósito de Supabase) y el navegador lo bloquea.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Parte un texto en las líneas que quepan en el ancho dado. */
function enLineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export async function dibujarBanner(datos: DatosBanner): Promise<Blob | null> {
  const lienzo = document.createElement("canvas");
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return null;

  const display = familia(".display, h1", "Impact, sans-serif");
  const tecnica = familia(".hud", "monospace");

  // ── fondo ──
  ctx.fillStyle = "#08030f";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Dos nebulosas, como en el sitio: una violeta arriba a la derecha y una
  // más fría abajo a la izquierda.
  const nebulosa1 = ctx.createRadialGradient(ANCHO * 0.85, -80, 0, ANCHO * 0.85, -80, 900);
  nebulosa1.addColorStop(0, "rgba(122,44,245,0.55)");
  nebulosa1.addColorStop(1, "rgba(122,44,245,0)");
  ctx.fillStyle = nebulosa1;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  const nebulosa2 = ctx.createRadialGradient(-60, ALTO * 0.75, 0, -60, ALTO * 0.75, 800);
  nebulosa2.addColorStop(0, "rgba(77,227,255,0.18)");
  nebulosa2.addColorStop(1, "rgba(77,227,255,0)");
  ctx.fillStyle = nebulosa2;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Estrellas con posiciones fijas: si fueran al azar, dos banners del mismo
  // evento se verían distintos sin motivo.
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

  // ── cabecera ──
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 76px ${display}`;
  ctx.fillText("CIS[HACK]", ANCHO / 2, 150);

  ctx.fillStyle = "#b69cff";
  ctx.font = `20px ${tecnica}`;
  ctx.fillText("U N I   2 0 2 6   ·   T H E   A G E N T I C   E R A", ANCHO / 2, 196);

  // ── foto ──
  const centroFoto = { x: ANCHO / 2, y: 470, r: 185 };
  const img = datos.foto ? await cargarImagen(datos.foto) : null;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centroFoto.x, centroFoto.y, centroFoto.r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    // Recorte cuadrado centrado: la foto llena el círculo sin deformarse.
    const lado = Math.min(img.width, img.height);
    ctx.drawImage(
      img,
      (img.width - lado) / 2, (img.height - lado) / 2, lado, lado,
      centroFoto.x - centroFoto.r, centroFoto.y - centroFoto.r, centroFoto.r * 2, centroFoto.r * 2,
    );
  } else {
    ctx.fillStyle = "#1a0b38";
    ctx.fillRect(centroFoto.x - centroFoto.r, centroFoto.y - centroFoto.r, centroFoto.r * 2, centroFoto.r * 2);
    ctx.fillStyle = "#b69cff";
    ctx.font = `700 150px ${display}`;
    ctx.textBaseline = "middle";
    ctx.fillText((datos.nombre[0] ?? "?").toUpperCase(), centroFoto.x, centroFoto.y);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  ctx.strokeStyle = "#b69cff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(centroFoto.x, centroFoto.y, centroFoto.r + 4, 0, Math.PI * 2);
  ctx.stroke();

  // ── el anuncio ──
  ctx.fillStyle = "#b69cff";
  ctx.font = `20px ${tecnica}`;
  ctx.fillText("Y A   E S T O Y   D E N T R O", ANCHO / 2, 740);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 64px ${display}`;
  const lineas = enLineas(ctx, datos.nombre.toUpperCase(), ANCHO - 160);
  lineas.slice(0, 2).forEach((linea, i) => ctx.fillText(linea, ANCHO / 2, 830 + i * 72));

  let y = 830 + Math.min(lineas.length, 2) * 72 + 30;

  if (datos.universidad) {
    ctx.fillStyle = "#d9ccff";
    ctx.font = `34px ${display}`;
    ctx.fillText(datos.universidad, ANCHO / 2, y);
    y += 70;
  }

  // ── track ──
  if (datos.track && TRACKS[datos.track]) {
    const etiqueta = TRACKS[datos.track];
    ctx.font = `22px ${tecnica}`;
    const ancho = ctx.measureText(etiqueta).width + 72;
    const alto = 68;
    const x = (ANCHO - ancho) / 2;

    ctx.fillStyle = "rgba(182,156,255,0.14)";
    ctx.strokeStyle = "#7a2cf5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y - alto / 2, ancho, alto, alto / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(etiqueta, ANCHO / 2, y);
    ctx.textBaseline = "alphabetic";
    y += 90;
  }

  // ── número de inscrito ──
  if (datos.numero) {
    ctx.fillStyle = "#8d7fb0";
    ctx.font = `20px ${tecnica}`;
    ctx.fillText(`I N S C R I T O   N . º   ${datos.numero}`, ANCHO / 2, y + 10);
  }

  // ── pie ──
  ctx.fillStyle = "#6b5f8a";
  ctx.font = `22px ${display}`;
  ctx.fillText("IEEE CIS UNI · DSC PUCP · CIS UP", ANCHO / 2, ALTO - 70);

  return new Promise((resolve) => lienzo.toBlob((b) => resolve(b), "image/png"));
}

/** Dispara la descarga del banner ya dibujado. */
export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  // Sin esto el blob queda retenido en memoria toda la vida de la pestaña.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
