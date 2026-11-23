-- 020 · Los enlaces de Zoom también en la card privada (/card/<token>)
--
-- Quien no puede entrar al panel (su correo gasta los enlaces de un solo uso) usa su card privada. El token de la
-- card ya es el «permiso» de esa persona, igual que en card_por_token y asistencia_por_token: con él se le entregan
-- SOLO los enlaces de las sesiones a las que está inscrita (nunca los de las demás). Idempotente.

create or replace function public.enlaces_por_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('slug', l.offering_slug, 'url', l.zoom_url, 'id', l.meeting_id, 'inicio', l.starts_at, 'fin', l.ends_at)
              order by l.offering_slug),
    '[]'::jsonb)
  from public.people p
  join public.enrollments e on e.person_id = p.id
  join public.session_links l on l.offering_slug = e.offering_slug
  where length(p_token) = 32 and p.card_token = p_token
$$;

revoke all on function public.enlaces_por_token(text) from public;
grant execute on function public.enlaces_por_token(text) to anon, authenticated;
