-- 008 · Sumarse a la hackathon estando ya dentro.
--
-- Quien se inscribió solo al bootcamp con su correo institucional ya tiene
-- universidad, pero no DNI, carrera ni ciclo. Esta función los guarda y lo
-- inscribe a la hack en un solo paso: o pasa todo o no pasa nada.
--
-- Quien se inscribió con un correo que no es institucional NO puede usarla:
-- primero hay que cambiarle el correo (scripts/cambiar-correo.mjs).
--
-- Se puede volver a correr sin problema.

create or replace function public.join_hack(
  p_dni_hash     text,
  p_phone        text,
  p_career       int,
  p_career_other text,
  p_cycle        int,
  p_level        text
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  per public.people;
  car public.careers;
begin
  if uid is null then raise exception 'sin_sesion'; end if;

  select * into per from public.people where auth_user_id = uid;
  if not found then raise exception 'sin_perfil'; end if;

  -- La hack exige correo institucional: sin universidad no se puede continuar.
  if per.institution_id is null then raise exception 'requiere_verificacion'; end if;

  select * into car from public.careers where id = p_career;
  if not found then raise exception 'carrera_invalida'; end if;
  if car.slug = 'otra' then
    if p_career_other is null or btrim(p_career_other) = '' then raise exception 'carrera_invalida'; end if;
  else
    p_career_other := null;
  end if;

  if p_cycle is null or p_cycle < 1 or p_cycle > 10 then raise exception 'ciclo_invalido'; end if;

  -- El DNI solo se puede poner una vez: si ya hay uno, no se cambia.
  if per.dni_hash is null then
    if p_dni_hash is null or p_dni_hash = '' then raise exception 'falta_dni'; end if;
    update public.people set dni_hash = p_dni_hash where id = per.id;   -- si ya existe, falla por unicidad
  end if;

  -- La hack pide celular (coordinar equipos).
  if per.phone is null and (p_phone is null or p_phone = '') then raise exception 'falta_celular'; end if;

  update public.people
     set career_id    = p_career,
         career_other = p_career_other,
         cycle        = p_cycle,
         level        = coalesce(nullif(p_level, ''), level),
         phone        = coalesce(per.phone, nullif(p_phone, ''))
   where id = per.id;

  -- Cupo, lock y número los resuelve la función de siempre. Si se llenó la
  -- hack, todo lo anterior se deshace.
  return public.enroll_in('hack');
end $$;

revoke all on function public.join_hack(text, text, int, text, int, text) from public, anon;
grant execute on function public.join_hack(text, text, int, text, int, text) to authenticated;
