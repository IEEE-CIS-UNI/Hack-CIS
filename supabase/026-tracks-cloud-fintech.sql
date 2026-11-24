-- 026 · Tracks «Cloud» y «Fintech»
--
-- · El track «Nube» (Manantial) pasa a llamarse «Cloud»; su página es ahora /tracks/cloud (el enlace viejo /tracks/nube redirige).
-- · Millennium (grupo peruano de finanzas: Millennium, Lima Bikes y Lizzo) es sponsor del tercer track, «Fintech»: se revela el que
--   estaba como «por anunciar» (pronto-3). Su página es /tracks/fintech (ver components/MillenniumTrack).
--
-- Solo se cambia si todavía nadie armó equipo en esos tracks. Idempotente.

update public.tracks
   set slug = 'cloud', name = 'Cloud'
 where slug = 'nube'
   and not exists (select 1 from public.tracks where slug = 'cloud')
   and not exists (select 1 from public.hack_teams where track_slug = 'nube');

update public.tracks
   set slug = 'fintech', name = 'Fintech', revealed = true,
       sponsor_name = 'Millennium', sponsor_url = 'https://millennium.ky/'
 where slug = 'pronto-3'
   and not exists (select 1 from public.tracks where slug = 'fintech')
   and not exists (select 1 from public.hack_teams where track_slug = 'pronto-3');
