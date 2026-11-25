-- 030 · Casos que faltaban en la plataforma de equipos
--
--   · El líder puede eliminar su equipo y quitar integrantes (mientras la plataforma esté abierta).
--   · Quien libera su lugar en la hackathon (o lo pierde por plazo) sale solo de su equipo; el liderazgo pasa o el equipo se borra.
--   · Al completarse un equipo se cancelan sus pendientes. Invitar a quien ya pidió entrar (y al revés) lo dice claramente.
--   · Dos envíos a la vez ya no devuelven un error genérico.
-- Idempotente.

-- Sacar a una persona de su equipo (uso interno).
create or replace function public._equipo_retirar(p_person uuid) returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare tm uuid; t public.hack_teams; sig uuid;
begin
  tm := public._equipo_de(p_person);
  if tm is null then return false; end if;
  select * into t from public.hack_teams where id = tm for update;
  delete from public.hack_team_members where person_id = p_person and team_id = tm;
  select person_id into sig from public.hack_team_members where team_id = tm order by joined_at limit 1;
  if sig is null then delete from public.hack_teams where id = tm;
  elsif t.leader_id = p_person then update public.hack_teams set leader_id = sig, updated_at = now() where id = tm; end if;
  return true;
end $$;

create or replace function public.equipo_eliminar() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  select * into t from public.hack_teams where id = tm for update;
  if t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  delete from public.hack_teams where id = tm;   -- integrantes e invitaciones se borran con él
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.equipo_quitar(p_person uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  select * into t from public.hack_teams where id = tm for update;
  if t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  if p_person = per.id or public._equipo_de(p_person) is distinct from tm then raise exception 'persona_no_disponible'; end if;
  delete from public.hack_team_members where person_id = p_person and team_id = tm;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public._equipo_al_liberar() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  perform public._equipo_retirar(new.person_id);
  update public.team_invites set status = 'cancelada', responded_at = now() where person_id = new.person_id and status = 'pendiente';
  return new;
end $$;

drop trigger if exists equipo_al_liberar on public.enrollments;
create trigger equipo_al_liberar after update of attendance on public.enrollments
  for each row when (new.offering_slug = 'hack' and new.attendance in ('no_participa', 'vencido') and old.attendance is distinct from new.attendance)
  execute function public._equipo_al_liberar();

create or replace function public.equipo_crear(p_nombre text, p_descripcion text, p_buscando text[]) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g'); tid uuid;
        permitidas constant text[] := array['frontend','backend','datos_ia','diseno','negocio','pitch','movil','devops'];
        b text[] := coalesce(p_buscando, '{}'); d text := nullif(btrim(coalesce(p_descripcion, '')), '');
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  if not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  if public._equipo_de(per.id) is not null then raise exception 'ya_tiene_equipo'; end if;
  if char_length(nombre) < 3 or char_length(nombre) > 40 then raise exception 'nombre_invalido'; end if;
  if d is not null and char_length(d) > 240 then raise exception 'descripcion_larga'; end if;
  if cardinality(b) > 5 or exists (select 1 from unnest(b) x where x <> all (permitidas)) then raise exception 'habilidad_invalida'; end if;
  if exists (select 1 from public.hack_teams where lower(name) = lower(nombre)) then raise exception 'nombre_repetido'; end if;
  insert into public.hack_teams (name, description, buscando, leader_id) values (nombre, d, b, per.id) returning id into tid;
  insert into public.hack_team_members (team_id, person_id) values (tid, per.id);
  -- ya tiene equipo: se cancelan sus solicitudes e invitaciones pendientes
  update public.team_invites set status = 'cancelada', responded_at = now() where person_id = per.id and status = 'pendiente';
  update public.people set buscando_equipo = false where id = per.id;
  return jsonb_build_object('ok', true, 'team_id', tid);
exception when unique_violation then   -- dos envíos a la vez: mismo nombre, o la misma persona ya entró a otro equipo
  if public._equipo_de(per.id) is not null then raise exception 'ya_tiene_equipo'; end if;
  raise exception 'nombre_repetido';
end $$;

create or replace function public.equipo_invitar(p_person uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  select * into t from public.hack_teams where id = tm;
  if t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if public._tam_equipo(tm) >= 4 then raise exception 'equipo_lleno'; end if;
  if not public._puede_equipo(p_person) or public._equipo_de(p_person) is not null or p_person = per.id then raise exception 'persona_no_disponible'; end if;
  if exists (select 1 from public.team_invites where team_id = tm and person_id = p_person and status = 'pendiente' and kind = 'solicitud') then raise exception 'ya_te_pidio'; end if;
  if exists (select 1 from public.team_invites where team_id = tm and person_id = p_person and status = 'pendiente') then raise exception 'ya_invitado'; end if;
  insert into public.team_invites (team_id, person_id, kind) values (tm, p_person, 'invitacion');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.equipo_solicitar(p_team uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  if not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  if public._equipo_de(per.id) is not null then raise exception 'ya_tiene_equipo'; end if;
  select * into t from public.hack_teams where id = p_team;
  if not found or not t.abierto then raise exception 'equipo_inexistente'; end if;
  if public._tam_equipo(p_team) >= 4 then raise exception 'equipo_lleno'; end if;
  if exists (select 1 from public.team_invites where team_id = p_team and person_id = per.id and status = 'pendiente' and kind = 'invitacion') then raise exception 'ya_te_invito'; end if;
  if exists (select 1 from public.team_invites where team_id = p_team and person_id = per.id and status = 'pendiente') then raise exception 'ya_invitado'; end if;
  insert into public.team_invites (team_id, person_id, kind) values (p_team, per.id, 'solicitud');
  return jsonb_build_object('ok', true);
end $$;

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
  if public._equipo_de(v.person_id) is not null then
    if v.kind = 'solicitud' then raise exception 'persona_no_disponible'; end if;
    raise exception 'ya_tiene_equipo';
  end if;
  if not public._puede_equipo(v.person_id) then raise exception 'no_elegible'; end if;
  insert into public.hack_team_members (team_id, person_id) values (v.team_id, v.person_id);
  update public.team_invites set status = 'aceptada', responded_at = now() where id = v.id;
  update public.team_invites set status = 'cancelada', responded_at = now() where person_id = v.person_id and status = 'pendiente' and id <> v.id;
  update public.people set buscando_equipo = false where id = v.person_id;
  -- equipo completo: lo que quedaba pendiente de este equipo ya no puede aceptarse
  if public._tam_equipo(v.team_id) >= 4 then
    update public.team_invites set status = 'cancelada', responded_at = now() where team_id = v.team_id and status = 'pendiente';
  end if;
  return jsonb_build_object('ok', true, 'aceptada', true, 'team_id', v.team_id);
exception when unique_violation then   -- la persona entró a otro equipo en ese mismo instante
  raise exception 'persona_no_disponible';
end $$;

create or replace function public.equipo_pendientes() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare per public.people; tm uuid;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  return jsonb_build_object(
    'recibidas', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'equipo', t.name, 'equipo_id', t.id, 'n', public._tam_equipo(t.id), 'descripcion', t.description,
              'lider', (select coalesce(p.display_name, p.name) from public.people p where p.id = t.leader_id)) order by v.created_at desc)
              from public.team_invites v join public.hack_teams t on t.id = v.team_id where v.person_id = per.id and v.kind = 'invitacion' and v.status = 'pendiente'), '[]'::jsonb),
    'enviadas', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'equipo', t.name, 'equipo_id', t.id) order by v.created_at desc)
              from public.team_invites v join public.hack_teams t on t.id = v.team_id where v.person_id = per.id and v.kind = 'solicitud' and v.status = 'pendiente'), '[]'::jsonb),
    'solicitudes', case when tm is not null and (select leader_id from public.hack_teams where id = tm) = per.id then coalesce((
              select jsonb_agg(jsonb_build_object('id', v.id, 'persona_id', p.id, 'nombre', coalesce(p.display_name, p.name), 'universidad', i.short_name,
                'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end, 'ciclo', p.cycle, 'nivel', p.level, 'habilidades', p.habilidades, 'frase', p.frase) order by v.created_at)
              from public.team_invites v join public.people p on p.id = v.person_id left join public.institutions i on i.id = p.institution_id left join public.careers c on c.id = p.career_id
              where v.team_id = tm and v.kind = 'solicitud' and v.status = 'pendiente'), '[]'::jsonb) else '[]'::jsonb end,
    'invitadas', case when tm is not null and (select leader_id from public.hack_teams where id = tm) = per.id then coalesce((
              select jsonb_agg(jsonb_build_object('id', v.id, 'persona_id', p.id, 'nombre', coalesce(p.display_name, p.name)) order by v.created_at)
              from public.team_invites v join public.people p on p.id = v.person_id where v.team_id = tm and v.kind = 'invitacion' and v.status = 'pendiente'), '[]'::jsonb) else '[]'::jsonb end);
end $$;

revoke all on function public._equipo_retirar(uuid), public._equipo_al_liberar() from public, anon, authenticated;
revoke all on function public.equipo_eliminar(), public.equipo_quitar(uuid) from public, anon;
grant execute on function public.equipo_eliminar(), public.equipo_quitar(uuid) to authenticated;
