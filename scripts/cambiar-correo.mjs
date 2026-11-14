#!/usr/bin/env node
/**
 * Cambia a mano el correo de una cuenta (por ejemplo, de un Gmail al correo
 * institucional) para que la persona pueda sumarse a la hackathon.
 *
 *   node scripts/cambiar-correo.mjs <correo-actual> <correo-nuevo> [dni]
 *
 * Por defecto es un ENSAYO: hace todo dentro de una transacción, muestra qué
 * cambiaría y la deshace. Para aplicarlo de verdad, agrega  --aplicar
 *
 *   node scripts/cambiar-correo.mjs viejo@gmail.com nuevo@uni.edu.pe --aplicar
 *
 * El DNI es opcional y normalmente NO se usa: la persona lo escribe ella misma en su
 * panel después del cambio. No pidas DNI por correo.
 *
 * Qué hace, todo en una sola transacción (si algo falla, no queda nada a medias):
 *   · cambia el correo en la cuenta de acceso (auth.users y su identidad);
 *   · cambia el correo del perfil y le asigna la universidad según el dominio;
 *   · si pasas el DNI y la persona no tenía, lo guarda cifrado (nunca en claro);
 *   · guarda antes un respaldo del registro en scripts/.respaldos/ (no se sube a git).
 *
 * Se detiene, sin cambiar nada, si: el correo actual no existe, el nuevo ya lo
 * usa otra cuenta, el dominio nuevo no es de una institución aceptada, o el DNI
 * ya está inscrito.
 *
 * Después, la persona entra con el correo nuevo (con el enlace «Entrar») y
 * completa DNI, carrera y ciclo desde su panel.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const aplicar = args.includes("--aplicar");
const [viejoCrudo, nuevoCrudo, dniCrudo] = args.filter((a) => !a.startsWith("--"));

if (!viejoCrudo || !nuevoCrudo) {
  console.log("Uso: node scripts/cambiar-correo.mjs <correo-actual> <correo-nuevo> [dni] [--aplicar]");
  process.exit(1);
}

function env(nombre) {
  if (process.env[nombre]) return process.env[nombre];
  try {
    const t = readFileSync(join(raiz, ".env.local"), "utf8");
    const l = t.split(/\r?\n/).find((x) => x.startsWith(nombre + "="));
    return l ? l.slice(nombre.length + 1).trim() : undefined;
  } catch { return undefined; }
}

const url = env("DATABASE_URL");
if (!url) { console.log("Falta DATABASE_URL en .env.local"); process.exit(1); }

const viejo = viejoCrudo.trim().toLowerCase();
const nuevo = nuevoCrudo.trim().toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nuevo)) { console.log("El correo nuevo no parece válido."); process.exit(1); }

let dniHash = null;
if (dniCrudo) {
  const d = dniCrudo.replace(/[\s.-]/g, "");
  if (!/^\d{8}$/.test(d) || /^(\d)\1{7}$/.test(d)) { console.log("El DNI debe tener 8 dígitos válidos."); process.exit(1); }
  dniHash = "sha256:" + createHash("sha256").update(d + (env("DNI_PEPPER") ?? "sin-pepper")).digest("hex");
}

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (s, p) => (await c.query(s, p)).rows;

function parar(msg) { console.log("\n✘ " + msg + "\n  No se cambió nada."); return c.end().then(() => process.exit(1)); }

try {
  await c.query("begin");

  const [persona] = await q("select * from public.people where lower(email) = $1", [viejo]);
  if (!persona) await parar(`No hay ningún perfil con el correo ${viejo}.`);
  if (viejo === nuevo) await parar("El correo nuevo es igual al actual.");

  const [usado] = await q("select 1 from public.people where lower(email) = $1 union all select 1 from auth.users where lower(email) = $1", [nuevo]);
  if (usado) await parar(`El correo ${nuevo} ya lo usa otra cuenta.`);

  const [inst] = await q(
    `select d.institution_id, i.name from public.university_domains d
       join public.institutions i on i.id = d.institution_id
      where i.is_eligible and (split_part($1, '@', 2) = d.domain or split_part($1, '@', 2) like '%.' || d.domain)
      order by length(d.domain) desc limit 1`, [nuevo]);
  if (!inst) await parar(`El dominio de ${nuevo} no es de una institución aceptada.`);

  if (dniHash && persona.dni_hash && persona.dni_hash !== dniHash) {
    await parar("Esa persona ya tiene un DNI guardado distinto; no se cambia.");
  }

  // Respaldo antes de tocar nada.
  const [auth] = await q("select id, email, email_confirmed_at, last_sign_in_at from auth.users where id = $1", [persona.auth_user_id]);
  const idents = await q("select id, provider, identity_data from auth.identities where user_id = $1", [persona.auth_user_id]);
  const carpeta = join(raiz, "scripts", ".respaldos");
  mkdirSync(carpeta, { recursive: true });
  const archivo = join(carpeta, `${new Date().toISOString().replace(/[:.]/g, "-")}-${persona.id}.json`);
  writeFileSync(archivo, JSON.stringify({ persona, auth, identidades: idents }, null, 1));

  // Cuenta de acceso.
  await q("update auth.users set email = $1, updated_at = now() where id = $2", [nuevo, persona.auth_user_id]);
  await q(
    "update auth.identities set identity_data = jsonb_set(identity_data, '{email}', to_jsonb($1::text)), updated_at = now() where user_id = $2",
    [nuevo, persona.auth_user_id]);

  // Perfil.
  await q("update public.people set email = $1, institution_id = $2 where id = $3", [nuevo, inst.institution_id, persona.id]);
  if (dniHash && !persona.dni_hash) await q("update public.people set dni_hash = $1 where id = $2", [dniHash, persona.id]);

  const [despues] = await q(
    `select p.name, p.email, i.name as universidad, (p.dni_hash is not null) as tiene_dni, a.email as email_acceso
       from public.people p join auth.users a on a.id = p.auth_user_id
       left join public.institutions i on i.id = p.institution_id where p.id = $1`, [persona.id]);

  console.log(`\n${aplicar ? "APLICADO" : "ENSAYO (no se guarda nada)"}`);
  console.table([{ nombre: despues.name, correo_antes: viejo, correo_ahora: despues.email, acceso: despues.email_acceso, universidad: despues.universidad, dni_guardado: despues.tiene_dni }]);
  console.log("Respaldo:", archivo);

  if (aplicar) {
    await c.query("commit");
    console.log("\n✔ Listo. Dile que entre con el correo nuevo (botón «Entrar») y complete su perfil en su panel.");
  } else {
    await c.query("rollback");
    console.log("\nPara aplicarlo de verdad, repite el comando agregando --aplicar");
  }
} catch (e) {
  await c.query("rollback").catch(() => {});
  console.log("\n✘ Falló y se deshizo todo:", e.message);
  process.exitCode = 1;
}
await c.end();
