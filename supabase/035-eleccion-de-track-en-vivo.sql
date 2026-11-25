-- 035 · La elección de track se lanza en vivo, durante la presentación de sponsors (vie 27/11, 8:30 p. m.).
--
-- opens_at queda en una hora de respaldo (vie 27, 11:59 p. m.) por si nadie la lanza. Para lanzarla, la organización pone
-- opens_at = ahora + unos minutos (script abrir-tracks.mjs, fuera del repositorio): la web muestra la cuenta regresiva.
-- No toca un track que ya esté abierto. Idempotente.

update public.tracks set opens_at = timestamptz '2026-11-27 23:59:00-05'
 where opens_at > now() and opens_at = timestamptz '2026-11-27 20:00:00-05';
