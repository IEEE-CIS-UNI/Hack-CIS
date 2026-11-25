-- 033 · Cierre de inscripciones a la hackathon: miércoles 25/11, 11:59 p. m. (hora de Lima). El bootcamp sigue abierto. Idempotente.

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
  -- La hackathon cierra sola el miércoles 25/11 a las 11:59 p. m. (Lima). Quien ya estaba inscrito no pasa por aquí.
  if p_slug = 'hack' and now() >= timestamptz '2026-11-26 00:00:00-05' then raise exception 'cerrado'; end if;

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
end $function$;
