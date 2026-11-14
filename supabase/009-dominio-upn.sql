-- 009 · El correo de los alumnos de la UPN.
--
-- Los alumnos de la Universidad Privada del Norte usan @upn.pe (por ejemplo,
-- n00123456@upn.pe); el dominio @upn.edu.pe ya estaba. Se agrega el segundo para
-- que puedan inscribirse. Un correo de otro dominio igual no vale: la
-- verificación es que reciban el enlace de confirmación.
--
-- Idempotente.

insert into public.university_domains (domain, institution_id)
select 'upn.pe', i.id
from public.institutions i
where i.name = 'Universidad Privada del Norte'
on conflict (domain) do nothing;
