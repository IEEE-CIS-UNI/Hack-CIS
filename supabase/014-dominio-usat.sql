-- 014 · El correo de los alumnos de la USAT.
--
-- Los alumnos de la Universidad Católica Santo Toribio de Mogrovejo (USAT) usan @usat.pe
-- (por ejemplo, 76827985@usat.pe); el dominio @usat.edu.pe ya estaba. Confirmado el
-- 2026-11-21 por una alumna que lo escribió desde su propio correo, y el dominio recibe
-- correo (registro MX de Microsoft). Se agrega para que puedan inscribirse.
--
-- Idempotente.

insert into public.university_domains (domain, institution_id)
select 'usat.pe', i.id
from public.institutions i
where i.short_name = 'USAT'
on conflict (domain) do nothing;
