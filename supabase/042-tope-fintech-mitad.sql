-- Fintech (track dorado) acepta hasta la mitad de los equipos con 2 o más integrantes (redondeo hacia arriba),
-- con el máximo que ya está en tracks.tope (40). Los demás tracks siguen como estaban.
create or replace function public._tope_track(p_slug text) returns int
language sql stable security definer set search_path = public as $$
  select case when t.slug = 'fintech' and t.tope is not null
    then least(t.tope, (select ceil(count(*) / 2.0)::int from public.hack_teams h where public._tam_equipo(h.id) >= 2))
    else t.tope end
  from public.tracks t where t.slug = p_slug
$$;
revoke all on function public._tope_track(text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.equipo_elegir_track(p_track text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare per public.people; tm uuid; t public.hack_teams; trk public.tracks;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  select * into t from public.hack_teams where id = tm;
  if t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if public._tam_equipo(tm) < 2 then raise exception 'equipo_incompleto'; end if;
  select * into trk from public.tracks where slug = p_track;
  if not found or not trk.revealed then raise exception 'track_inexistente'; end if;
  if trk.opens_at is not null and now() < trk.opens_at then raise exception 'track_aun_no'; end if;
  if trk.closes_at is not null and now() > trk.closes_at then raise exception 'track_cerrado'; end if;
  if trk.tope is not null and t.track_slug is distinct from p_track then
    -- candado por track: dos equipos que eligen a la vez no pueden pasarse del tope
    perform pg_advisory_xact_lock(hashtext('track:' || p_track));
    if (select count(*) from public.hack_teams where track_slug = p_track) >= public._tope_track(trk.slug) then raise exception 'track_lleno'; end if;
  end if;
  update public.hack_teams set track_slug = p_track, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true, 'track', p_track);
end $function$;

CREATE OR REPLACE FUNCTION public.track_cupos()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', t.slug, 'tope', public._tope_track(t.slug),
    'ocupados', (select count(*)::int from public.hack_teams h where h.track_slug = t.slug)
  ) order by t.position), '[]'::jsonb)
  from public.tracks t where t.revealed
$function$;

CREATE OR REPLACE FUNCTION public.tracks_panel()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  return jsonb_build_object('ahora', now(), 'equipos', (select count(*)::int from public.hack_teams),
    'listos', (select count(*)::int from public.hack_teams h where public._tam_equipo(h.id) >= 2),
    'tracks', (select jsonb_agg(jsonb_build_object('slug', t.slug, 'nombre', t.name, 'sponsor', t.sponsor_name,
        'abre', t.opens_at, 'cierra', t.closes_at, 'tope', public._tope_track(t.slug),
        'ocupados', (select count(*)::int from public.hack_teams h where h.track_slug = t.slug),
        'reto', (select jsonb_build_object('titulo', r.titulo, 'detalle', r.detalle, 'enlace', r.enlace) from public.track_retos r where r.slug = t.slug)
      ) order by t.position) from public.tracks t where t.revealed));
end $function$;
