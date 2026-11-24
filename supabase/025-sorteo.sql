-- Sorteo en vivo del bootcamp (/sorteo).
--
-- Quien participa solo escribe su correo: se valida contra la base (debe estar inscrito en el bootcamp) y entra una sola vez.
-- El sorteo está cerrado hasta que el moderador (cuenta de CIS en sorteo_admins) lo abre. El ganador lo elige SIEMPRE el
-- servidor con aleatoriedad real; la ruleta de la página solo lo muestra.

create table if not exists public.sorteo_config (
  id int primary key default 1 check (id = 1),
  abierto boolean not null default false,
  premios int not null default 3 check (premios between 1 and 20),
  titulo text not null default '3 cursos de WE Educación'
);
insert into public.sorteo_config (id) values (1) on conflict do nothing;

create table if not exists public.sorteo_participantes (
  person_id uuid primary key references public.people(id) on delete cascade,
  creado timestamptz not null default now(),
  orden_ganador int unique,
  ganado_en timestamptz
);

create table if not exists public.sorteo_admins (email text primary key);
insert into public.sorteo_admins (email) values ('ieee.cis@uni.edu.pe') on conflict do nothing;

alter table public.sorteo_config enable row level security;
alter table public.sorteo_participantes enable row level security;
alter table public.sorteo_admins enable row level security;
revoke all on public.sorteo_config, public.sorteo_participantes, public.sorteo_admins from public, anon, authenticated;

-- «Nombre A.» : primer nombre y la inicial del último apellido.
create or replace function public._sorteo_nombre(p_nombre text) returns text
language sql immutable as $$
  with t as (select string_to_array(btrim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g')), ' ') a)
  select case when array_length(a, 1) > 1
    then initcap(lower(a[1])) || ' ' || upper(left(a[array_length(a, 1)], 1)) || '.'
    else initcap(lower(coalesce(a[1], ''))) end from t
$$;

create or replace function public._sorteo_es_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.sorteo_admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;
revoke all on function public._sorteo_nombre(text), public._sorteo_es_admin() from public, anon, authenticated;

-- Lo que ve cualquiera: si está abierto, cuántos participan y quiénes ya ganaron.
-- Para quien modera, además, quiénes siguen en la ruleta (para dibujarla).
create or replace function public.sorteo_estado() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare c public.sorteo_config; admin boolean := public._sorteo_es_admin();
begin
  select * into c from public.sorteo_config;
  return jsonb_build_object(
    'abierto', c.abierto, 'premios', c.premios, 'titulo', c.titulo, 'admin', admin,
    'participantes', (select count(*)::int from public.sorteo_participantes),
    'ganadores', coalesce((select jsonb_agg(public._sorteo_nombre(p.name) order by s.orden_ganador)
                   from public.sorteo_participantes s join public.people p on p.id = s.person_id where s.orden_ganador is not null), '[]'::jsonb),
    'ruleta', case when admin then coalesce((select jsonb_agg(public._sorteo_nombre(p.name) order by s.creado)
                   from public.sorteo_participantes s join public.people p on p.id = s.person_id where s.orden_ganador is null), '[]'::jsonb) end);
end $$;

-- Anotarse con el correo de inscripción. Una sola vez por persona.
create or replace function public.sorteo_participar(p_correo text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare c public.sorteo_config; per public.people; mail text := lower(btrim(coalesce(p_correo, '')));
begin
  select * into c from public.sorteo_config;
  if not c.abierto then raise exception 'sorteo_cerrado'; end if;
  if mail = '' or length(mail) > 200 or mail !~ '^[^@\s]+@[^@\s]+$' then raise exception 'correo_invalido'; end if;
  select * into per from public.people where lower(email) = mail limit 1;
  if per.id is null or not exists (select 1 from public.enrollments where person_id = per.id and offering_slug like 'bootcamp-%') then
    raise exception 'no_inscrito';
  end if;
  if exists (select 1 from public.sorteo_participantes where person_id = per.id) then raise exception 'ya_participa'; end if;
  insert into public.sorteo_participantes (person_id) values (per.id);
  return jsonb_build_object('nombre', public._sorteo_nombre(per.name));
end $$;

-- ───────── moderación ─────────
create or replace function public.sorteo_abrir(p_abierto boolean) returns boolean
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  update public.sorteo_config set abierto = p_abierto where id = 1;
  return p_abierto;
end $$;

-- Elige un ganador entre quienes siguen en la ruleta y lo deja registrado.
create or replace function public.sorteo_girar() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare c public.sorteo_config; elegido uuid; n int; ord int; idx int;
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  select * into c from public.sorteo_config;
  select count(*) into n from public.sorteo_participantes where orden_ganador is not null;
  if n >= c.premios then raise exception 'sorteo_completo'; end if;
  select person_id into elegido from public.sorteo_participantes where orden_ganador is null order by random() limit 1;
  if elegido is null then raise exception 'sin_participantes'; end if;
  ord := n + 1;
  -- lugar que ocupaba en la ruleta (mismo orden que sorteo_estado.ruleta) para que la animación caiga en su casilla
  idx := (select count(*)::int from public.sorteo_participantes where orden_ganador is null
            and creado < (select creado from public.sorteo_participantes where person_id = elegido));
  update public.sorteo_participantes set orden_ganador = ord, ganado_en = now() where person_id = elegido;
  return jsonb_build_object('orden', ord, 'indice', idx, 'nombre', (select public._sorteo_nombre(name) from public.people where id = elegido));
end $$;

-- Datos de contacto de quienes ganaron (para escribirles después).
create or replace function public.sorteo_ganadores_contacto() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('orden', s.orden_ganador, 'nombre', p.name, 'correo', p.email, 'celular', p.phone) order by s.orden_ganador)
    from public.sorteo_participantes s join public.people p on p.id = s.person_id where s.orden_ganador is not null), '[]'::jsonb);
end $$;

-- Vuelve a cero (ensayos): borra participantes y ganadores y deja el sorteo cerrado.
create or replace function public.sorteo_reiniciar() returns boolean
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public._sorteo_es_admin() then raise exception 'no_admin'; end if;
  delete from public.sorteo_participantes where true;
  update public.sorteo_config set abierto = false where id = 1;
  return true;
end $$;

revoke all on function public.sorteo_estado(), public.sorteo_participar(text), public.sorteo_abrir(boolean), public.sorteo_girar(),
  public.sorteo_ganadores_contacto(), public.sorteo_reiniciar() from public, anon, authenticated;
grant execute on function public.sorteo_estado(), public.sorteo_participar(text) to anon, authenticated;
grant execute on function public.sorteo_abrir(boolean), public.sorteo_girar(), public.sorteo_ganadores_contacto(), public.sorteo_reiniciar() to authenticated;
