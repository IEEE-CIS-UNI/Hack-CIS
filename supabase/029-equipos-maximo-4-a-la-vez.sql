-- 029 · Dos acciones simultáneas sobre un mismo equipo
--
-- Si dos personas aceptaban a la vez, ambas veían 3 integrantes y el equipo quedaba con 5. Ahora «responder» y «salir»
-- bloquean la fila del equipo: la segunda espera a la primera y recién entonces cuenta.
-- Idempotente (solo reemplaza las dos funciones de la 024; los permisos se conservan).

create or replace function public.equipo_responder(p_invite uuid, p_acepta boolean) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; v public.team_invites; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  select * into v from public.team_invites where id = p_invite and status = 'pendiente' for update;
  if not found then raise exception 'invitacion_invalida'; end if;
  select * into t from public.hack_teams where id = v.team_id for update;   -- una aceptación a la vez por equipo
  if v.kind = 'invitacion' and v.person_id <> per.id then raise exception 'invitacion_invalida'; end if;
  if v.kind = 'solicitud' and t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if not coalesce(p_acepta, false) then
    update public.team_invites set status = 'rechazada', responded_at = now() where id = v.id;
    return jsonb_build_object('ok', true, 'aceptada', false);
  end if;
  if public._tam_equipo(v.team_id) >= 4 then raise exception 'equipo_lleno'; end if;
  if public._equipo_de(v.person_id) is not null then raise exception 'ya_tiene_equipo'; end if;
  if not public._puede_equipo(v.person_id) then raise exception 'no_elegible'; end if;
  insert into public.hack_team_members (team_id, person_id) values (v.team_id, v.person_id);
  update public.team_invites set status = 'aceptada', responded_at = now() where id = v.id;
  update public.team_invites set status = 'cancelada', responded_at = now() where person_id = v.person_id and status = 'pendiente' and id <> v.id;
  update public.people set buscando_equipo = false where id = v.person_id;
  return jsonb_build_object('ok', true, 'aceptada', true, 'team_id', v.team_id);
end $$;

create or replace function public.equipo_salir() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams; trk public.tracks; sig uuid;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then return jsonb_build_object('ok', true, 'tenia', false); end if;
  select * into t from public.hack_teams where id = tm for update;
  select * into trk from public.tracks where slug = t.track_slug;
  if trk.closes_at is not null and now() > trk.closes_at then raise exception 'track_cerrado'; end if;
  delete from public.hack_team_members where person_id = per.id;
  select person_id into sig from public.hack_team_members where team_id = tm order by joined_at limit 1;
  if sig is null then delete from public.hack_teams where id = tm;
  elsif t.leader_id = per.id then update public.hack_teams set leader_id = sig where id = tm; end if;
  return jsonb_build_object('ok', true, 'tenia', true);
end $$;
