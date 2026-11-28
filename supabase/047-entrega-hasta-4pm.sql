-- Entrega ampliada hasta el miércoles 2 de diciembre a las 4:00 p. m. (Lima).
CREATE OR REPLACE FUNCTION public.equipo_entregar(p_repo text, p_slides text, p_idea text, p_video text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare per public.people; tm uuid; r text := nullif(btrim(coalesce(p_repo, '')), ''); s text := nullif(btrim(coalesce(p_slides, '')), ''); i text := nullif(btrim(coalesce(p_idea, '')), ''); v text := nullif(btrim(coalesce(p_video, '')), '');
begin
  -- plazo de entrega: sáb 28/11 00:00 → mié 2/12 4:00 p. m. (Lima), ampliado 12 h por la demora de los datos
  if now() < timestamptz '2026-11-28 00:00:00-05' or now() > timestamptz '2026-12-02 16:00:00-05' then raise exception 'entrega_cerrada'; end if;
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  if not public._url_ok(r, 'https://') or not public._url_ok(s, 'https://') or not public._url_ok(v, 'https://') then raise exception 'url_invalida'; end if;
  if i is not null and char_length(i) > 1500 then raise exception 'idea_larga'; end if;
  update public.hack_teams set repo_url = r, slides_url = s, idea = i, video_url = v, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true);
end $function$;
