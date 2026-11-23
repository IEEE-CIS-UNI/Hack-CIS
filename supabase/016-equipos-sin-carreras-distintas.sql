-- 016 · Los equipos ya no necesitan carreras distintas
--
-- A pedido de los participantes, desde el 22 de noviembre de 2026 la regla «al menos 2 carreras o
-- facultades distintas por equipo» es OPCIONAL. Esta migración reemplaza create_team sin esa
-- validación (se quita el error 'carreras_iguales'); todo lo demás queda igual: 2 a 4 personas,
-- ya inscritas en la hackathon, sin otro equipo, y track abierto.
-- Idempotente: se puede correr de nuevo sin problema.

CREATE OR REPLACE FUNCTION public.create_team(p_track text, p_name text, p_dni_hashes text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  uid     uuid := auth.uid();
  leader  public.people;
  trk     public.tracks;
  nombre  text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  n       int  := coalesce(cardinality(p_dni_hashes), 0);
  ids     uuid[] := '{}';
  mid     uuid;
  i       int;
  tid     uuid;
begin
  if uid is null then raise exception 'sin_sesion'; end if;

  select pe.* into leader
  from public.people pe
  join public.enrollments e on e.person_id = pe.id and e.offering_slug = 'hack'
  where pe.auth_user_id = uid;
  if not found then raise exception 'sin_hack'; end if;

  if exists (select 1 from public.hack_team_members where person_id = leader.id) then
    raise exception 'ya_tiene_equipo:0';
  end if;

  select * into trk from public.tracks where slug = p_track;
  if not found or not trk.revealed then raise exception 'track_inexistente'; end if;
  if trk.opens_at  is not null and now() < trk.opens_at  then raise exception 'track_aun_no'; end if;
  if trk.closes_at is not null and now() > trk.closes_at then raise exception 'track_cerrado'; end if;

  if char_length(nombre) < 3 or char_length(nombre) > 40 then raise exception 'nombre_invalido'; end if;

  if n < 1 or n > 3 then raise exception 'tamano_equipo'; end if;
  if (select count(distinct h) from unnest(p_dni_hashes) h) <> n then raise exception 'dni_repetido'; end if;

  for i in 1..n loop
    select pe.id into mid
    from public.people pe
    join public.enrollments e on e.person_id = pe.id and e.offering_slug = 'hack'
    where pe.dni_hash = p_dni_hashes[i];

    if mid is null then raise exception 'dni_no_inscrito:%', i; end if;
    if mid = leader.id then raise exception 'dni_propio:%', i; end if;
    if exists (select 1 from public.hack_team_members where person_id = mid) then
      raise exception 'ya_tiene_equipo:%', i;
    end if;
    ids := ids || mid;
  end loop;

  -- (Desde el 22/11 ya no se exige que haya carreras distintas: es opcional.)

  insert into public.hack_teams (name, track_slug, leader_id)
  values (nombre, p_track, leader.id)
  returning id into tid;

  insert into public.hack_team_members (team_id, person_id)
  select tid, x from unnest(array[leader.id] || ids) x;

  return jsonb_build_object(
    'team_id', tid, 'name', nombre, 'track', p_track,
    'members', (select jsonb_agg(jsonb_build_object('name', coalesce(pe.display_name, pe.name), 'leader', pe.id = leader.id))
                from public.people pe where pe.id = leader.id or pe.id = any (ids))
  );
end $function$
;
