-- «Agrúpenme»: quien no tiene equipo se apunta desde su enlace personal; la organización arma los grupos a las 9:30 p. m.
-- del sábado 28. El enlace usa la clave privada de la persona (la misma de su card). Los grupos se arman con un script aparte.
create table if not exists public.agrupar_apuntados (
  person_id uuid primary key references public.people(id) on delete cascade,
  creado timestamptz not null default now()
);
alter table public.agrupar_apuntados enable row level security;
revoke all on public.agrupar_apuntados from public, anon, authenticated;

create or replace function public.agrupar_por_token(p_token text, p_accion text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare per public.people; cierra constant timestamptz := timestamptz '2026-11-28 21:30:00-05'; estado text;
begin
  select * into per from public.people where length(p_token) = 32 and card_token = p_token;
  if per.id is null then return jsonb_build_object('estado', 'invalido'); end if;
  if coalesce(p_accion, '') not in ('', 'apuntar', 'quitar') then raise exception 'accion_invalida'; end if;

  if public._equipo_de(per.id) is not null then estado := 'con_equipo';
  elsif now() > cierra then estado := 'cerrado';
  elsif not exists (select 1 from public.enrollments e where e.person_id = per.id and e.offering_slug = 'hack'
          and e.attendance in ('pendiente', 'confirmado')) or public._hack_en_espera(per.id) then estado := 'sin_cupo';
  else
    estado := 'listo';
    if p_accion = 'apuntar' then
      -- apuntarse confirma la participación (sin eso no se puede estar en un equipo)
      if not public._puede_equipo(per.id) then perform public._asistencia(per.id, 'confirmo'); end if;
      insert into public.agrupar_apuntados (person_id) values (per.id) on conflict do nothing;
    elsif p_accion = 'quitar' then
      delete from public.agrupar_apuntados where person_id = per.id;
    end if;
  end if;

  return jsonb_build_object('estado', estado,
    'nombre', split_part(btrim(coalesce(per.display_name, per.name)), ' ', 1),
    'apuntado', exists (select 1 from public.agrupar_apuntados a where a.person_id = per.id),
    'total', (select count(*)::int from public.agrupar_apuntados a where public._equipo_de(a.person_id) is null));
end $$;
revoke all on function public.agrupar_por_token(text, text) from public;
grant execute on function public.agrupar_por_token(text, text) to anon, authenticated;
