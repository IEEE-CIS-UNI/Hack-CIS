-- 011 · Enlace privado para ver la card y el código de Discord.
--
-- Algunos correos institucionales (UTP, Científica…) abren los enlaces antes que la
-- persona y los gastan: el enlace de confirmación y el de «Olvidé mi contraseña» son
-- de un solo uso, así que a esas personas les sale «ya se usó» y no pueden entrar al
-- panel. Para no dejarlas sin su card ni su código, cada persona tiene un enlace
-- propio y permanente (https://hackcis.lat/card/<token>) que solo MUESTRA su card:
-- abrirlo no gasta nada, así que un escáner no lo rompe.
--
-- El token es largo y aleatorio (como un enlace privado de Drive). Quien lo tenga ve
-- el nombre, la universidad, el número, el código de Discord y las sesiones de esa
-- persona; nunca el correo, el celular ni el DNI.
--
-- Se puede volver a correr sin problema.

alter table public.people add column if not exists card_token text;
update public.people set card_token = replace(gen_random_uuid()::text, '-', '') where card_token is null;
alter table public.people alter column card_token set default replace(gen_random_uuid()::text, '-', '');
alter table public.people alter column card_token set not null;
create unique index if not exists people_card_token_key on public.people (card_token);

create or replace function public.card_por_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'display_name', p.display_name,
    'institution',  i.name,
    'photo_url',    p.photo_url,
    'hack', (
      select jsonb_build_object('number', e.number, 'code', e.access_code, 'redeemed', e.redeemed_at is not null)
      from public.enrollments e where e.person_id = p.id and e.offering_slug = 'hack'
    ),
    'sesiones', (
      select coalesce(jsonb_agg(e.offering_slug order by e.offering_slug), '[]'::jsonb)
      from public.enrollments e where e.person_id = p.id and e.offering_slug like 'bootcamp-%'
    )
  )
  from public.people p
  left join public.institutions i on i.id = p.institution_id
  where length(p_token) = 32 and p.card_token = p_token
$$;

revoke all on function public.card_por_token(text) from public;
grant execute on function public.card_por_token(text) to anon, authenticated;

-- El token no se lee por ninguna otra vía: las columnas visibles de `people` son las
-- que ya estaban concedidas; esta no se concede.
