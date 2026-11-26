-- La entrega pide además el video demo (máximo 1 minuto): se guarda su enlace.
alter table public.hack_teams add column if not exists video_url text;

-- se reemplaza la versión de 3 parámetros; p_video es opcional para no romper páginas ya abiertas
drop function if exists public.equipo_entregar(text, text, text);
CREATE OR REPLACE FUNCTION public.equipo_entregar(p_repo text, p_slides text, p_idea text, p_video text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare per public.people; tm uuid; r text := nullif(btrim(coalesce(p_repo, '')), ''); s text := nullif(btrim(coalesce(p_slides, '')), ''); i text := nullif(btrim(coalesce(p_idea, '')), ''); v text := nullif(btrim(coalesce(p_video, '')), '');
begin
  -- solo durante las 100 horas: sáb 28/11 00:00 → mié 2/12 4:00 a. m. (Lima)
  if now() < timestamptz '2026-11-28 00:00:00-05' or now() > timestamptz '2026-12-02 04:00:00-05' then raise exception 'entrega_cerrada'; end if;
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  if not public._url_ok(r, 'https://') or not public._url_ok(s, 'https://') or not public._url_ok(v, 'https://') then raise exception 'url_invalida'; end if;
  if i is not null and char_length(i) > 1500 then raise exception 'idea_larga'; end if;
  update public.hack_teams set repo_url = r, slides_url = s, idea = i, video_url = v, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true);
end $function$;
revoke all on function public.equipo_entregar(text, text, text, text) from public, anon;
grant execute on function public.equipo_entregar(text, text, text, text) to authenticated;

CREATE OR REPLACE FUNCTION public.mi_equipo_detalle()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare per public.people; tm uuid; t public.hack_teams; tr public.tracks;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then return null; end if;
  select * into t from public.hack_teams where id = tm;
  select * into tr from public.tracks where slug = t.track_slug;
  return jsonb_build_object(
    'id', t.id, 'nombre', t.name, 'descripcion', t.description, 'buscando', t.buscando, 'abierto', t.abierto,
    'soy_lider', t.leader_id = per.id, 'n', public._tam_equipo(tm),
    'track', case when tr.slug is null then null else jsonb_build_object('slug', tr.slug, 'nombre', tr.name, 'sponsor', tr.sponsor_name, 'cierra', tr.closes_at, 'abre', tr.opens_at) end,
    'whatsapp_url', t.whatsapp_url, 'repo_url', t.repo_url, 'slides_url', t.slides_url, 'video_url', t.video_url, 'idea', t.idea,
    'miembros', (select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nombre', coalesce(p.display_name, p.name), 'lider', p.id = t.leader_id, 'yo', p.id = per.id,
        'universidad', i.short_name, 'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end, 'ciclo', p.cycle,
        'correo', p.email, 'celular', p.phone, 'discord', p.discord_username, 'linkedin', p.linkedin_url, 'github', p.github_url,
        'habilidades', p.habilidades) order by m.joined_at)
      from public.hack_team_members m join public.people p on p.id = m.person_id
      left join public.institutions i on i.id = p.institution_id left join public.careers c on c.id = p.career_id where m.team_id = tm));
end $function$;
