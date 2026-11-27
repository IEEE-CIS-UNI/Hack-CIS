-- A pedido de los equipos: quien invita o recibe una solicitud ve el usuario de Discord (no el correo ni el celular)
-- para conversar antes de decidir. Solo de quienes activaron «Busco equipo» o pidieron unirse.
CREATE OR REPLACE FUNCTION public.equipos_buscan_gente()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare per public.people; corte int;
begin
  per := public._yo();
  if per.id is null or not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  -- número de la última persona con cupo (null si sobran cupos)
  select e.number into corte from public.enrollments e
   where e.offering_slug = 'hack' and e.attendance in ('pendiente', 'confirmado') and e.number is not null
   order by e.number
   offset (select greatest(capacity - 1, 0) from public.offerings where slug = 'hack') limit 1;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'nombre', coalesce(p.display_name, p.name), 'universidad', i.short_name, 'universidad_nombre', i.name,
      'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end, 'area', c.field,
      'ciclo', p.cycle, 'nivel', p.level, 'habilidades', p.habilidades, 'frase', p.frase, 'discord', nullif(btrim(p.discord_username), '')) order by p.updated_at desc)
    from public.people p
    join public.enrollments e on e.person_id = p.id and e.offering_slug = 'hack'
    left join public.institutions i on i.id = p.institution_id
    left join public.careers c on c.id = p.career_id
    where p.buscando_equipo and p.id <> per.id
      and (e.attendance = 'confirmado' or (e.attendance = 'pendiente' and e.redeemed_at is not null))
      and (corte is null or e.number is null or e.number <= corte)
      and not exists (select 1 from public.hack_team_members m where m.person_id = p.id)), '[]'::jsonb);
end $function$;

CREATE OR REPLACE FUNCTION public.equipo_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
                'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end, 'ciclo', p.cycle, 'nivel', p.level, 'habilidades', p.habilidades, 'frase', p.frase, 'discord', nullif(btrim(p.discord_username), '')) order by v.created_at)
              from public.team_invites v join public.people p on p.id = v.person_id left join public.institutions i on i.id = p.institution_id left join public.careers c on c.id = p.career_id
              where v.team_id = tm and v.kind = 'solicitud' and v.status = 'pendiente'), '[]'::jsonb) else '[]'::jsonb end,
    'invitadas', case when tm is not null and (select leader_id from public.hack_teams where id = tm) = per.id then coalesce((
              select jsonb_agg(jsonb_build_object('id', v.id, 'persona_id', p.id, 'nombre', coalesce(p.display_name, p.name)) order by v.created_at)
              from public.team_invites v join public.people p on p.id = v.person_id where v.team_id = tm and v.kind = 'invitacion' and v.status = 'pendiente'), '[]'::jsonb) else '[]'::jsonb end);
end $function$;
