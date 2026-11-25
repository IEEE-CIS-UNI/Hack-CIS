-- 034 · Instituto José Pardo (IESTP, La Victoria, Lima).
--
-- Un alumno no podía inscribirse con su correo @jpardo.edu.pe. Verificado el 2026-11-25: la web oficial del instituto está en
-- ese dominio y publica correos @jpardo.edu.pe, y el dominio recibe correo (registro MX de Microsoft). Idempotente.

insert into public.institutions (name, short_name, kind, is_eligible)
select 'Instituto de Educación Superior Tecnológico Público José Pardo', 'IESTP-JP', 'instituto', true
where not exists (select 1 from public.institutions where short_name = 'IESTP-JP');

insert into public.university_domains (domain, institution_id)
select 'jpardo.edu.pe', i.id from public.institutions i where i.short_name = 'IESTP-JP'
on conflict (domain) do nothing;
