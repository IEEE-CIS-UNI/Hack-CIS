-- 012 · Instituto ADEX.
--
-- Una alumna o alumno del Instituto ADEX (Escuela de Educación Superior Tecnológica
-- Privada ADEX, San Borja) no podía pasar el paso del correo institucional: su
-- dominio, adexperu.edu.pe, no estaba en la lista. Verificado el 2026-11-20: el
-- dominio recibe correo (registro MX de Google) y las fuentes públicas lo ligan al
-- instituto (instituto.adexperu.edu.pe).
--
-- Idempotente.

do $$
declare inst uuid;
begin
  select id into inst from public.institutions where short_name = 'ADEX';
  if inst is null then
    insert into public.institutions (name, short_name, kind, is_eligible)
    values ('Instituto ADEX', 'ADEX', 'instituto'::public.institution_kind, true)
    returning id into inst;
  end if;
  insert into public.university_domains (domain, institution_id)
  values ('adexperu.edu.pe', inst)
  on conflict (domain) do nothing;
end $$;
