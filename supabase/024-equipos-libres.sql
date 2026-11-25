-- 024 · Plataforma para armar equipos (/equipos)
--
-- Hasta ahora el líder creaba el equipo ya dentro de un track, poniendo los DNI de sus compañeros (create_team). Ahora los equipos
-- se arman ANTES de elegir track: cada persona con cupo confirmado puede crear un equipo, invitar a otras o pedir unirse, y el
-- viernes el líder elige el track (equipo_elegir_track). create_team se queda como estaba (no se rompe nada), pero la interfaz
-- pasa a usar estas funciones.
--
-- Reglas:
--   · Solo forman equipo quienes tienen CUPO confirmado: botón de confirmar o código de Discord canjeado, y no en lista de espera.
--   · Se abre el miércoles 25/11 20:00 y se puede crear y unirse hasta el jueves 26/11 23:59 (hora de Lima). Las fechas viven en
--     la tabla equipos_config.
--   · De 2 a 4 personas. Una persona, un equipo. El líder invita o acepta solicitudes; cada quien acepta sus invitaciones.
--   · Los datos de contacto (correo, celular, Discord, LinkedIn, GitHub) los ven SOLO los integrantes del mismo equipo.
--   · Todo pasa por funciones: las tablas no se leen ni se escriben directo (RLS sin políticas).
-- Idempotente.

-- ───────── fechas ─────────
create table if not exists public.equipos_config (
  id     boolean primary key default true check (id),
  abre   timestamptz not null,
  cierra timestamptz not null
);
-- Personas que ven la plataforma abierta ANTES de la fecha (solo para probarla con cuentas falsas). Vacía en producción.
alter table public.equipos_config add column if not exists prueba_personas uuid[] not null default '{}';
insert into public.equipos_config (abre, cierra) values ('2026-11-25 20:00:00-05', '2026-11-26 23:59:59-05') on conflict (id) do nothing;
alter table public.equipos_config enable row level security;
revoke all on public.equipos_config from anon, authenticated;

-- ───────── columnas nuevas ─────────
alter table public.hack_teams alter column track_slug drop not null;
alter table public.hack_teams
  add column if not exists description text,
  add column if not exists buscando    text[] not null default '{}',
  add column if not exists abierto     boolean not null default true,
  add column if not exists whatsapp_url text,
  add column if not exists repo_url    text,
  add column if not exists slides_url  text,
  add column if not exists idea        text,
  add column if not exists updated_at  timestamptz not null default now();
create unique index if not exists hack_teams_nombre_unico on public.hack_teams (lower(name));

alter table public.people
  add column if not exists buscando_equipo boolean not null default false,
  add column if not exists habilidades     text[]  not null default '{}',
  add column if not exists frase           text;

create table if not exists public.team_invites (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.hack_teams(id) on delete cascade,
  person_id    uuid not null references public.people(id) on delete cascade,
  kind         text not null check (kind in ('invitacion', 'solicitud')),   -- invitacion: del líder a la persona · solicitud: de la persona al equipo
  status       text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz
);
create unique index if not exists team_invites_una_pendiente on public.team_invites (team_id, person_id) where status = 'pendiente';
alter table public.team_invites enable row level security;
revoke all on public.team_invites from anon, authenticated;

-- ───────── ayudas internas ─────────
create or replace function public._equipos_abierto() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce((select (now() >= abre and now() <= cierra)
                       or (select id from public.people where auth_user_id = auth.uid()) = any (prueba_personas)
                   from public.equipos_config), false)
$$;

create or replace function public._yo() returns public.people
language sql stable security definer set search_path = public, auth as $$
  select p from public.people p where p.auth_user_id = auth.uid()
$$;

