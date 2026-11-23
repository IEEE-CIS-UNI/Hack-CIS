-- 015 · Confirmar asistencia a la hackathon.
--
-- Cada inscripción a la hack lleva ahora su estado de asistencia:
--   pendiente    todavía no respondió (estado de partida)
--   confirmado   pulsó «Confirmo que participaré»
--   no_participa pulsó «No podré participar» (libera su lugar)
--
-- Además de confirmar con el botón, canjear el código de Discord cuenta: quien lo canjeó
-- ya demostró que está dentro (columna «efectivo» de las funciones de abajo).
--
-- Se confirma de dos maneras, sin que haga falta entrar con un enlace de correo:
--   · asistencia_por_token  desde el enlace privado de la card (/card/<token>),
--   · mi_asistencia         desde el panel, con la sesión iniciada.
--
-- Se puede volver a correr sin problema.

alter table public.enrollments add column if not exists attendance text not null default 'pendiente';
alter table public.enrollments drop constraint if exists enrollments_attendance_check;
alter table public.enrollments add constraint enrollments_attendance_check
  check (attendance in ('pendiente', 'confirmado', 'no_participa'));
alter table public.enrollments add column if not exists attendance_at timestamptz;        -- cuándo respondió
alter table public.enrollments add column if not exists attendance_mail_at timestamptz;   -- cuándo se le mandó el último correo de confirmación
alter table public.enrollments add column if not exists attendance_mail_n integer not null default 0;   -- cuántos correos de confirmación se le mandaron

-- Fecha límite para confirmar: miércoles 25 de noviembre, 3:00 p. m. (hora de Lima).
create or replace function public.asistencia_limite()
returns timestamptz language sql immutable as $$ select timestamptz '2026-11-25 15:00:00-05' $$;

-- Lógica común. No se puede llamar desde fuera: la usan las dos funciones de abajo.
create or replace function public._asistencia(p_person uuid, p_accion text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare en public.enrollments;
begin
  select * into en from public.enrollments where person_id = p_person and offering_slug = 'hack' for update;
  if not found then return jsonb_build_object('hay_hack', false); end if;

  if p_accion = 'confirmo' then
    update public.enrollments set attendance = 'confirmado', attendance_at = now()
     where person_id = p_person and offering_slug = 'hack';
  elsif p_accion = 'no_participo' then
    update public.enrollments set attendance = 'no_participa', attendance_at = now()
     where person_id = p_person and offering_slug = 'hack';
  elsif coalesce(p_accion, '') <> '' then
    raise exception 'accion_invalida';
  end if;

  select * into en from public.enrollments where person_id = p_person and offering_slug = 'hack';
  return jsonb_build_object(
    'hay_hack', true,
    'estado', en.attendance,
    'canjeo_discord', en.redeemed_at is not null,
    -- cuenta con ella: confirmó, o no respondió pero ya canjeó su código de Discord
    'efectivo', en.attendance = 'confirmado' or (en.attendance = 'pendiente' and en.redeemed_at is not null),
    'numero', en.number,
    'limite', public.asistencia_limite()
  );
end $$;

revoke all on function public._asistencia(uuid, text) from public, anon, authenticated;

-- Desde el enlace privado de la card.
create or replace function public.asistencia_por_token(p_token text, p_accion text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare pid uuid;
begin
  select id into pid from public.people where length(p_token) = 32 and card_token = p_token;
  if pid is null then return null; end if;
  return public._asistencia(pid, p_accion);
end $$;

-- Desde el panel (sesión iniciada).
create or replace function public.mi_asistencia(p_accion text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select id into pid from public.people where auth_user_id = auth.uid();
  if pid is null then raise exception 'sin_perfil'; end if;
  return public._asistencia(pid, p_accion);
end $$;

revoke all on function public.asistencia_por_token(text, text) from public;
revoke all on function public.mi_asistencia(text) from public, anon;
grant execute on function public.asistencia_por_token(text, text) to anon, authenticated;
grant execute on function public.mi_asistencia(text) to authenticated;
