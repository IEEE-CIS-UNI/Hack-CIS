-- 019 · Enlaces de Zoom del bootcamp, solo para quienes se inscribieron a cada sesión
--
-- Los enlaces NO viven en el código ni en el repo: están en esta tabla, que nadie puede leer directo (sin políticas
-- ni permisos). La página de cada sesión los pide con enlace_sesion(), que solo entrega el enlace a una persona con
-- sesión iniciada e inscrita a esa sesión. Los datos (enlace, ID, hora de inicio y fin) se cargan aparte, no aquí.
-- Idempotente.

create table if not exists public.session_links (
  offering_slug text primary key references public.offerings(slug) on delete cascade,
  zoom_url      text not null,
  meeting_id    text not null,
  starts_at     timestamptz,
  ends_at       timestamptz
);
alter table public.session_links enable row level security;
revoke all on public.session_links from anon, authenticated;

create or replace function public.enlace_sesion(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare
  uid uuid := auth.uid();
  l   public.session_links;
begin
  if uid is null then return jsonb_build_object('estado', 'sin_sesion'); end if;
  if not exists (
    select 1 from public.enrollments e join public.people p on p.id = e.person_id
    where p.auth_user_id = uid and e.offering_slug = p_slug
  ) then return jsonb_build_object('estado', 'no_inscrito'); end if;
  select * into l from public.session_links where offering_slug = p_slug;
  if not found then return jsonb_build_object('estado', 'sin_enlace'); end if;
  return jsonb_build_object('estado', 'ok', 'url', l.zoom_url, 'id', l.meeting_id, 'inicio', l.starts_at, 'fin', l.ends_at);
end $$;

revoke all on function public.enlace_sesion(text) from public, anon;
grant execute on function public.enlace_sesion(text) to authenticated;
