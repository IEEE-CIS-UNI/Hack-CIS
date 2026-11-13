-- ---------------------------------------------------------------------------
-- Inscripciones v2: hack y bootcamp por separado, tracks y equipos.
--
-- Qué cambia respecto a 001 y 003:
--   · Una persona ya no es «un hacker»: es una fila en `people`. Puede estar
--     inscrita en la hack, en una o varias sesiones del bootcamp, o en ambas.
--   · Lo que existe para inscribirse vive en `offerings` (hack, bootcamp-01…05)
--     y cada inscripción es una fila de `enrollments`. «Ya estás inscrito» es
--     preguntar si esa fila existe.
--   · El track deja de ser una columna con un check fijo. Ahora es una tabla
--     (`tracks`) y lo elige el EQUIPO (`hack_teams`) cuando el líder lo crea.
--   · La hack tiene tope (250) y lo hace cumplir la base, no el formulario.
--   · Cada inscrito en la hack recibe un código de 4 letras + 4 números para
--     canjear en el bot de Discord.
--
-- No borra ni modifica `hackers`, `teams` ni `sponsors`: quedan como están. Lo
-- que había en `hackers` se COPIA a `people` (mismo id) para no perder a nadie.
--
-- Cómo correrlo: Supabase → SQL Editor → pegar → Run. Es idempotente.
-- ---------------------------------------------------------------------------

-- ── 0. utilidades ───────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

/** «Rosa María Pérez Gómez» -> «Rosa Pérez». Para nombres que vienen en un solo texto. */
create or replace function public.display_name_of(full_name text)
returns text language sql immutable as $$
  with t as (
    select string_to_array(btrim(regexp_replace(coalesce(full_name, ''), '\s+', ' ', 'g')), ' ') as w
  )
  select case
    when coalesce(cardinality(w), 0) = 0 or w[1] = '' then null
    when cardinality(w) = 1 then initcap(w[1])
    when cardinality(w) = 2 then initcap(w[1] || ' ' || w[2])
    else initcap(w[1] || ' ' || w[cardinality(w) - 1])
  end
  from t
$$;

-- ── 1. personas ─────────────────────────────────────────────────────────────

