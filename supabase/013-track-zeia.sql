-- 013 · Zeia es sponsor del track de Energía.
--
-- El primero de los tres tracks se revela: «IA & Energía», presentado por Zeia
-- (monitoreo energético en tiempo real). Se le da su slug y se marca como revelado;
-- los otros dos siguen por anunciar. Si ya hubiera equipos en ese track no se
-- renombra el slug, solo se completa lo demás.
--
-- Idempotente.

do $$
begin
  if exists (select 1 from public.tracks where slug = 'pronto-1')
     and not exists (select 1 from public.tracks where slug = 'energia')
     and not exists (select 1 from public.hack_teams where track_slug = 'pronto-1') then
    update public.tracks set slug = 'energia' where slug = 'pronto-1';
  end if;
end $$;

update public.tracks
   set name = 'Energía', revealed = true, sponsor_name = 'Zeia', sponsor_url = 'https://zeia.com.pe/'
 where slug = 'energia';
