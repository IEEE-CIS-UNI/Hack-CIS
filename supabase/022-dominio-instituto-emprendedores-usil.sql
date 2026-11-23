-- 022 · El correo del Instituto de Emprendedores de la USIL.
--
-- Hay alumnos que empezaron en el Instituto de Emprendedores de la USIL y luego convalidaron a la
-- Universidad San Ignacio de Loyola conservando el mismo correo (@institutoemprendedores.pe), que siguen
-- usando para todo en la universidad. Se agrega ese dominio a la USIL para que puedan inscribirse
-- (caso reportado por un alumno el 2026-11-23).
--
-- Idempotente.

insert into public.university_domains (domain, institution_id)
select 'institutoemprendedores.pe', i.id
from public.institutions i
where i.short_name = 'USIL'
on conflict (domain) do nothing;
