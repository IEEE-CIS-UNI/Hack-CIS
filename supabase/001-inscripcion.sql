-- ---------------------------------------------------------------------------
-- Inscripción de HACK[CIS] UNI 2026
--
-- Qué resuelve:
--   · dni_hash  — el DNI nunca se guarda en claro; se guarda su hash con sal.
--   · track     — lo que pidió Gerson para que el bot abra canales por track.
--   · políticas — hoy nadie puede escribir en «hackers» (RLS lo bloquea todo).
--
-- Cómo correrlo: Supabase → SQL Editor → pegar → Run.
-- Es idempotente: se puede correr dos veces sin romper nada.
--
-- El bloque final no cambia nada, solo devuelve el estado de la tabla para
-- terminar de ajustar el código (faltan los valores del enum hacker_level).
-- ---------------------------------------------------------------------------

-- ── 1. columnas que faltan ──────────────────────────────────────────────────

alter table public.hackers add column if not exists dni_hash text;
alter table public.hackers add column if not exists track    text;

comment on column public.hackers.dni_hash is
  'sha256 del DNI + DNI_PEPPER. Nunca el número en claro (Ley 29733).';
comment on column public.hackers.track is
  'Track elegido: finanzas | telco | impacto_social. Lo lee el bot de Discord.';

-- Una persona, una inscripción. Parcial para no chocar con los que aún no lo tengan.
create unique index if not exists hackers_dni_hash_key
  on public.hackers (dni_hash) where dni_hash is not null;

-- Solo los tres tracks reales, y se permite nulo mientras no elija.
alter table public.hackers drop constraint if exists hackers_track_check;
alter table public.hackers add  constraint hackers_track_check
  check (track is null or track in ('finanzas', 'telco', 'impacto_social'));

-- ── 2. permisos ─────────────────────────────────────────────────────────────
-- La regla: cada quien toca su propia fila y ninguna otra. El vínculo es
-- auth_user_id, que solo lo puede poner quien tiene sesión iniciada, y la
-- sesión solo existe después de confirmar el correo institucional. Eso es lo
-- que convierte el correo en una prueba de verdad y no en un campo de texto.

alter table public.hackers enable row level security;

drop policy if exists "hacker se inscribe a si mismo" on public.hackers;
create policy "hacker se inscribe a si mismo"
  on public.hackers for insert to authenticated
  with check (auth_user_id = (select auth.uid()));

drop policy if exists "hacker lee su ficha" on public.hackers;
create policy "hacker lee su ficha"
  on public.hackers for select to authenticated
  using (auth_user_id = (select auth.uid()));

drop policy if exists "hacker edita su ficha" on public.hackers;
create policy "hacker edita su ficha"
  on public.hackers for update to authenticated
  using      (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

-- Los catálogos son públicos: el formulario necesita leerlos sin sesión.
alter table public.institutions       enable row level security;
alter table public.university_domains enable row level security;
alter table public.expertises         enable row level security;

drop policy if exists "catalogo publico" on public.institutions;
create policy "catalogo publico" on public.institutions
  for select to anon, authenticated using (true);

drop policy if exists "catalogo publico" on public.university_domains;
create policy "catalogo publico" on public.university_domains
  for select to anon, authenticated using (true);

drop policy if exists "catalogo publico" on public.expertises;
create policy "catalogo publico" on public.expertises
  for select to anon, authenticated using (true);

-- ── 3. diagnóstico (no modifica nada) ───────────────────────────────────────

select jsonb_pretty(jsonb_build_object(
  'columnas_hackers', (
    select jsonb_agg(jsonb_build_object(
             'col', column_name, 'tipo', data_type,
             'acepta_nulo', is_nullable, 'por_defecto', column_default)
           order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'hackers'),

  'enums', (
    select jsonb_object_agg(t.typname, vals)
    from (
      select t.typname, jsonb_agg(e.enumlabel order by e.enumsortorder) as vals
      from pg_type t join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      group by t.typname
    ) t),

  'constraints_hackers', (
    select jsonb_agg(jsonb_build_object('nombre', conname, 'definicion', pg_get_constraintdef(oid)))
    from pg_constraint where conrelid = 'public.hackers'::regclass),

  'politicas', (
    select jsonb_agg(jsonb_build_object(
             'tabla', tablename, 'nombre', policyname, 'operacion', cmd,
             'roles', roles, 'using', qual, 'check', with_check)
           order by tablename, policyname)
    from pg_policies where schemaname = 'public'),

  'triggers_hackers', (
    select jsonb_agg(tgname) from pg_trigger
    where tgrelid = 'public.hackers'::regclass and not tgisinternal)
)) as diagnostico;
