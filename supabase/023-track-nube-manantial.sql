-- 023 · Track «IA & Nube», con Manantial como sponsor
--
-- Manantial (consultora peruana de tecnología, partner de AWS, Google Cloud y Oracle) es sponsor del segundo track.
-- Se revela el track que estaba como «por anunciar» (pronto-2): pasa a llamarse Nube, con su sponsor, y queda
-- disponible para unirse en las mismas fechas que los demás. Su página es /tracks/nube
-- (ver components/ManantialTrack). Solo se cambia si todavía nadie armó equipo en ese track.
--
-- Idempotente.

update public.tracks
   set slug = 'nube', name = 'Nube', revealed = true,
       sponsor_name = 'Manantial', sponsor_url = 'https://manantial.pe/'
 where slug = 'pronto-2'
   and not exists (select 1 from public.tracks where slug = 'nube')
   and not exists (select 1 from public.hack_teams where track_slug = 'pronto-2');
