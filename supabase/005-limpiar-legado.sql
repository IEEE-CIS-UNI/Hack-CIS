-- ---------------------------------------------------------------------------
-- Limpieza: deja en Supabase solo lo que usa la versión 2.
--
-- CORRER DESPUÉS de 004-inscripciones.sql, nunca antes: 004 copia lo que había
-- en `hackers` a `people`, y esto borra lo viejo.
--
-- Qué se queda (esquema public):
--   catálogos   institutions, university_domains, careers
--   v2          people, offerings, enrollments, tracks, hack_teams,
--               hack_team_members  (+ la vista hack_roster y sus funciones)
--   storage     el depósito «fotos» y sus políticas
--
-- Qué se borra: cualquier OTRA tabla, vista, función y tipo de `public`
-- (hackers, teams, sponsors y lo que haya dejado el proyecto anterior).
--
-- Seguro antes de borrar: si en `hackers` queda alguien que NO está en
-- `people`, se detiene sin tocar nada. Lo que está en uso (un tipo o una
-- función que todavía usa una tabla que se queda) se salta y se avisa.
--
-- Esto es IRREVERSIBLE. Si la base tiene datos que importan, haz antes un
-- respaldo (Database → Backups).
--
-- Supabase → SQL Editor → pegar → Run. Se puede correr dos veces.
-- ---------------------------------------------------------------------------

-- ── Restos del proyecto anterior en storage y políticas repetidas ───────────
-- Va PRIMERO: la función de abajo no se puede borrar mientras las políticas
-- del depósito la usen.
--
-- El depósito «badge-photos» y su función eran de un diseño anterior de la
-- credencial; hoy las fotos viven en «fotos». El depósito en sí (la fila de
-- storage.buckets) no se puede borrar con SQL —Supabase lo bloquea—: se elimina
-- desde el panel (Storage → badge-photos → Delete bucket).

drop policy if exists "badge_photos_delete_own"  on storage.objects;
drop policy if exists "badge_photos_insert_own"  on storage.objects;
drop policy if exists "badge_photos_public_read" on storage.objects;
drop policy if exists "badge_photos_update_own"  on storage.objects;
drop function if exists public.owns_badge_folder(text);
drop function if exists public.owns_badge_folder();

-- Cada catálogo tenía dos políticas de lectura iguales: se queda una.
do $$
begin
  if to_regclass('public.institutions')       is not null then drop policy if exists "institutions_read"       on public.institutions;       end if;
  if to_regclass('public.university_domains') is not null then drop policy if exists "university_domains_read" on public.university_domains; end if;
  if to_regclass('public.expertises')         is not null then drop policy if exists "expertises_read"         on public.expertises;         end if;
end $$;

do $$
declare
  r record;
  tablas_ok  constant text[] := array[
    'institutions', 'university_domains', 'careers',
    'people', 'offerings', 'enrollments', 'tracks', 'hack_teams', 'hack_team_members'];
  vistas_ok  constant text[] := array['hack_roster', 'sponsor_leads'];
  funciones_ok constant text[] := array[
    'touch_updated_at', 'display_name_of', 'gen_access_code', 'register_person', 'enroll_in',
    'create_team', 'leave_team', 'my_overview', 'public_counts', 'redeem_hack_code'];
  borradas int := 0;
begin
  -- 0. que la v2 exista: sin ella no hay nada a lo que migrar.
  if to_regclass('public.people') is null or to_regclass('public.enrollments') is null then
    raise exception 'Falta correr 004-inscripciones.sql antes de esta limpieza.';
  end if;

  -- 1. que nadie se pierda: todo lo que hay en hackers tiene que estar ya en people.
  if to_regclass('public.hackers') is not null then
    if exists (select 1 from public.hackers h where not exists (select 1 from public.people p where p.id = h.id)) then
      raise exception 'Hay filas de public.hackers que no están en public.people. Revisa los avisos de 004 (NOTICE) antes de borrar nada.';
    end if;
  end if;

  -- 2. vistas viejas
  for r in select viewname from pg_views where schemaname = 'public' and viewname <> all (vistas_ok) loop
    execute format('drop view if exists public.%I cascade', r.viewname);
    raise notice 'vista borrada: %', r.viewname;
    borradas := borradas + 1;
  end loop;

  -- 3. tablas viejas (con sus políticas, triggers e índices)
  for r in select tablename from pg_tables where schemaname = 'public' and tablename <> all (tablas_ok) loop
    execute format('drop table if exists public.%I cascade', r.tablename);
    raise notice 'tabla borrada: %', r.tablename;
    borradas := borradas + 1;
  end loop;

  -- 4. funciones viejas. Sin CASCADE: si una tabla que se queda todavía la usa
  --    (un trigger, un check), se deja y se avisa en vez de romperla. Se
  --    saltan las que pertenecen a una extensión.
  for r in
    select p.oid::regprocedure as firma, p.proname
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname <> all (funciones_ok)
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    begin
      execute format('drop function if exists %s', r.firma);
      raise notice 'función borrada: %', r.firma;
      borradas := borradas + 1;
    exception when others then
      raise notice 'función conservada (la usa algo que se queda): % (%)', r.firma, sqlerrm;
    end;
  end loop;

  -- 5. tipos viejos (enums como hacker_level). Igual: sin CASCADE.
  for r in
    select t.typname
    from pg_type t
    where t.typnamespace = 'public'::regnamespace
      and t.typtype = 'e'
      and not exists (select 1 from pg_depend d where d.objid = t.oid and d.deptype = 'e')
  loop
    begin
      execute format('drop type public.%I', r.typname);
      raise notice 'tipo borrado: %', r.typname;
      borradas := borradas + 1;
    exception when others then
      raise notice 'tipo conservado (lo usa una tabla que se queda): %', r.typname;
    end;
  end loop;

  raise notice 'Limpieza terminada: % objeto(s) borrado(s).', borradas;
end $$;

-- ── Permisos de los catálogos: solo lectura ─────────────────────────────────
-- Supabase da por defecto todos los permisos (insertar, borrar, vaciar…) a
-- quien no ha iniciado sesión. La seguridad por filas (RLS) ya bloquea escribir,
-- pero no cubre TRUNCATE; mejor que ni exista el permiso.

revoke all on public.institutions       from anon, authenticated;
revoke all on public.university_domains from anon, authenticated;
grant select on public.institutions, public.university_domains to anon, authenticated;

-- ── Opcional: empezar de cero con las CUENTAS ───────────────────────────────
-- Borra todos los usuarios de Auth (las pruebas), y con ellos sus fichas,
-- inscripciones y equipos de la v2. NO lo corras si ya hay inscritos de verdad.
-- Para activarlo, quita los dos guiones de la línea de abajo y corre otra vez.
--
-- delete from auth.users;

-- ── Qué quedó ───────────────────────────────────────────────────────────────

select
  (select jsonb_agg(tablename order by tablename) from pg_tables where schemaname = 'public') as tablas,
  (select jsonb_agg(viewname)   from pg_views  where schemaname = 'public')                  as vistas,
  (select count(*) from public.people)      as personas,
  (select count(*) from public.enrollments) as inscripciones,
  (select count(*) from auth.users)         as usuarios_auth;
