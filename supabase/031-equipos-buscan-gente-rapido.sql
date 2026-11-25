-- 031 · «Personas que buscan equipo», más rápido
--
-- La lista preguntaba por cada persona si estaba en lista de espera, y cada pregunta contaba todas las inscripciones.
-- Con cientos de personas entrando a la vez, esa consulta frenaba a toda la plataforma. Ahora el corte del cupo se calcula
-- una sola vez y se compara por número. Las reglas son las mismas que en _puede_equipo. Idempotente.

create index if not exists enrollments_hack_en_carrera on public.enrollments (number)
  where offering_slug = 'hack' and attendance in ('pendiente', 'confirmado');

create or replace function public.equipos_buscan_gente() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
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
      'ciclo', p.cycle, 'nivel', p.level, 'habilidades', p.habilidades, 'frase', p.frase) order by p.updated_at desc)
    from public.people p
    join public.enrollments e on e.person_id = p.id and e.offering_slug = 'hack'
    left join public.institutions i on i.id = p.institution_id
    left join public.careers c on c.id = p.career_id
    where p.buscando_equipo and p.id <> per.id
      and (e.attendance = 'confirmado' or (e.attendance = 'pendiente' and e.redeemed_at is not null))
      and (corte is null or e.number is null or e.number <= corte)
      and not exists (select 1 from public.hack_team_members m where m.person_id = p.id)), '[]'::jsonb);
end $$;
