-- 27/11: los ganadores de We Educación Ejecutiva también eligen en /elige. Quedan los 3 cursos que nadie eligió (1 cupo cada uno).
insert into public.sorteo_cursos (aliado, nombre, cupos, orden) values
  ('we', 'Desarrollo Web', 1, 1), ('we', 'UX/UI', 1, 2), ('we', 'Metodologías Ágiles', 1, 3)
on conflict (aliado, nombre) do nothing;

create or replace function public._sorteo_anotar_premio() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare titulo_ text;
begin
  select titulo into titulo_ from public.sorteo_config;
  if titulo_ ilike '%mayugo%' or titulo_ ilike '%educación ejecutiva%' then
    insert into public.sorteo_premios (person_id, aliado, sorteo)
    values (new.person_id, case when titulo_ ilike '%mayugo%' then 'mayugo' else 'we' end, titulo_)
    on conflict (person_id, sorteo) do nothing;
  end if;
  return new;
end $$;
