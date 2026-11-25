-- 032 · Quien dejó vencer su plazo y vuelve a pedir lugar entra al final de la fila. Idempotente.

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
    -- Vuelve a entrar quien aún quepa en el cupo o en la lista de espera. Quien LIBERÓ su lugar conserva su número;
    -- a quien se le VENCIÓ el plazo le toca un número nuevo, al final de la fila (no desplaza a quienes sí respondieron).
    if en.attendance in ('no_participa', 'vencido') then
      perform pg_advisory_xact_lock(hashtext('enroll:hack'));
      if (select count(*) from public.enrollments where offering_slug = 'hack' and attendance in ('pendiente', 'confirmado'))
         >= (select capacity + waitlist_size from public.offerings where slug = 'hack') then
        raise exception 'cupo_lleno';
      end if;
      if en.attendance = 'vencido' then
        update public.enrollments set number = (select coalesce(max(number), 0) + 1 from public.enrollments where offering_slug = 'hack'),
          attendance_deadline = null
         where person_id = p_person and offering_slug = 'hack';
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
    'limite', coalesce(en.attendance_deadline, public.asistencia_limite())
  );
end $function$;
