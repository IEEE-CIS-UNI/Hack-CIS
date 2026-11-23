-- 017 · Lista de espera de la hackathon
--
-- La hack tiene 250 cupos y hasta 50 personas en lista de espera (300 inscritas como máximo).
-- No hay cola aparte: el puesto sale del NÚMERO DE INSCRIPCIÓN, contando solo a quienes siguen en
-- carrera (asistencia «pendiente» o «confirmado»). Los primeros 250 tienen cupo; del 251 al 300
-- están en espera. Cuando alguien libera su lugar («no_participa») o lo pierde por no confirmar
-- («vencido»), todas las personas detrás suben solas: no hace falta mover nada a mano.
--   · En espera no se muestra el código de Discord ni se puede canjear.
--   · Quien liberó su lugar y vuelve entra con su mismo número, si todavía cabe.
-- Idempotente.

alter table public.offerings add column if not exists waitlist_size int not null default 0;
update public.offerings set waitlist_size = 50 where slug = 'hack';

alter table public.enrollments drop constraint if exists enrollments_attendance_check;
alter table public.enrollments add constraint enrollments_attendance_check
  check (attendance in ('pendiente', 'confirmado', 'no_participa', 'vencido'));

-- Puesto en la hackathon entre quienes siguen en carrera (null si no está o ya liberó su lugar).
create or replace function public._hack_puesto(p_person uuid) returns int
language sql stable security definer set search_path = public as $$
  select case when e.attendance in ('pendiente', 'confirmado') and e.number is not null then
    (select count(*)::int from public.enrollments x
      where x.offering_slug = 'hack' and x.attendance in ('pendiente', 'confirmado') and x.number <= e.number)
  end
  from public.enrollments e where e.person_id = p_person and e.offering_slug = 'hack'
$$;

create or replace function public._hack_en_espera(p_person uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public._hack_puesto(p_person) > (select capacity from public.offerings where slug = 'hack'), false)
$$;

-- Lugar en la lista de espera: 1 es el primero en subir (null si tiene cupo o no está).
create or replace function public._hack_posicion(p_person uuid) returns int
language sql stable security definer set search_path = public as $$
  select case when public._hack_en_espera(p_person)
    then public._hack_puesto(p_person) - (select capacity from public.offerings where slug = 'hack') end
$$;

