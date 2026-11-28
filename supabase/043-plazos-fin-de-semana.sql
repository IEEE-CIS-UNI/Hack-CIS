-- Ampliación del 27/11 a favor de quienes participan: equipos hasta el sábado 28 a las 11:59 p. m. y elección de track
-- hasta el domingo 29 a las 12:00 m. (Lima).
update public.equipos_config set cierra = '2026-11-28 23:59:59-05';
update public.tracks set closes_at = '2026-11-29 12:00:00-05' where revealed;
