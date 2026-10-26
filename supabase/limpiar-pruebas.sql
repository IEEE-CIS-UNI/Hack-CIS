-- ---------------------------------------------------------------------------
-- Borrar los datos de prueba y dejar la base lista para abrir inscripciones.
--
-- Esto NO es una migración: es una herramienta de un solo uso. No lo corras
-- una vez que haya gente inscrita de verdad, porque borra a todos.
--
-- Qué borra: todas las inscripciones y todas las cuentas de Supabase Auth.
-- Antes del lanzamiento, eso es exactamente el ruido de nuestras pruebas.
--
-- Cómo correrlo: Supabase → SQL Editor → pegar → Run.
-- El resultado muestra el antes y el después, así que se ve qué se llevó.
-- ---------------------------------------------------------------------------

do $$
declare
  antes_hackers  int;
  antes_usuarios int;
begin
  select count(*) into antes_hackers  from public.hackers;
  select count(*) into antes_usuarios from auth.users;
  raise notice 'Antes: % inscripciones, % cuentas', antes_hackers, antes_usuarios;
end $$;

-- En orden de dependencia: lo que apunta a «hackers» primero, o las claves
-- foráneas impiden el borrado.
delete from public.checkins;
delete from public.join_requests;
delete from public.hackers;
delete from public.teams;

-- Las cuentas de Auth van al final: «hackers» las referencia.
delete from auth.users;

-- Estado final. Todo en cero significa que quedó limpio.
select
  (select count(*) from public.hackers)       as inscripciones,
  (select count(*) from auth.users)           as cuentas_auth,
  (select count(*) from public.teams)         as equipos,
  (select count(*) from public.join_requests) as solicitudes,
  (select count(*) from public.checkins)      as asistencias,
  -- Los catálogos NO se tocan: son datos reales que ya estaban.
  (select count(*) from public.institutions)       as universidades_catalogo,
  (select count(*) from public.university_domains) as dominios_catalogo,
  (select count(*) from public.expertises)         as especialidades_catalogo;
