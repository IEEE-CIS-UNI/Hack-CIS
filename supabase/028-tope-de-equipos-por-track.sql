-- 028 · Tope de equipos por track, y apertura de la elección de track
--
-- Reglas nuevas (24/11): Fintech (el track dorado, con Millennium) acepta como máximo 40 equipos; Energía y Cloud no tienen tope
-- propio y se reparten el resto. Se aplica al elegir track: los primeros 40 equipos que elijan Fintech entran; los demás eligen otro.
--
--   · tracks.tope            tope de equipos del track (null = sin tope)
--   · track_cupos()          cuántos equipos hay en cada track y su tope (público: se muestra «quedan N lugares»)
--   · equipo_elegir_track    ahora respeta el tope (error track_lleno), con un candado para que dos equipos no entren a la vez
--   · la elección de track se abre el viernes 27/11 a las 8:00 p. m. (hora de Lima), al terminar la sesión en la que los sponsors
--     presentan sus retos. Antes era a las 12:00 a. m. del viernes, es decir, antes del pitch.
--   · create_team (el formulario viejo con DNI) deja de estar disponible: los equipos se arman en /equipos (024)
--
-- Idempotente.

alter table public.tracks add column if not exists tope int check (tope is null or tope > 0);
update public.tracks set tope = 40 where slug = 'fintech';

update public.tracks set opens_at = '2026-11-27 20:00:00-05' where slug in ('energia', 'cloud', 'fintech');

create or replace function public.track_cupos() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', t.slug, 'tope', t.tope,
    'ocupados', (select count(*)::int from public.hack_teams h where h.track_slug = t.slug)
  ) order by t.position), '[]'::jsonb)
  from public.tracks t where t.revealed
$$;
revoke all on function public.track_cupos() from public;
grant execute on function public.track_cupos() to anon, authenticated;

create or replace function public.equipo_elegir_track(p_track text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
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
    if (select count(*) from public.hack_teams where track_slug = p_track) >= trk.tope then raise exception 'track_lleno'; end if;
  end if;
  update public.hack_teams set track_slug = p_track, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true, 'track', p_track);
end $$;

-- el formulario viejo (DNI de los compañeros) podía saltarse el tope; los equipos se arman en /equipos
revoke execute on function public.create_team(text, text, text[]) from public, anon, authenticated;
