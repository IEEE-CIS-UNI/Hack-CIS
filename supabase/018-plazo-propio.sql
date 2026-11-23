-- 018 · Plazo propio para quien sube de la lista de espera
--
-- El plazo general para confirmar es el miércoles 25 de noviembre, 3:00 p. m. (hora de Lima).
-- Quien sube de la lista de espera después de eso recibe su correo con 24 horas desde ese momento:
-- el script de envío guarda esa hora en attendance_deadline y la pantalla de confirmación la muestra.
-- Si es null, vale el plazo general. Idempotente.

alter table public.enrollments add column if not exists attendance_deadline timestamptz;

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
    'limite', coalesce(en.attendance_deadline, public.asistencia_limite())
  );
end $function$
;
