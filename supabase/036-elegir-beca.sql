-- 036 · Los ganadores de un sorteo eligen su beca en /elige.
--
--   · Cada ganador queda anotado en sorteo_premios (sobrevive a «Reiniciar» el sorteo).
--   · Entra con el correo de su inscripción; quien elige primero, escoge primero, mientras queden cupos del curso.
--   · Se elige una sola vez. Quien no ganó no ve nada.
-- Idempotente.

create table if not exists public.sorteo_cursos (
  aliado text not null,
  nombre text not null,
  cupos  int  not null check (cupos >= 0),
  orden  int  not null default 0,
  primary key (aliado, nombre)
);
insert into public.sorteo_cursos (aliado, nombre, cupos, orden) values
  ('mayugo', 'Excel Avanzado', 4, 1),
  ('mayugo', 'Optimización Industrial con Modelamiento Matemático', 3, 2),
  ('mayugo', 'Métodos de pronósticos', 3, 3),
  ('mayugo', 'Programación de rutas', 3, 4),
  ('mayugo', 'Flujo de caja para la evaluación de proyectos', 3, 5),
  ('mayugo', 'Finanzas para ingenieros', 2, 6),
  ('mayugo', 'Habilidades blandas para la dirección de personas', 2, 7)
on conflict (aliado, nombre) do nothing;

create table if not exists public.sorteo_premios (
  id         bigint generated always as identity primary key,
  person_id  uuid not null references public.people(id) on delete cascade,
  aliado     text not null,
  sorteo     text not null,
  ganado_en  timestamptz not null default now(),
  curso      text,
  elegido_en timestamptz,
  unique (person_id, sorteo)
);
alter table public.sorteo_cursos enable row level security;
alter table public.sorteo_premios enable row level security;
revoke all on public.sorteo_cursos, public.sorteo_premios from public, anon, authenticated;

-- Al salir en la ruleta, la persona queda anotada como ganadora.
create or replace function public._sorteo_anotar_premio() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare titulo_ text;
begin
  select titulo into titulo_ from public.sorteo_config;
  if titulo_ ilike '%mayugo%' then
    insert into public.sorteo_premios (person_id, aliado, sorteo) values (new.person_id, 'mayugo', titulo_)
    on conflict (person_id, sorteo) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists sorteo_anotar_premio on public.sorteo_participantes;
create trigger sorteo_anotar_premio after update of orden_ganador on public.sorteo_participantes
  for each row when (new.orden_ganador is not null) execute function public._sorteo_anotar_premio();

-- El premio de quien escribe ese correo (primero el que falte elegir). Null si no ganó.
create or replace function public._premio_de(p_correo text) returns public.sorteo_premios
language sql stable security definer set search_path = public as $$
  select s from public.sorteo_premios s join public.people p on p.id = s.person_id
  where lower(p.email) = lower(btrim(coalesce(p_correo, '')))
  order by (s.curso is null) desc, s.ganado_en desc limit 1
$$;

create or replace function public.elige_estado(p_correo text) returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare g public.sorteo_premios; nombre_ text;
begin
  g := public._premio_de(p_correo);
  if g.id is null then raise exception 'no_ganador'; end if;
  select coalesce(display_name, name) into nombre_ from public.people where id = g.person_id;
  return jsonb_build_object('nombre', nombre_, 'curso', g.curso,
    'cursos', (select jsonb_agg(jsonb_build_object('nombre', c.nombre,
        'quedan', greatest(c.cupos - (select count(*) from public.sorteo_premios x where x.aliado = c.aliado and x.curso = c.nombre), 0)) order by c.orden)
      from public.sorteo_cursos c where c.aliado = g.aliado));
end $$;

create or replace function public.elige_curso(p_correo text, p_curso text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare g public.sorteo_premios; c public.sorteo_cursos; usados int;
begin
  perform pg_advisory_xact_lock(hashtext('elige_curso'));   -- una elección a la vez: el último cupo no se entrega dos veces
  g := public._premio_de(p_correo);
  if g.id is null then raise exception 'no_ganador'; end if;
  if g.curso is not null then raise exception 'ya_elegiste'; end if;
  select * into c from public.sorteo_cursos where aliado = g.aliado and nombre = p_curso;
  if not found then raise exception 'curso_invalido'; end if;
  select count(*) into usados from public.sorteo_premios where aliado = g.aliado and curso = p_curso;
  if usados >= c.cupos then raise exception 'curso_agotado'; end if;
  update public.sorteo_premios set curso = p_curso, elegido_en = now() where id = g.id;
  return public.elige_estado(p_correo);
end $$;

-- Para quien modera: quién ganó y qué eligió.
create or replace function public.sorteo_elecciones() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('nombre', p.name, 'correo', p.email, 'celular', p.phone, 'curso', s.curso) order by s.ganado_en)
    from public.sorteo_premios s join public.people p on p.id = s.person_id), '[]'::jsonb);
end $$;

revoke all on function public._sorteo_anotar_premio(), public._premio_de(text), public.elige_estado(text), public.elige_curso(text, text), public.sorteo_elecciones() from public, anon, authenticated;
grant execute on function public.elige_estado(text), public.elige_curso(text, text) to anon, authenticated;
grant execute on function public.sorteo_elecciones() to authenticated;