create table if not exists public.people (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid unique references auth.users (id) on delete cascade,
  name             text not null,
  display_name     text,
  email            text not null,
  phone            text,
  dni_hash         text,
  institution_id   uuid references public.institutions (id),
  affiliation      text,
  career           text,
  study_year       smallint check (study_year between 1 and 7),
  level            text check (level in ('Principiante', 'Intermedio', 'Avanzado', 'Experto')),
  expertise_id     uuid references public.expertises (id),
  photo_url        text,
  linkedin_url     text,
  github_url       text,
  discord_id       text,
  discord_username text,
  qr_token         text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table  public.people is 'Toda persona con cuenta: de la hack, del bootcamp o de ambos.';
comment on column public.people.dni_hash is 'sha256 del DNI + DNI_PEPPER. Nunca el número en claro (Ley 29733). Solo lo tienen quienes verificaron su identidad para la hack.';
comment on column public.people.institution_id is 'Sale del dominio del correo. Nulo si el correo no es de una institución del catálogo.';
comment on column public.people.display_name is 'Primer nombre + primer apellido. Es lo que sale en la credencial.';

create unique index if not exists people_email_key    on public.people (lower(email));
create unique index if not exists people_dni_hash_key on public.people (dni_hash) where dni_hash is not null;

drop trigger if exists people_touch on public.people;
create trigger people_touch before update on public.people
  for each row execute function public.touch_updated_at();

-- ── 2. qué hay para inscribirse ─────────────────────────────────────────────

create table if not exists public.offerings (
  slug              text primary key,
  kind              text not null check (kind in ('hack', 'bootcamp')),
  title             text not null,
  position          integer not null default 0,
  starts_at         timestamptz,
  capacity          integer check (capacity is null or capacity > 0),   -- nulo = sin tope
  requires_student  boolean not null default false,
  is_open           boolean not null default true,
  created_at        timestamptz not null default now()
);

comment on column public.offerings.capacity is 'Tope de inscritos. Nulo = ilimitado (el bootcamp).';
comment on column public.offerings.requires_student is 'Exige correo institucional verificado y DNI. La hack sí; el bootcamp no.';

insert into public.offerings (slug, kind, title, position, capacity, requires_student) values
  ('hack',        'hack',     'HACK[CIS] UNI 2026',                                       0, 250,  true),
  ('bootcamp-01', 'bootcamp', 'Design Thinking & Design Sprint',                          1, null, false),
  ('bootcamp-02', 'bootcamp', 'Validación de negocio y estructura del pitch',            2, null, false),
  ('bootcamp-03', 'bootcamp', 'Fundamentos de SDLC',                                      3, null, false),
  ('bootcamp-04', 'bootcamp', 'Desarrollo con IA y SDD',                                  4, null, false),
  ('bootcamp-05', 'bootcamp', 'Buenas prácticas de seguridad, testing y entregables',     5, null, false)
on conflict (slug) do update
  set kind = excluded.kind,
      title = excluded.title,
      position = excluded.position,
      capacity = excluded.capacity,
      requires_student = excluded.requires_student;

create table if not exists public.enrollments (
  person_id      uuid not null references public.people (id) on delete cascade,
  offering_slug  text not null references public.offerings (slug),
  number         integer,        -- «inscrito n.º», por oferta
  access_code    text unique,    -- solo la hack: 4 letras + 4 números, para el bot de Discord
  redeemed_at    timestamptz,    -- cuándo se canjeó el código en Discord
  created_at     timestamptz not null default now(),
  primary key (person_id, offering_slug)
);

create index if not exists enrollments_offering_idx on public.enrollments (offering_slug);

-- ── 3. tracks y equipos ─────────────────────────────────────────────────────

create table if not exists public.tracks (
  slug          text primary key,
  name          text not null,
  position      integer not null default 0,
  revealed      boolean not null default false,
  sponsor_name  text,
  sponsor_url   text,
  opens_at      timestamptz,    -- desde cuándo se puede formar equipo en este track
  closes_at     timestamptz     -- hasta cuándo
);

comment on column public.tracks.opens_at is 'Viernes 27/11: los equipos eligen track después del pitch de los sponsors.';

insert into public.tracks (slug, name, position, revealed, sponsor_name, sponsor_url, opens_at, closes_at) values
  ('pronto-1', 'Track por anunciar', 1, false, null, null, '2026-11-27 00:00:00-05', '2026-11-28 23:59:59-05'),
  ('pronto-2', 'Track por anunciar', 2, false, null, null, '2026-11-27 00:00:00-05', '2026-11-28 23:59:59-05'),
  ('pronto-3', 'Track por anunciar', 3, false, null, null, '2026-11-27 00:00:00-05', '2026-11-28 23:59:59-05')
on conflict (slug) do nothing;

create table if not exists public.hack_teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  track_slug  text not null references public.tracks (slug),
  leader_id   uuid not null references public.people (id),
  created_at  timestamptz not null default now()
);

create unique index if not exists hack_teams_name_key on public.hack_teams (lower(name));

