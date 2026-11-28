-- Material de apoyo por track («Data del reto»). Los enlaces y archivos se cargan directo en la base (no van al repositorio).
-- Lo ve quien inició sesión y tiene cupo en la hackathon; lo marcado «solo_equipo», solo los equipos que eligieron ese track.
create table if not exists public.track_materiales (
  id bigint generated always as identity primary key,
  track_slug text not null references public.tracks(slug) on update cascade,
  orden int not null default 0,
  titulo text not null,
  detalle text,
  url text check (url is null or url like 'https://%'),
  nombre_archivo text,
  contenido text,
  solo_equipo boolean not null default false,
  tipo text not null default 'data' check (tipo in ('data', 'canal')),
  creado timestamptz not null default now(),
  unique (track_slug, titulo)
);
alter table public.track_materiales enable row level security;
revoke all on public.track_materiales from public, anon, authenticated;

create or replace function public.track_material(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare per public.people; admin boolean := public._sorteo_es_admin(); en_track boolean := false;
begin
  per := public._yo();
  if not admin then
    if per.id is null or not exists (select 1 from public.enrollments e where e.person_id = per.id and e.offering_slug = 'hack'
         and e.attendance in ('pendiente', 'confirmado')) or public._hack_en_espera(per.id) then
      return jsonb_build_object('estado', 'sin_cupo');
    end if;
  end if;
  if per.id is not null then
    en_track := exists (select 1 from public.hack_teams t where t.id = public._equipo_de(per.id) and t.track_slug = p_slug);
  end if;
  return jsonb_build_object('estado', 'ok',
    'items', coalesce((select jsonb_agg(jsonb_build_object('titulo', m.titulo, 'detalle', m.detalle, 'url', m.url,
        'archivo', m.nombre_archivo, 'contenido', m.contenido, 'confidencial', m.solo_equipo, 'tipo', m.tipo) order by m.orden, m.id)
      from public.track_materiales m where m.track_slug = p_slug and (admin or en_track or not m.solo_equipo)), '[]'::jsonb),
    'bloqueados', (select count(*)::int from public.track_materiales m where m.track_slug = p_slug and m.tipo = 'data' and m.solo_equipo and not (admin or en_track)),
    'canal_bloqueado', exists (select 1 from public.track_materiales m where m.track_slug = p_slug and m.tipo = 'canal' and m.solo_equipo and not (admin or en_track)));
end $$;
revoke all on function public.track_material(text) from public, anon;
grant execute on function public.track_material(text) to authenticated;
