-- 027 · El panel muestra el equipo aunque todavía no tenga track
--
-- Con la plataforma de equipos (024) un equipo se arma ANTES de elegir track: su track_slug es null hasta el viernes 27.
-- my_overview unía los equipos con la tabla tracks con un join interno, así que un equipo sin track no aparecía en el panel
-- («Todavía no tienes equipo»). Ahora el join es externo y track_name viaja como null mientras no haya track.
-- Es lo mismo que my_overview de 017, solo cambia ese join.

CREATE OR REPLACE FUNCTION public.my_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  uid uuid := auth.uid();
  per record;
begin
  if uid is null then return null; end if;

  select pe.*, i.name as inst_name, c.name as career_name, c.slug as career_slug
    into per
  from public.people pe
  left join public.institutions i on i.id = pe.institution_id
  left join public.careers c on c.id = pe.career_id
  where pe.auth_user_id = uid;
  if not found then return jsonb_build_object('person', null); end if;

  return jsonb_build_object(
    'person', jsonb_build_object(
      'id', per.id, 'name', per.name, 'display_name', coalesce(per.display_name, per.name),
      'email', per.email, 'phone', per.phone,
      'career_id', per.career_id,
      'career', case when per.career_slug = 'otra' then coalesce(per.career_other, per.career_name) else per.career_name end,
      'career_other', per.career_other,
      'cycle', per.cycle,
      'level', per.level, 'affiliation', per.affiliation, 'photo_url', per.photo_url,
      'linkedin_url', per.linkedin_url, 'github_url', per.github_url,
      'discord_username', per.discord_username,
      'sponsors_consent', per.sponsors_consent,
      'institution', per.inst_name,
      'verified', (per.institution_id is not null and per.dni_hash is not null)),
    'enrollments', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', e.offering_slug, 'number', e.number,
               'code', case when e.offering_slug = 'hack' and public._hack_en_espera(per.id) then null else e.access_code end,
               'waiting', (e.offering_slug = 'hack' and public._hack_en_espera(per.id)),
               'position', case when e.offering_slug = 'hack' then public._hack_posicion(per.id) end,
               'redeemed', e.redeemed_at is not null, 'created_at', e.created_at)
             order by o.position)
      from public.enrollments e
      join public.offerings o on o.slug = e.offering_slug
      where e.person_id = per.id), '[]'::jsonb),
    'team', (
      select jsonb_build_object(
        'id', t.id, 'name', t.name, 'track', t.track_slug, 'track_name', tr.name,
        'is_leader', t.leader_id = per.id,
        'members', (select jsonb_agg(jsonb_build_object(
                             'name', coalesce(pp.display_name, pp.name), 'leader', m.person_id = t.leader_id)
                           order by m.joined_at)
                    from public.hack_team_members m
                    join public.people pp on pp.id = m.person_id
                    where m.team_id = t.id))
      from public.hack_team_members tm
      join public.hack_teams t on t.id = tm.team_id
      left join public.tracks tr on tr.slug = t.track_slug
      where tm.person_id = per.id)
  );
end $function$
;
;
