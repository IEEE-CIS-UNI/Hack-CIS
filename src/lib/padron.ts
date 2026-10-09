/**
 * Padrón institucional: el CSV que entrega Registros Académicos.
 *
 * Es opcional. Sin él la inscripción funciona igual (se verifica con el
 * correo institucional); con él se gana carrera, facultad, ciclo y la prueba
 * de que el código le pertenece a quien lo escribe.
 *
 * Se lee de datos/padron.csv, fuera de src, para que subirlo sea reemplazar
 * un archivo y no tocar código. Está en .gitignore: son datos personales de
 * terceros y no van al repositorio.
 *
 * Columnas mínimas:  codigo, nombres, apellido_paterno
 * Recomendadas:      universidad, apellido_materno, carrera, facultad, ciclo, estado
 */

import "server-only";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { FilaPadron, Padron } from "./validacion";

const RUTA = join(process.cwd(), "datos", "padron.csv");

let memo: { padron: Padron | null; mtime: number } | null = null;

function partirCsv(linea: string) {
  const campos: string[] = [];
  let actual = "", enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (enComillas && linea[i + 1] === '"') { actual += '"'; i++; }
      else enComillas = !enComillas;
    } else if (c === "," && !enComillas) { campos.push(actual); actual = ""; }
    else actual += c;
  }
  campos.push(actual);
  return campos.map((c) => c.trim());
}

/** Devuelve null si no hay padrón. Nunca lanza: sin padrón se sigue igual. */
export function cargarPadron(): Padron | null {
  if (!existsSync(RUTA)) return null;

  const mtime = statSync(RUTA).mtimeMs;
  if (memo && memo.mtime === mtime) return memo.padron;

  try {
    const texto = readFileSync(RUTA, "utf8").replace(/^﻿/, "").trim();
    if (!texto) return null;

    const [cabecera, ...lineas] = texto.split(/\r?\n/);
    const cols = partirCsv(cabecera).map((c) => c.toLowerCase());
    for (const req of ["codigo", "nombres", "apellido_paterno"]) {
      if (!cols.includes(req)) {
        console.error(`[padron] falta la columna «${req}»; se ignora el archivo`);
        return null;
      }
    }

    const filas = new Map<string, FilaPadron>();
    const universidades = new Set<string>();
    for (const linea of lineas) {
      if (!linea.trim()) continue;
      const v = partirCsv(linea);
      const f = Object.fromEntries(cols.map((c, i) => [c, v[i] ?? ""])) as unknown as FilaPadron;
      if (!f.codigo) continue;
      f.codigo = String(f.codigo).toUpperCase();
      filas.set(f.codigo, f);
      if (f.universidad) universidades.add(f.universidad.toUpperCase());
    }

    const padron: Padron = { get: (c) => filas.get(c), universidades, size: filas.size };
    memo = { padron, mtime };
    console.log(`[padron] ${filas.size} filas · ${[...universidades].join(", ") || "sin columna universidad"}`);
    return padron;
  } catch (e) {
    console.error("[padron] no se pudo leer:", e);
    return null;
  }
}
