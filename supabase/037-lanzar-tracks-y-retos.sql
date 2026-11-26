-- 037 · Lanzar la elección de track desde /lanzar y revelar los retos recién al abrirse.
--
--   · Solo la cuenta de la organización (sorteo_admins) puede lanzar, cancelar y escribir los retos.
--   · El texto de cada reto vive en track_retos, sin lectura directa: track_reto() lo entrega SOLO si el track ya abrió.
--   · Cancelar vuelve a la hora de respaldo mientras no haya abierto, o si abrió y todavía ningún equipo eligió.
-- Idempotente.

create table if not exists public.track_retos (
  slug        text primary key references public.tracks(slug) on delete cascade,
  titulo      text,
  detalle     text,
  enlace      text,
  actualizado timestamptz not null default now()
);
alter table public.track_retos enable row level security;
revoke all on public.track_retos from public, anon, authenticated;

create or replace function public.track_reto(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('titulo', r.titulo, 'detalle', r.detalle, 'enlace', r.enlace)
  from public.track_retos r join public.tracks t on t.slug = r.slug
  where r.slug = p_slug and t.revealed and t.opens_at is not null and now() >= t.opens_at
    and (r.titulo is not null or r.detalle is not null)
$$;

create or replace function public.tracks_panel() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  return jsonb_build_object('ahora', now(), 'equipos', (select count(*)::int from public.hack_teams),
    'listos', (select count(*)::int from public.hack_teams h where public._tam_equipo(h.id) >= 2),
    'tracks', (select jsonb_agg(jsonb_build_object('slug', t.slug, 'nombre', t.name, 'sponsor', t.sponsor_name,
        'abre', t.opens_at, 'cierra', t.closes_at, 'tope', t.tope,
        'ocupados', (select count(*)::int from public.hack_teams h where h.track_slug = t.slug),
        'reto', (select jsonb_build_object('titulo', r.titulo, 'detalle', r.detalle, 'enlace', r.enlace) from public.track_retos r where r.slug = t.slug)
      ) order by t.position) from public.tracks t where t.revealed));
end $$;

create or replace function public.tracks_guardar_reto(p_slug text, p_titulo text, p_detalle text, p_enlace text) returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare u text := nullif(btrim(coalesce(p_enlace, '')), '');
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  if not exists (select 1 from public.tracks where slug = p_slug) then raise exception 'track_inexistente'; end if;
  if u is not null and (u !~* '^https://[^\s]+$' or char_length(u) > 500) then raise exception 'url_invalida'; end if;
  if char_length(coalesce(p_titulo, '')) > 160 or char_length(coalesce(p_detalle, '')) > 6000 then raise exception 'texto_largo'; end if;
  insert into public.track_retos (slug, titulo, detalle, enlace)
  values (p_slug, nullif(btrim(coalesce(p_titulo, '')), ''), nullif(btrim(coalesce(p_detalle, '')), ''), u)
  on conflict (slug) do update set titulo = excluded.titulo, detalle = excluded.detalle, enlace = excluded.enlace, actualizado = now();
  return true;
end $$;

-- Abre los tres tracks dentro de p_minutos (0 = ahora). No toca los que ya están abiertos.
create or replace function public.tracks_lanzar(p_minutos int) returns int
language plpgsql security definer set search_path = public, auth as $$
declare n int;
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  if p_minutos is null or p_minutos < 0 or p_minutos > 60 then raise exception 'minutos_invalidos'; end if;
  update public.tracks set opens_at = date_trunc('second', now()) + make_interval(mins => p_minutos) where revealed and opens_at > now();
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.tracks_cancelar() returns int
language plpgsql security definer set search_path = public, auth as $$
declare n int;
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  update public.tracks set opens_at = timestamptz '2026-11-27 23:59:00-05'
   where revealed and now() < timestamptz '2026-11-27 23:59:00-05'
     and (opens_at > now() or not exists (select 1 from public.hack_teams where track_slug is not null));
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.track_reto(text), public.tracks_panel(), public.tracks_guardar_reto(text, text, text, text), public.tracks_lanzar(int), public.tracks_cancelar() from public, anon, authenticated;
grant execute on function public.track_reto(text) to anon, authenticated;
grant execute on function public.tracks_panel(), public.tracks_guardar_reto(text, text, text, text), public.tracks_lanzar(int), public.tracks_cancelar() to authenticated;
