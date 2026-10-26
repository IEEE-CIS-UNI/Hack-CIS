-- ---------------------------------------------------------------------------
-- El panel del inscrito: foto, credencial y banner.
--
-- Agrega el lugar donde vive la foto y abre un depósito de archivos con
-- permisos por persona. Es idempotente.
--
-- Supabase → SQL Editor → pegar → Run.
-- ---------------------------------------------------------------------------

-- ── 1. dónde se guarda la foto ──────────────────────────────────────────────

alter table public.hackers add column if not exists photo_url text;

comment on column public.hackers.photo_url is
  'URL pública de la foto de perfil. El archivo vive en el depósito «fotos».';

-- ── 2. el depósito de fotos ─────────────────────────────────────────────────
-- Público para leer: la credencial y el banner tienen que poder mostrar la
-- foto sin pedir permisos, y el banner se arma en el navegador de quien lo
-- comparte. Lo que NO es público es escribir.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 3145728,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- 3 MB y solo imágenes: el límite lo pone el depósito, no el formulario, para
-- que no dependa de que el navegador se porte bien.

-- ── 3. quién puede tocar qué ────────────────────────────────────────────────
-- La regla: cada quien escribe dentro de una carpeta con su propio id de
-- usuario. Así nadie puede pisar la foto de otro, aunque invente la petición.

drop policy if exists "fotos: ver" on storage.objects;
create policy "fotos: ver"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'fotos');

drop policy if exists "fotos: subir la propia" on storage.objects;
create policy "fotos: subir la propia"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "fotos: reemplazar la propia" on storage.objects;
create policy "fotos: reemplazar la propia"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "fotos: borrar la propia" on storage.objects;
create policy "fotos: borrar la propia"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ── 4. comprobación ─────────────────────────────────────────────────────────

select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'hackers'
      and column_name = 'photo_url')                         as columna_photo_url,
  (select count(*) from storage.buckets where id = 'fotos')  as deposito_fotos,
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'fotos:%')                         as politicas_fotos;