-- «seguro»: tiene cupo (no está en lista de espera) y lo confirmó (botón) o ya canjeó Discord.
create or replace function public._puede_equipo(p_person uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(exists (
    select 1 from public.enrollments e
    where e.person_id = p_person and e.offering_slug = 'hack'
      and (e.attendance = 'confirmado' or (e.attendance = 'pendiente' and e.redeemed_at is not null))
      and not public._hack_en_espera(p_person)
  ), false)
$$;

create or replace function public._equipo_de(p_person uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select team_id from public.hack_team_members where person_id = p_person
$$;

create or replace function public._tam_equipo(p_team uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.hack_team_members where team_id = p_team
$$;

revoke all on function public._equipos_abierto(), public._yo(), public._puede_equipo(uuid), public._equipo_de(uuid), public._tam_equipo(uuid) from public, anon, authenticated;

-- ───────── estado y perfil ─────────
create or replace function public.equipos_estado() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare per public.people; cfg public.equipos_config; motivo text;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select * into cfg from public.equipos_config;
  per := public._yo();
  if per.id is null then motivo := 'sin_perfil';
  elsif not exists (select 1 from public.enrollments where person_id = per.id and offering_slug = 'hack') then motivo := 'no_inscrito';
  elsif public._hack_en_espera(per.id) then motivo := 'en_espera';
  elsif not public._puede_equipo(per.id) then motivo := 'sin_confirmar';
  else motivo := 'ok'; end if;
  return jsonb_build_object(
    'abre', cfg.abre, 'cierra', cfg.cierra, 'abierto', public._equipos_abierto(),
    'puede', motivo = 'ok', 'motivo', motivo,
    'tiene_equipo', per.id is not null and public._equipo_de(per.id) is not null,
    'perfil', jsonb_build_object('buscando', coalesce(per.buscando_equipo, false), 'habilidades', coalesce(per.habilidades, '{}'), 'frase', per.frase));
end $$;

create or replace function public.equipo_perfil_guardar(p_buscando boolean, p_habilidades text[], p_frase text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; permitidas constant text[] := array['frontend','backend','datos_ia','diseno','negocio','pitch','movil','devops'];
        h text[] := coalesce(p_habilidades, '{}'); f text := nullif(btrim(coalesce(p_frase, '')), '');
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  if cardinality(h) > 5 or exists (select 1 from unnest(h) x where x <> all (permitidas)) then raise exception 'habilidad_invalida'; end if;
  if f is not null and char_length(f) > 140 then raise exception 'frase_larga'; end if;
  update public.people set buscando_equipo = coalesce(p_buscando, false), habilidades = (select coalesce(array_agg(distinct x), '{}') from unnest(h) x), frase = f, updated_at = now() where id = per.id;
  return jsonb_build_object('ok', true);
end $$;

-- ───────── explorar ─────────
create or replace function public.equipos_buscan_gente() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare per public.people;
begin
  per := public._yo();
  if per.id is null or not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'nombre', coalesce(p.display_name, p.name), 'universidad', i.short_name, 'universidad_nombre', i.name,
      'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end, 'area', c.field,
      'ciclo', p.cycle, 'nivel', p.level, 'habilidades', p.habilidades, 'frase', p.frase) order by p.updated_at desc)
    from public.people p
    left join public.institutions i on i.id = p.institution_id
    left join public.careers c on c.id = p.career_id
    where p.buscando_equipo and p.id <> per.id and public._puede_equipo(p.id) and public._equipo_de(p.id) is null), '[]'::jsonb);
end $$;

create or replace function public.equipos_abiertos() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare per public.people;
begin
  per := public._yo();
  if per.id is null or not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'nombre', t.name, 'descripcion', t.description, 'buscando', t.buscando, 'n', public._tam_equipo(t.id),
      'pedido', exists (select 1 from public.team_invites v where v.team_id = t.id and v.person_id = per.id and v.status = 'pendiente'),
      'miembros', (select jsonb_agg(jsonb_build_object('nombre', coalesce(p.display_name, p.name), 'universidad', i.short_name, 'lider', p.id = t.leader_id) order by m.joined_at)
                   from public.hack_team_members m join public.people p on p.id = m.person_id left join public.institutions i on i.id = p.institution_id where m.team_id = t.id)
    ) order by t.created_at desc)
    from public.hack_teams t where t.abierto and public._tam_equipo(t.id) < 4), '[]'::jsonb);
end $$;

