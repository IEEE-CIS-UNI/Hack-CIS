-- ---------------------------------------------------------------------------
-- 010 · Más dominios de correo institucional.
--
-- Mismo estándar de 007: cada dominio se verificó el 2026-11-17 con dos pruebas,
-- que recibe correo (registro MX) y que la portada de su sitio nombra a la
-- institución. Los que no pasaron (upch.edu.pe, zegelipae.edu.pe, ensabap.edu.pe
-- y otros) no se agregan.
--
-- Idempotente. Supabase → SQL Editor → pegar → Run.
-- ---------------------------------------------------------------------------

do $$
declare
  f record;
  inst uuid;
begin
  for f in
    select * from (values
      -- otro dominio de una institución que ya estaba
      ('Universidad de San Martín de Porres',        'USMP',   'privada',   'usmp.edu.pe'),
      ('SENATI',                                     'SENATI', 'instituto', 'senati.edu.pe'),
      ('Universidad Peruana de Ciencias Aplicadas',  'UPC',    'privada',   'upc.pe'),
      -- instituciones nuevas
      ('SISE',                                       'SISE',   'instituto', 'sise.edu.pe'),
      ('Universidad Peruana de Integración Global',  'UPIG',   'privada',   'upig.edu.pe'),
      ('Universidad Privada Sergio Bernales',        'UPSB',   'privada',   'upsb.edu.pe'),
      ('Universidad Privada San Carlos',             'UPSC',   'privada',   'upsc.edu.pe')
    ) as v(nombre, siglas, tipo, dominio)
  loop
    select id into inst from public.institutions where short_name = f.siglas;
    if inst is null then
      insert into public.institutions (name, short_name, kind, is_eligible)
      values (f.nombre, f.siglas, f.tipo::public.institution_kind, true)
      returning id into inst;
    end if;
    insert into public.university_domains (domain, institution_id)
    values (f.dominio, inst)
    on conflict (domain) do nothing;
  end loop;
end $$;
