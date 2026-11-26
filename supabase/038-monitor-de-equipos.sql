-- 038 · /monitor: la organización ve cómo se van formando los equipos.
--
-- Solo la cuenta de la organización (sorteo_admins). Es de lectura: no cambia nada. Incluye el contacto de quienes ya
-- están en un equipo, para poder ayudarles. Idempotente.

create or replace function public.org_equipos() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare corte int;
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  select e.number into corte from public.enrollments e
   where e.offering_slug = 'hack' and e.attendance in ('pendiente', 'confirmado') and e.number is not null
   order by e.number offset (select greatest(capacity - 1, 0) from public.offerings where slug = 'hack') limit 1;
  return (
    with listos as (   -- quienes pueden estar en un equipo (mismas reglas que _puede_equipo)
      select p.id, p.buscando_equipo from public.enrollments e join public.people p on p.id = e.person_id
      where e.offering_slug = 'hack' and (e.attendance = 'confirmado' or (e.attendance = 'pendiente' and e.redeemed_at is not null))
        and (corte is null or e.number is null or e.number <= corte)
    ), equipos as (
      select t.id, t.name, t.description, t.buscando, t.abierto, t.leader_id, t.created_at, tr.sponsor_name,
             (select count(*)::int from public.hack_team_members m where m.team_id = t.id) n
      from public.hack_teams t left join public.tracks tr on tr.slug = t.track_slug
    )
    select jsonb_build_object(
      'resumen', jsonb_build_object(
        'equipos', (select count(*) from equipos),
        'solos', (select count(*) from equipos where n = 1),
        'listos', (select count(*) from equipos where n >= 2),
        'completos', (select count(*) from equipos where n >= 4),
        'pueden', (select count(*) from listos),
        'en_equipo', (select count(*) from public.hack_team_members),
        'sin_equipo', (select count(*) from listos l where not exists (select 1 from public.hack_team_members m where m.person_id = l.id)),
        'buscando', (select count(*) from listos l where l.buscando_equipo and not exists (select 1 from public.hack_team_members m where m.person_id = l.id)),
        'pendientes', (select count(*) from public.team_invites where status = 'pendiente')),
      'equipos', coalesce((select jsonb_agg(jsonb_build_object(
          'id', q.id, 'nombre', q.name, 'descripcion', q.description, 'buscando', q.buscando, 'abierto', q.abierto, 'n', q.n,
          'track', q.sponsor_name, 'creado', q.created_at,
          'pendientes', (select count(*) from public.team_invites v where v.team_id = q.id and v.status = 'pendiente'),
          'miembros', (select jsonb_agg(jsonb_build_object('nombre', coalesce(p.display_name, p.name), 'universidad', i.short_name,
              'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end,
              'lider', p.id = q.leader_id, 'correo', p.email, 'celular', p.phone) order by (p.id = q.leader_id) desc, m.joined_at)
            from public.hack_team_members m join public.people p on p.id = m.person_id
            left join public.institutions i on i.id = p.institution_id left join public.careers c on c.id = p.career_id
            where m.team_id = q.id)
        ) order by q.created_at desc) from equipos q), '[]'::jsonb))
  );
end $$;

revoke all on function public.org_equipos() from public, anon, authenticated;
grant execute on function public.org_equipos() to authenticated;