-- ───────── crear, invitar, pedir, responder ─────────
create or replace function public.equipo_crear(p_nombre text, p_descripcion text, p_buscando text[]) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g'); tid uuid;
        permitidas constant text[] := array['frontend','backend','datos_ia','diseno','negocio','pitch','movil','devops'];
        b text[] := coalesce(p_buscando, '{}'); d text := nullif(btrim(coalesce(p_descripcion, '')), '');
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  if not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  if public._equipo_de(per.id) is not null then raise exception 'ya_tiene_equipo'; end if;
  if char_length(nombre) < 3 or char_length(nombre) > 40 then raise exception 'nombre_invalido'; end if;
  if d is not null and char_length(d) > 240 then raise exception 'descripcion_larga'; end if;
  if cardinality(b) > 5 or exists (select 1 from unnest(b) x where x <> all (permitidas)) then raise exception 'habilidad_invalida'; end if;
  if exists (select 1 from public.hack_teams where lower(name) = lower(nombre)) then raise exception 'nombre_repetido'; end if;
  insert into public.hack_teams (name, description, buscando, leader_id) values (nombre, d, b, per.id) returning id into tid;
  insert into public.hack_team_members (team_id, person_id) values (tid, per.id);
  -- ya tiene equipo: se cancelan sus solicitudes e invitaciones pendientes
  update public.team_invites set status = 'cancelada', responded_at = now() where person_id = per.id and status = 'pendiente';
  update public.people set buscando_equipo = false where id = per.id;
  return jsonb_build_object('ok', true, 'team_id', tid);
end $$;

create or replace function public.equipo_invitar(p_person uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  select * into t from public.hack_teams where id = tm;
  if t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if public._tam_equipo(tm) >= 4 then raise exception 'equipo_lleno'; end if;
  if not public._puede_equipo(p_person) or public._equipo_de(p_person) is not null or p_person = per.id then raise exception 'persona_no_disponible'; end if;
  if exists (select 1 from public.team_invites where team_id = tm and person_id = p_person and status = 'pendiente') then raise exception 'ya_invitado'; end if;
  insert into public.team_invites (team_id, person_id, kind) values (tm, p_person, 'invitacion');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.equipo_solicitar(p_team uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  if not public._puede_equipo(per.id) then raise exception 'no_elegible'; end if;
  if public._equipo_de(per.id) is not null then raise exception 'ya_tiene_equipo'; end if;
  select * into t from public.hack_teams where id = p_team;
  if not found or not t.abierto then raise exception 'equipo_inexistente'; end if;
  if public._tam_equipo(p_team) >= 4 then raise exception 'equipo_lleno'; end if;
  if exists (select 1 from public.team_invites where team_id = p_team and person_id = per.id and status = 'pendiente') then raise exception 'ya_invitado'; end if;
  insert into public.team_invites (team_id, person_id, kind) values (p_team, per.id, 'solicitud');
  return jsonb_build_object('ok', true);
end $$;

-- Responde una invitación (la persona invitada) o una solicitud (el líder del equipo).
create or replace function public.equipo_responder(p_invite uuid, p_acepta boolean) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; v public.team_invites; t public.hack_teams;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  if not public._equipos_abierto() then raise exception 'equipos_cerrados'; end if;
  select * into v from public.team_invites where id = p_invite and status = 'pendiente' for update;
  if not found then raise exception 'invitacion_invalida'; end if;
  select * into t from public.hack_teams where id = v.team_id;
  if v.kind = 'invitacion' and v.person_id <> per.id then raise exception 'invitacion_invalida'; end if;
  if v.kind = 'solicitud' and t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if not coalesce(p_acepta, false) then
    update public.team_invites set status = 'rechazada', responded_at = now() where id = v.id;
    return jsonb_build_object('ok', true, 'aceptada', false);
  end if;
  if public._tam_equipo(v.team_id) >= 4 then raise exception 'equipo_lleno'; end if;
  if public._equipo_de(v.person_id) is not null then raise exception 'ya_tiene_equipo'; end if;
  if not public._puede_equipo(v.person_id) then raise exception 'no_elegible'; end if;
  insert into public.hack_team_members (team_id, person_id) values (v.team_id, v.person_id);
  update public.team_invites set status = 'aceptada', responded_at = now() where id = v.id;
  update public.team_invites set status = 'cancelada', responded_at = now() where person_id = v.person_id and status = 'pendiente' and id <> v.id;
  update public.people set buscando_equipo = false where id = v.person_id;
  return jsonb_build_object('ok', true, 'aceptada', true, 'team_id', v.team_id);
end $$;

create or replace function public.equipo_cancelar(p_invite uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; v public.team_invites; t public.hack_teams;
begin
  per := public._yo();
  select * into v from public.team_invites where id = p_invite and status = 'pendiente' for update;
  if not found then raise exception 'invitacion_invalida'; end if;
  select * into t from public.hack_teams where id = v.team_id;
  -- cancela quien la envió: la persona (solicitud) o el líder (invitación)
  if not ((v.kind = 'solicitud' and v.person_id = per.id) or (v.kind = 'invitacion' and t.leader_id = per.id)) then raise exception 'invitacion_invalida'; end if;
  update public.team_invites set status = 'cancelada', responded_at = now() where id = v.id;
  return jsonb_build_object('ok', true);
end $$;

-- Lo que tengo pendiente: invitaciones que me hicieron y, si soy líder, solicitudes a mi equipo.
create or replace function public.equipo_pendientes() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare per public.people; tm uuid;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  return jsonb_build_object(
    'recibidas', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'equipo', t.name, 'equipo_id', t.id, 'n', public._tam_equipo(t.id), 'descripcion', t.description,
              'lider', (select coalesce(p.display_name, p.name) from public.people p where p.id = t.leader_id)) order by v.created_at desc)
              from public.team_invites v join public.hack_teams t on t.id = v.team_id where v.person_id = per.id and v.kind = 'invitacion' and v.status = 'pendiente'), '[]'::jsonb),
    'enviadas', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'equipo', t.name, 'equipo_id', t.id) order by v.created_at desc)
              from public.team_invites v join public.hack_teams t on t.id = v.team_id where v.person_id = per.id and v.kind = 'solicitud' and v.status = 'pendiente'), '[]'::jsonb),
    'solicitudes', case when tm is not null and (select leader_id from public.hack_teams where id = tm) = per.id then coalesce((
              select jsonb_agg(jsonb_build_object('id', v.id, 'persona_id', p.id, 'nombre', coalesce(p.display_name, p.name), 'universidad', i.short_name,
                'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end, 'ciclo', p.cycle, 'nivel', p.level, 'habilidades', p.habilidades, 'frase', p.frase) order by v.created_at)
              from public.team_invites v join public.people p on p.id = v.person_id left join public.institutions i on i.id = p.institution_id left join public.careers c on c.id = p.career_id
              where v.team_id = tm and v.kind = 'solicitud' and v.status = 'pendiente'), '[]'::jsonb) else '[]'::jsonb end,
    'invitadas', case when tm is not null and (select leader_id from public.hack_teams where id = tm) = per.id then coalesce((
              select jsonb_agg(jsonb_build_object('id', v.id, 'nombre', coalesce(p.display_name, p.name)) order by v.created_at)
              from public.team_invites v join public.people p on p.id = v.person_id where v.team_id = tm and v.kind = 'invitacion' and v.status = 'pendiente'), '[]'::jsonb) else '[]'::jsonb end);
end $$;

-- ───────── mi equipo ─────────
-- La página del equipo: integrantes con SU contacto (solo para quienes están en el equipo), entregables y track.
create or replace function public.mi_equipo_detalle() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
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
    'whatsapp_url', t.whatsapp_url, 'repo_url', t.repo_url, 'slides_url', t.slides_url, 'idea', t.idea,
    'miembros', (select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nombre', coalesce(p.display_name, p.name), 'lider', p.id = t.leader_id, 'yo', p.id = per.id,
        'universidad', i.short_name, 'carrera', case when c.slug = 'otra' then coalesce(p.career_other, c.name) else c.name end, 'ciclo', p.cycle,
        'correo', p.email, 'celular', p.phone, 'discord', p.discord_username, 'linkedin', p.linkedin_url, 'github', p.github_url,
        'habilidades', p.habilidades) order by m.joined_at)
      from public.hack_team_members m join public.people p on p.id = m.person_id
      left join public.institutions i on i.id = p.institution_id left join public.careers c on c.id = p.career_id where m.team_id = tm));
