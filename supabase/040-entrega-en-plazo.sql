-- La entrega del proyecto solo se puede guardar dentro del plazo de las 100 horas.
create or replace function public.equipo_entregar(p_repo text, p_slides text, p_idea text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; r text := nullif(btrim(coalesce(p_repo, '')), ''); s text := nullif(btrim(coalesce(p_slides, '')), ''); i text := nullif(btrim(coalesce(p_idea, '')), '');
begin
  -- solo durante las 100 horas: sáb 28/11 00:00 → mié 2/12 4:00 a. m. (Lima)
  if now() < timestamptz '2026-11-28 00:00:00-05' or now() > timestamptz '2026-12-02 04:00:00-05' then raise exception 'entrega_cerrada'; end if;
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  if not public._url_ok(r, 'https://') or not public._url_ok(s, 'https://') then raise exception 'url_invalida'; end if;
  if i is not null and char_length(i) > 1500 then raise exception 'idea_larga'; end if;
  update public.hack_teams set repo_url = r, slides_url = s, idea = i, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true);
end $$;
