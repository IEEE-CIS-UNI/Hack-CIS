-- ---------------------------------------------------------------------------
-- Más instituciones y dominios de correo.
--
-- Cada dominio de esta lista se verificó el 2026-11-13: tiene registros MX
-- (recibe correo) y la portada de su sitio nombra a la institución. Los que no
-- pasaron esa prueba no se agregan.
--
-- Los correos de estudiantes de varias universidades usan subdominios
-- (aloe.ulima.edu.pe, alum.up.edu.pe…). No hace falta listarlos: un correo
-- vale si su dominio es uno del catálogo o cuelga de uno (ver register_person).
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
      ('Universidad Peruana de Ciencias e Informática', 'UPCI',     'privada',   'upci.edu.pe'),
      ('Universidad Autónoma de Ica',                   'UAI',      'privada',   'autonomadeica.edu.pe'),
      ('IDAT',                                          'IDAT',     'instituto', 'idat.edu.pe'),
      ('Instituto San Ignacio de Loyola',               'ISIL',     'instituto', 'isil.pe'),
      ('Instituto Toulouse Lautrec',                    'TOULOUSE', 'instituto', 'toulouselautrec.edu.pe'),
      ('Certus',                                        'CERTUS',   'instituto', 'certus.edu.pe')
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

select
  (select count(*) from public.institutions)       as instituciones,
  (select count(*) from public.university_domains) as dominios,
  (select count(*) from public.institutions where kind::text = 'instituto') as institutos;