end $$;

create or replace function public._url_ok(p_url text, p_prefijo text) returns boolean
language sql immutable as $$
  select p_url is null or (char_length(p_url) <= 300 and p_url ~* ('^' || p_prefijo || '[^\s]+$'))
$$;

-- El líder edita el nombre, la descripción, qué buscan, si están abiertos y el grupo de WhatsApp.
create or replace function public.equipo_editar(p_nombre text, p_descripcion text, p_buscando text[], p_abierto boolean, p_whatsapp text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams; nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
        permitidas constant text[] := array['frontend','backend','datos_ia','diseno','negocio','pitch','movil','devops'];
        b text[] := coalesce(p_buscando, '{}'); w text := nullif(btrim(coalesce(p_whatsapp, '')), '');
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  select * into t from public.hack_teams where id = tm;
  if t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if char_length(nombre) < 3 or char_length(nombre) > 40 then raise exception 'nombre_invalido'; end if;
  if cardinality(b) > 5 or exists (select 1 from unnest(b) x where x <> all (permitidas)) then raise exception 'habilidad_invalida'; end if;
  if not public._url_ok(w, 'https://chat\.whatsapp\.com/') then raise exception 'url_invalida'; end if;
  if exists (select 1 from public.hack_teams where lower(name) = lower(nombre) and id <> tm) then raise exception 'nombre_repetido'; end if;
  update public.hack_teams set name = nombre, description = nullif(btrim(coalesce(p_descripcion, '')), ''), buscando = b, abierto = coalesce(p_abierto, true), whatsapp_url = w, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true);