create table if not exists public.hack_team_members (
  team_id    uuid not null references public.hack_teams (id) on delete cascade,
  person_id  uuid not null unique references public.people (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (team_id, person_id)
);

-- ── 4. permisos ─────────────────────────────────────────────────────────────
-- La regla: leer lo propio, y escribir solo por las funciones de abajo. Nadie
-- inserta directo en enrollments ni en los equipos: pasan por reglas (tope,
-- elegibilidad, tamaño del equipo) que la interfaz no puede saltarse.

alter table public.people            enable row level security;
alter table public.offerings         enable row level security;
alter table public.enrollments       enable row level security;
alter table public.tracks            enable row level security;
alter table public.hack_teams        enable row level security;
alter table public.hack_team_members enable row level security;

revoke all on public.people, public.enrollments, public.hack_teams, public.hack_team_members
  from anon, authenticated;
revoke all on public.offerings, public.tracks from anon, authenticated;

grant select on public.offerings, public.tracks to anon, authenticated;
grant select on public.people, public.enrollments to authenticated;
-- Solo estas columnas son editables por la propia persona. Nombre, correo, DNI
-- e institución son identidad verificada y no se tocan desde el navegador.
grant update (phone, career, study_year, level, expertise_id, photo_url, linkedin_url, github_url, affiliation)
  on public.people to authenticated;

drop policy if exists "ofertas publicas" on public.offerings;
create policy "ofertas publicas" on public.offerings for select to anon, authenticated using (true);

drop policy if exists "tracks publicos" on public.tracks;
create policy "tracks publicos" on public.tracks for select to anon, authenticated using (true);

drop policy if exists "persona lee su ficha" on public.people;
create policy "persona lee su ficha" on public.people
  for select to authenticated using (auth_user_id = (select auth.uid()));

drop policy if exists "persona edita su ficha" on public.people;
create policy "persona edita su ficha" on public.people
  for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy if exists "persona lee sus inscripciones" on public.enrollments;
create policy "persona lee sus inscripciones" on public.enrollments
  for select to authenticated
  using (exists (select 1 from public.people p
                 where p.id = enrollments.person_id and p.auth_user_id = (select auth.uid())));

-- ── 5. funciones ────────────────────────────────────────────────────────────

/** 4 letras + 4 números, sin letras que se confunden (I, O). Ej.: KQMT4821. */
create or replace function public.gen_access_code()
returns text language plpgsql as $$
declare
  letras constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  b bytea;
  c text;
  i int;
begin
  loop
    b := uuid_send(gen_random_uuid());
    c := '';
    for i in 0..3 loop
      c := c || substr(letras, 1 + (get_byte(b, i) % length(letras)), 1);
    end loop;
    c := c || lpad(((get_byte(b, 8) * 256 + get_byte(b, 9)) % 10000)::text, 4, '0');
    exit when not exists (select 1 from public.enrollments where access_code = c);
  end loop;
  return c;
end $$;

/**
 * Crea la ficha de la persona que acaba de confirmar su correo.
 *
 * El correo y la institución salen de la sesión, no de lo que mande el
 * navegador: la institución se deduce del dominio del correo confirmado.
 * Es idempotente: si ya existe, devuelve su id.
 */
create or replace function public.register_person(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  uid    uuid := auth.uid();
  mail   text;
  inst   uuid;
  pid    uuid;
  nombre text := nullif(btrim(p ->> 'name'), '');
begin
  if uid is null then raise exception 'sin_sesion'; end if;

  select lower(u.email) into mail from auth.users u where u.id = uid;
  if mail is null then raise exception 'sin_sesion'; end if;

  select pe.id into pid from public.people pe where pe.auth_user_id = uid;
  if pid is not null then
    return jsonb_build_object('id', pid, 'nuevo', false);
  end if;

  if nombre is null then raise exception 'falta_nombre'; end if;

  select d.institution_id into inst
  from public.university_domains d
  join public.institutions i on i.id = d.institution_id
  where d.domain = split_part(mail, '@', 2) and i.is_eligible;

  insert into public.people
    (auth_user_id, name, display_name, email, phone, dni_hash, institution_id,
     affiliation, career, study_year, level)
  values
    (uid, nombre,
     coalesce(nullif(btrim(p ->> 'display_name'), ''), public.display_name_of(nombre)),
     mail,
     nullif(p ->> 'phone', ''),
     nullif(p ->> 'dni_hash', ''),
     inst,
     nullif(btrim(p ->> 'affiliation'), ''),
     nullif(btrim(p ->> 'career'), ''),
     nullif(p ->> 'study_year', '')::smallint,
     nullif(p ->> 'level', ''))
  returning id into pid;

  return jsonb_build_object('id', pid, 'nuevo', true);
end $$;

/**
 * Inscribe a la persona en una oferta (la hack o una sesión del bootcamp).
 * Aquí viven las reglas: elegibilidad, oferta abierta y tope de cupos.
 */
create or replace function public.enroll_in(p_slug text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  uid  uuid := auth.uid();
  per  public.people;
  ofe  public.offerings;
  en   public.enrollments;
  taken int;
  nxt   int;
  code  text;
begin
  if uid is null then raise exception 'sin_sesion'; end if;

  select * into per from public.people where auth_user_id = uid;
  if not found then raise exception 'sin_perfil'; end if;

  select * into ofe from public.offerings where slug = p_slug;
  if not found then raise exception 'oferta_inexistente'; end if;

  select * into en from public.enrollments where person_id = per.id and offering_slug = p_slug;
  if found then
    return jsonb_build_object('nuevo', false, 'number', en.number, 'code', en.access_code);
  end if;

  if not ofe.is_open then raise exception 'cerrado'; end if;

  if ofe.requires_student and (per.institution_id is null or per.dni_hash is null) then
    raise exception 'requiere_verificacion';
  end if;

  -- Una a la vez por oferta: sin esto, dos personas en el cupo 250 entran las dos.
  perform pg_advisory_xact_lock(hashtext('enroll:' || p_slug));

  select count(*), coalesce(max(number), 0) into taken, nxt
  from public.enrollments where offering_slug = p_slug;

  if ofe.capacity is not null and taken >= ofe.capacity then
    raise exception 'cupo_lleno';
  end if;

  if ofe.kind = 'hack' then code := public.gen_access_code(); end if;

  insert into public.enrollments (person_id, offering_slug, number, access_code)
  values (per.id, p_slug, nxt + 1, code);

  return jsonb_build_object('nuevo', true, 'number', nxt + 1, 'code', code);
end $$;

/**
 * El líder crea el equipo: nombre, track y los DNI (ya cifrados por el
 * servidor) de los demás integrantes. Todo o nada: si algo no cuadra, no se
 * crea nada. Los errores salen como «codigo» o «codigo:posicion» para que la
 * interfaz sepa cuál de los DNI es el problema.
 */
create or replace function public.create_team(p_track text, p_name text, p_dni_hashes text[])
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  uid     uuid := auth.uid();
  leader  public.people;
  trk     public.tracks;
  nombre  text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  n       int  := coalesce(cardinality(p_dni_hashes), 0);
  ids     uuid[] := '{}';
  mid     uuid;
  i       int;
  carreras int;
  tid     uuid;
begin
  if uid is null then raise exception 'sin_sesion'; end if;

  select pe.* into leader
  from public.people pe
  join public.enrollments e on e.person_id = pe.id and e.offering_slug = 'hack'
  where pe.auth_user_id = uid;
  if not found then raise exception 'sin_hack'; end if;

  if exists (select 1 from public.hack_team_members where person_id = leader.id) then
    raise exception 'ya_tiene_equipo:0';
  end if;

  select * into trk from public.tracks where slug = p_track;
  if not found or not trk.revealed then raise exception 'track_inexistente'; end if;
  if trk.opens_at  is not null and now() < trk.opens_at  then raise exception 'track_aun_no'; end if;
  if trk.closes_at is not null and now() > trk.closes_at then raise exception 'track_cerrado'; end if;

  if char_length(nombre) < 3 or char_length(nombre) > 40 then raise exception 'nombre_invalido'; end if;

  -- El líder más 1 a 3 integrantes: equipos de 2 a 4.
  if n < 1 or n > 3 then raise exception 'tamano_equipo'; end if;
  if (select count(distinct h) from unnest(p_dni_hashes) h) <> n then raise exception 'dni_repetido'; end if;

  for i in 1..n loop
    select pe.id into mid
    from public.people pe
    join public.enrollments e on e.person_id = pe.id and e.offering_slug = 'hack'
    where pe.dni_hash = p_dni_hashes[i];

    if mid is null then raise exception 'dni_no_inscrito:%', i; end if;
    if mid = leader.id then raise exception 'dni_propio:%', i; end if;
    if exists (select 1 from public.hack_team_members where person_id = mid) then
      raise exception 'ya_tiene_equipo:%', i;
    end if;
    ids := ids || mid;
  end loop;

  -- Al menos 2 carreras distintas entre todos (bases, sección «Equipos»).
  select count(distinct lower(btrim(career))) into carreras
  from public.people
  where (id = leader.id or id = any (ids)) and career is not null and btrim(career) <> '';
  if carreras < 2 then raise exception 'carreras_iguales'; end if;

  insert into public.hack_teams (name, track_slug, leader_id)
  values (nombre, p_track, leader.id)
  returning id into tid;

  insert into public.hack_team_members (team_id, person_id)
  select tid, x from unnest(array[leader.id] || ids) x;

  return jsonb_build_object(
    'team_id', tid, 'name', nombre, 'track', p_track,
    'members', (select jsonb_agg(jsonb_build_object('name', coalesce(pe.display_name, pe.name), 'leader', pe.id = leader.id))
                from public.people pe where pe.id = leader.id or pe.id = any (ids))
  );
end $$;

/** Salir del equipo, mientras el track siga abierto. Si se va el líder, pasa al más antiguo. */
create or replace function public.leave_team()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  uid  uuid := auth.uid();
  per  public.people;
  tm   public.hack_team_members;
  tm_t public.hack_teams;
  trk  public.tracks;
  next uuid;
begin
  if uid is null then raise exception 'sin_sesion'; end if;
  select * into per from public.people where auth_user_id = uid;
  if not found then raise exception 'sin_perfil'; end if;

  select * into tm from public.hack_team_members where person_id = per.id;
  if not found then return jsonb_build_object('ok', true, 'tenia', false); end if;

  select * into tm_t from public.hack_teams where id = tm.team_id;
  select * into trk from public.tracks where slug = tm_t.track_slug;
  if trk.closes_at is not null and now() > trk.closes_at then raise exception 'track_cerrado'; end if;

  delete from public.hack_team_members where person_id = per.id;

  select person_id into next from public.hack_team_members
  where team_id = tm.team_id order by joined_at limit 1;

  if next is null then
    delete from public.hack_teams where id = tm.team_id;
  elsif tm_t.leader_id = per.id then
    update public.hack_teams set leader_id = next where id = tm.team_id;
  end if;

  return jsonb_build_object('ok', true, 'tenia', true);
end $$;

/** Todo lo que el panel necesita en una sola llamada. */
create or replace function public.my_overview()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  uid uuid := auth.uid();
  per record;
begin
  if uid is null then return null; end if;

  select pe.*, i.name as inst_name into per
  from public.people pe
  left join public.institutions i on i.id = pe.institution_id
  where pe.auth_user_id = uid;
  if not found then return jsonb_build_object('person', null); end if;

  return jsonb_build_object(
    'person', jsonb_build_object(
      'id', per.id, 'name', per.name, 'display_name', coalesce(per.display_name, per.name),
      'email', per.email, 'phone', per.phone, 'career', per.career, 'study_year', per.study_year,
      'level', per.level, 'affiliation', per.affiliation, 'photo_url', per.photo_url,
      'linkedin_url', per.linkedin_url, 'github_url', per.github_url,
      'discord_username', per.discord_username, 'qr_token', per.qr_token,
      'institution', per.inst_name,
      'verified', (per.institution_id is not null and per.dni_hash is not null)),
    'enrollments', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', e.offering_slug, 'number', e.number, 'code', e.access_code,
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
      join public.tracks tr on tr.slug = t.track_slug
      where tm.person_id = per.id)
  );
end $$;

/** Cuántos cupos van de la hack. Público: lo ve cualquiera en la landing. */
create or replace function public.public_counts()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'hack_taken',    (select count(*) from public.enrollments where offering_slug = 'hack'),
    'hack_capacity', (select capacity from public.offerings where slug = 'hack')
  )
$$;

/**
 * Para el bot de Discord (solo con la clave de servicio): canjea el código de
 * un inscrito en la hack y guarda quién es en Discord. Devuelve a quién
 * pertenece, su equipo y su track, para que el bot le dé el rol y los canales.
 */
create or replace function public.redeem_hack_code(p_code text, p_discord_id text, p_discord_username text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  codigo text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  en     public.enrollments;
  per    public.people;
begin
  select * into en from public.enrollments where access_code = codigo and offering_slug = 'hack';
  if not found then raise exception 'codigo_invalido'; end if;

  select * into per from public.people where id = en.person_id;

  if en.redeemed_at is not null and per.discord_id is distinct from p_discord_id then
    raise exception 'codigo_usado';
  end if;

  update public.people set discord_id = p_discord_id, discord_username = p_discord_username where id = per.id;
  update public.enrollments set redeemed_at = coalesce(redeemed_at, now()) where person_id = en.person_id and offering_slug = 'hack';

  return jsonb_build_object(
    'person_id', per.id,
    'name', coalesce(per.display_name, per.name),
    'team', (select t.name from public.hack_team_members m join public.hack_teams t on t.id = m.team_id where m.person_id = per.id),
    'track', (select t.track_slug from public.hack_team_members m join public.hack_teams t on t.id = m.team_id where m.person_id = per.id)
  );
end $$;

-- Quién puede llamar a qué. Por defecto Supabase deja ejecutar todo a anon.
revoke all on function public.register_person(jsonb)                from public, anon, authenticated;
revoke all on function public.enroll_in(text)                       from public, anon, authenticated;
revoke all on function public.create_team(text, text, text[])       from public, anon, authenticated;
revoke all on function public.leave_team()                          from public, anon, authenticated;
revoke all on function public.my_overview()                         from public, anon, authenticated;
revoke all on function public.public_counts()                       from public, anon, authenticated;
revoke all on function public.redeem_hack_code(text, text, text)    from public, anon, authenticated;
revoke all on function public.gen_access_code()                     from public, anon, authenticated;

grant execute on function public.register_person(jsonb)             to authenticated;
grant execute on function public.enroll_in(text)                    to authenticated;
grant execute on function public.create_team(text, text, text[])    to authenticated;
grant execute on function public.leave_team()                       to authenticated;
grant execute on function public.my_overview()                      to authenticated;
grant execute on function public.public_counts()                    to anon, authenticated;
grant execute on function public.redeem_hack_code(text, text, text) to service_role;

-- ── 6. vista para el bot de Discord ─────────────────────────────────────────
-- Solo la clave de servicio la ve. El track ahora es del equipo, no de la persona.

create or replace view public.hack_roster as
select p.id, p.name, p.display_name, p.email, p.discord_id, p.discord_username,
       e.number, e.access_code, e.redeemed_at,
       ht.id as team_id, ht.name as team_name, ht.track_slug as track
from public.people p
join public.enrollments e on e.person_id = p.id and e.offering_slug = 'hack'
left join public.hack_team_members tm on tm.person_id = p.id
left join public.hack_teams ht on ht.id = tm.team_id;

revoke all on public.hack_roster from public, anon, authenticated;
grant select on public.hack_roster to service_role;

-- ── 7. institutos ───────────────────────────────────────────────────────────
-- La hack es abierta a universitarios Y a institutos.

update public.institutions set is_eligible = true where kind = 'instituto' and is_eligible = false;

-- ── 8. copiar lo que había en «hackers» ─────────────────────────────────────
-- Mismo id, para que lo que apunte a esas filas siga apuntando. Si algo falla
-- aquí no se aborta la migración: queda un aviso y se puede repetir.

do $$
declare
  h record;
  n int := 0;
  fallos int := 0;
begin
  if to_regclass('public.hackers') is null then
    raise notice 'No existe public.hackers: nada que copiar.';
    return;
  end if;

  -- Fila por fila: si una no cabe (un dato raro), se salta y se avisa, en vez
  -- de tumbar la copia de todas las demás.
  for h in select * from public.hackers order by created_at loop
    begin
      insert into public.people
        (id, auth_user_id, name, display_name, email, phone, dni_hash, institution_id,
         career, study_year, level, photo_url, linkedin_url, github_url,
         discord_id, discord_username, created_at)
      values
        (h.id, h.auth_user_id, h.name, public.display_name_of(h.name), lower(h.email), h.phone, h.dni_hash,
         h.institution_id, h.career,
         case when h.study_year between 1 and 7 then h.study_year::smallint end,
         case when h.level::text in ('Principiante', 'Intermedio', 'Avanzado', 'Experto') then h.level::text end,
         h.photo_url, h.linkedin_url, h.github_url, h.discord_id, h.discord_username,
         coalesce(h.created_at, now()))
      on conflict do nothing;

      if not exists (select 1 from public.enrollments e where e.person_id = h.id and e.offering_slug = 'hack')
         and exists (select 1 from public.people pe where pe.id = h.id) then
        insert into public.enrollments (person_id, offering_slug, number, access_code, created_at)
        values (h.id, 'hack',
                (select coalesce(max(number), 0) + 1 from public.enrollments where offering_slug = 'hack'),
                public.gen_access_code(), coalesce(h.created_at, now()));
        n := n + 1;
      end if;
    exception when others then
      fallos := fallos + 1;
      raise notice 'No se copió el hacker % (%).', h.id, sqlerrm;
    end;
  end loop;

  raise notice 'Copiados de hackers a people/enrollments: % (con problema: %)', n, fallos;
end $$;

-- ── 9. comprobación ─────────────────────────────────────────────────────────

select
  (select count(*) from public.offerings)                       as ofertas,
  (select count(*) from public.tracks)                          as tracks,
  (select count(*) from public.people)                          as personas,
  (select count(*) from public.enrollments)                     as inscripciones,
  (select count(*) from pg_policies where schemaname = 'public'
     and tablename in ('people', 'offerings', 'enrollments', 'tracks')) as politicas;
