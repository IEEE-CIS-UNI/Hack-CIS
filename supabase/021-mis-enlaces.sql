-- 021 · Los enlaces de Zoom en el panel de cada persona
--
-- mis_enlaces() devuelve, a una persona con sesión iniciada, los enlaces de Zoom de las sesiones del bootcamp a las que
-- está inscrita (y solo esas). Es la versión «de una vez» de enlace_sesion(), para la lista «Mis inscripciones».
-- Idempotente.

create or replace function public.mis_enlaces() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('slug', l.offering_slug, 'url', l.zoom_url, 'id', l.meeting_id, 'inicio', l.starts_at, 'fin', l.ends_at)
              order by l.offering_slug),
    '[]'::jsonb)
  from public.people p
  join public.enrollments e on e.person_id = p.id
  join public.session_links l on l.offering_slug = e.offering_slug
  where auth.uid() is not null and p.auth_user_id = auth.uid()
$$;

revoke all on function public.mis_enlaces() from public, anon;
grant execute on function public.mis_enlaces() to authenticated;