end $$;

-- Cualquier integrante guarda los entregables: repositorio, láminas (PDF) y la idea.
create or replace function public.equipo_entregar(p_repo text, p_slides text, p_idea text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; r text := nullif(btrim(coalesce(p_repo, '')), ''); s text := nullif(btrim(coalesce(p_slides, '')), ''); i text := nullif(btrim(coalesce(p_idea, '')), '');
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  if not public._url_ok(r, 'https://') or not public._url_ok(s, 'https://') then raise exception 'url_invalida'; end if;
  if i is not null and char_length(i) > 1500 then raise exception 'idea_larga'; end if;
  update public.hack_teams set repo_url = r, slides_url = s, idea = i, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true);
end $$;

-- El líder elige el track (viernes, después del pitch). Todo el equipo queda en ese track.
create or replace function public.equipo_elegir_track(p_track text) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams; trk public.tracks;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then raise exception 'sin_equipo'; end if;
  select * into t from public.hack_teams where id = tm;
  if t.leader_id <> per.id then raise exception 'no_lider'; end if;
  if public._tam_equipo(tm) < 2 then raise exception 'equipo_incompleto'; end if;
  select * into trk from public.tracks where slug = p_track;
  if not found or not trk.revealed then raise exception 'track_inexistente'; end if;
  if trk.opens_at is not null and now() < trk.opens_at then raise exception 'track_aun_no'; end if;
  if trk.closes_at is not null and now() > trk.closes_at then raise exception 'track_cerrado'; end if;
  update public.hack_teams set track_slug = p_track, updated_at = now() where id = tm;
  return jsonb_build_object('ok', true, 'track', p_track);
end $$;

create or replace function public.equipo_salir() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare per public.people; tm uuid; t public.hack_teams; trk public.tracks; sig uuid;
begin
  per := public._yo();
  if per.id is null then raise exception 'sin_perfil'; end if;
  tm := public._equipo_de(per.id);
  if tm is null then return jsonb_build_object('ok', true, 'tenia', false); end if;
  select * into t from public.hack_teams where id = tm;
  select * into trk from public.tracks where slug = t.track_slug;
  if trk.closes_at is not null and now() > trk.closes_at then raise exception 'track_cerrado'; end if;
  delete from public.hack_team_members where person_id = per.id;
  select person_id into sig from public.hack_team_members where team_id = tm order by joined_at limit 1;
  if sig is null then delete from public.hack_teams where id = tm;
  elsif t.leader_id = per.id then update public.hack_teams set leader_id = sig where id = tm; end if;
  return jsonb_build_object('ok', true, 'tenia', true);
end $$;

-- ───────── permisos: solo personas con sesión ─────────
revoke all on function public.equipos_estado(), public.equipo_perfil_guardar(boolean, text[], text), public.equipos_buscan_gente(), public.equipos_abiertos(),
  public.equipo_crear(text, text, text[]), public.equipo_invitar(uuid), public.equipo_solicitar(uuid), public.equipo_responder(uuid, boolean), public.equipo_cancelar(uuid),
  public.equipo_pendientes(), public.mi_equipo_detalle(), public._url_ok(text, text), public.equipo_editar(text, text, text[], boolean, text), public.equipo_entregar(text, text, text),
  public.equipo_elegir_track(text), public.equipo_salir() from public, anon;
grant execute on function public.equipos_estado(), public.equipo_perfil_guardar(boolean, text[], text), public.equipos_buscan_gente(), public.equipos_abiertos(),
  public.equipo_crear(text, text, text[]), public.equipo_invitar(uuid), public.equipo_solicitar(uuid), public.equipo_responder(uuid, boolean), public.equipo_cancelar(uuid),
  public.equipo_pendientes(), public.mi_equipo_detalle(), public.equipo_editar(text, text, text[], boolean, text), public.equipo_entregar(text, text, text),
  public.equipo_elegir_track(text), public.equipo_salir() to authenticated;