revoke all on function public._hack_puesto(uuid), public._hack_en_espera(uuid), public._hack_posicion(uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enroll_in(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
    return jsonb_build_object('nuevo', false, 'number', en.number,
      'code', case when p_slug = 'hack' and public._hack_en_espera(per.id) then null else en.access_code end,
      'waiting', p_slug = 'hack' and public._hack_en_espera(per.id),
      'position', case when p_slug = 'hack' then public._hack_posicion(per.id) end);
  end if;

  if not ofe.is_open then raise exception 'cerrado'; end if;

  if ofe.requires_student and (per.institution_id is null or per.dni_hash is null) then
    raise exception 'requiere_verificacion';
  end if;

  -- Una a la vez por oferta: sin esto, dos personas en el cupo 250 entran las dos.
  perform pg_advisory_xact_lock(hashtext('enroll:' || p_slug));

  -- Cuentan las personas que siguen en carrera (pendientes y confirmadas): quien liberó su lugar no ocupa cupo.
  select count(*) filter (where attendance in ('pendiente', 'confirmado')), coalesce(max(number), 0) into taken, nxt
  from public.enrollments where offering_slug = p_slug;

  -- El tope real es el cupo más la lista de espera (para la hack: 250 + 50).
  if ofe.capacity is not null and taken >= ofe.capacity + ofe.waitlist_size then
    raise exception 'cupo_lleno';
  end if;

  if ofe.kind = 'hack' then code := public.gen_access_code(); end if;

  insert into public.enrollments (person_id, offering_slug, number, access_code)
  values (per.id, p_slug, nxt + 1, code);

  return jsonb_build_object('nuevo', true, 'number', nxt + 1,
    'code', case when ofe.capacity is not null and taken >= ofe.capacity then null else code end,
    'waiting', ofe.capacity is not null and taken >= ofe.capacity,
    'position', case when ofe.capacity is not null and taken >= ofe.capacity then taken - ofe.capacity + 1 end);
end $function$
;

CREATE OR REPLACE FUNCTION public.card_por_token(p_token text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'display_name', p.display_name,
    'institution',  i.name,
    'photo_url',    p.photo_url,
    'hack', (
      select jsonb_build_object('number', e.number,
        'code', case when public._hack_en_espera(p.id) then null else e.access_code end,
        'redeemed', e.redeemed_at is not null,
        'espera', public._hack_en_espera(p.id), 'posicion', public._hack_posicion(p.id))
      from public.enrollments e where e.person_id = p.id and e.offering_slug = 'hack'
    ),
    'sesiones', (
      select coalesce(jsonb_agg(e.offering_slug order by e.offering_slug), '[]'::jsonb)
      from public.enrollments e where e.person_id = p.id and e.offering_slug like 'bootcamp-%'
    )
  )
  from public.people p
  left join public.institutions i on i.id = p.institution_id
  where length(p_token) = 32 and p.card_token = p_token
$function$
;

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
      join public.tracks tr on tr.slug = t.track_slug
      where tm.person_id = per.id)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.redeem_hack_code(p_code text, p_discord_id text, p_discord_username text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  codigo text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  usuario text := lower(regexp_replace(coalesce(p_discord_username, ''), '(^@|#[0-9]+$)', '', 'g'));
  en     public.enrollments;
  per    public.people;
begin
  select * into en from public.enrollments where access_code = codigo and offering_slug = 'hack';
  if not found then raise exception 'codigo_invalido'; end if;

  select * into per from public.people where id = en.person_id;

  -- Sin cupo no hay Discord: en lista de espera todavía no, y quien liberó su lugar ya no.
  if public._hack_en_espera(en.person_id) then raise exception 'lista_de_espera'; end if;
  if en.attendance in ('no_participa', 'vencido') then raise exception 'sin_cupo'; end if;

  if en.redeemed_at is not null and per.discord_id is distinct from p_discord_id then
    raise exception 'codigo_usado';
  end if;

  if usuario !~ '^[a-z0-9_.]{2,32}$' then usuario := null; end if;

  update public.people
     set discord_id = p_discord_id,
         discord_username = coalesce(usuario, discord_username)
   where id = per.id;
  update public.enrollments set redeemed_at = coalesce(redeemed_at, now())
   where person_id = en.person_id and offering_slug = 'hack';

  return jsonb_build_object(
    'person_id', per.id,
    'name', coalesce(per.display_name, per.name),
    'team', (select t.name from public.hack_team_members m join public.hack_teams t on t.id = m.team_id where m.person_id = per.id),
    'track', (select t.track_slug from public.hack_team_members m join public.hack_teams t on t.id = m.team_id where m.person_id = per.id)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public._asistencia(p_person uuid, p_accion text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare en public.enrollments;
begin
  select * into en from public.enrollments where person_id = p_person and offering_slug = 'hack' for update;
  if not found then return jsonb_build_object('hay_hack', false); end if;

  if p_accion = 'confirmo' then
    -- Quien había liberado su lugar vuelve a entrar con su mismo número, si todavía cabe en el cupo o en la lista de espera.
    if en.attendance in ('no_participa', 'vencido') then
      perform pg_advisory_xact_lock(hashtext('enroll:hack'));
      if (select count(*) from public.enrollments where offering_slug = 'hack' and attendance in ('pendiente', 'confirmado'))
         >= (select capacity + waitlist_size from public.offerings where slug = 'hack') then
        raise exception 'cupo_lleno';
      end if;
    end if;
    update public.enrollments set attendance = 'confirmado', attendance_at = now()
     where person_id = p_person and offering_slug = 'hack';
  elsif p_accion = 'no_participo' then
    update public.enrollments set attendance = 'no_participa', attendance_at = now()
     where person_id = p_person and offering_slug = 'hack';
  elsif coalesce(p_accion, '') <> '' then
    raise exception 'accion_invalida';
  end if;

  select * into en from public.enrollments where person_id = p_person and offering_slug = 'hack';
  return jsonb_build_object(
    'hay_hack', true,
    'estado', en.attendance,
    'canjeo_discord', en.redeemed_at is not null,
    -- cuenta con ella: confirmó, o no respondió pero ya canjeó su código de Discord
    'efectivo', (en.attendance = 'confirmado' or (en.attendance = 'pendiente' and en.redeemed_at is not null))
                and not public._hack_en_espera(p_person),
    'espera', public._hack_en_espera(p_person),
    'posicion', public._hack_posicion(p_person),
    'numero', en.number,
    'limite', public.asistencia_limite()
  );
end $function$
;

create or replace function public.public_counts()
returns jsonb language sql stable security definer set search_path = public as $$
  with o as (select capacity, waitlist_size from public.offerings where slug = 'hack'),
       a as (select count(*)::int n from public.enrollments where offering_slug = 'hack' and attendance in ('pendiente', 'confirmado'))
  select jsonb_build_object(
    'hack_taken',          (select least(a.n, o.capacity) from a, o),
    'hack_capacity',       (select capacity from o),
    'hack_waiting',        (select greatest(a.n - o.capacity, 0) from a, o),
    'hack_waitlist_max',   (select waitlist_size from o)
  )
$$;
