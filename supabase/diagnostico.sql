-- ---------------------------------------------------------------------------
-- Reproduce el INSERT tal como lo hace la aplicación: con el rol
-- «authenticated» y el JWT de tu usuario, o sea con las políticas activas.
--
-- Lo anterior lo corrimos como dueño de la base, que se salta RLS. Por eso
-- pasaba allí y falla en la web. Esto cierra esa diferencia.
--
-- Necesita que exista al menos un usuario en Auth: usa el más reciente, que
-- es el de tu última inscripción. Si borraste todo, inscríbete una vez
-- (aunque falle) y vuelve a correr esto.
--
-- NO deja nada: la fila se deshace siempre.
-- Supabase → SQL Editor → pegar → Run.
-- ---------------------------------------------------------------------------

drop table if exists resultado_diagnostico;
create temp table resultado_diagnostico (paso text, valor text);

do $$
declare
  uid     uuid;
  correo  text;
  inst    uuid;
  codigo  text;
  msg     text;
  det     text;
  uid_visto text;
begin
  select id, email into uid, correo
  from auth.users order by created_at desc limit 1;

  if uid is null then
    insert into resultado_diagnostico values
      ('ERROR', 'No hay usuarios en auth.users. Intenta inscribirte una vez y vuelve a correr esto.');
    return;
  end if;

  select institution_id into inst
  from public.university_domains where domain = lower(split_part(correo, '@', 2));

  insert into resultado_diagnostico values
    ('usuario de prueba', correo),
    ('institution_id', coalesce(inst::text, '*** DOMINIO NO CATALOGADO ***'));

  begin
    -- Esto es lo que hace PostgREST cuando llega un JWT de usuario.
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid, 'role', 'authenticated', 'email', correo)::text, true);
    perform set_config('role', 'authenticated', true);

    -- ¿La base reconoce al usuario? Si esto sale vacío, las políticas no
    -- pueden cumplirse por más permisivas que sean.
    select coalesce(auth.uid()::text, '*** NULL ***') into uid_visto;

    insert into public.hackers
      (name, email, phone, dni_hash, career, study_year, track, level,
       institution_id, auth_user_id)
    values
      ('PRUEBA DIAGNOSTICO', correo, '+51999888777', 'sha256:prueba',
       'Ingenieria de Sistemas', 4, 'telco', 'Intermedio', inst, uid);

    raise exception using errcode = '22000', message = '__PASO__';

  exception when others then
    get stacked diagnostics
      codigo = returned_sqlstate, msg = message_text, det = pg_exception_detail;
  end;

  -- Volver al rol de siempre antes de escribir el resultado.
  perform set_config('role', 'postgres', true);

  insert into resultado_diagnostico values ('auth.uid() ve', coalesce(uid_visto, '(no se evaluo)'));

  if msg = '__PASO__' then
    insert into resultado_diagnostico values
      ('resultado', 'EL INSERT FUNCIONA con las politicas activas.'),
      ('conclusion', 'La base esta bien: el problema esta en como la aplicacion manda el token.');
  else
    insert into resultado_diagnostico values
      ('resultado', 'EL INSERT FALLA con las politicas activas'),
      ('codigo', coalesce(codigo, '-')),
      ('mensaje', coalesce(msg, '-')),
      ('detalle', coalesce(det, '-'));
  end if;
end $$;

select * from resultado_diagnostico;
