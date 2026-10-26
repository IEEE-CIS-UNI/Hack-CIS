# Supabase

Lo que vive aquí no se ejecuta solo: son las piezas que hay que pegar en el
panel de Supabase. Están versionadas para que, cuando alguien se pregunte por
qué la base está como está, la respuesta esté en el repositorio y no en la
memoria de quien la configuró.

## `001-inscripcion.sql`

Corre en **SQL Editor → pegar → Run**. Es idempotente.

Agrega a `hackers` las dos columnas que faltaban (`dni_hash` y `track`) y crea
las políticas de acceso: cada persona puede escribir y leer su propia fila y
ninguna otra. El vínculo es `auth_user_id`, que solo existe después de
confirmar el correo institucional — eso es lo que convierte el correo en una
prueba de identidad y no en un campo de texto.

Los catálogos (`institutions`, `university_domains`, `expertises`) quedan de
lectura pública: el formulario los necesita antes de que nadie inicie sesión.

## `correo-confirmacion.html`

Va en **Authentication → Emails → Magic Link → Body**.
Asunto: `Confirma tu lugar en CIS[HACK] UNI 2026`

Supabase no deja editar las plantillas hasta configurar SMTP propio, así que
primero va el SMTP y después esto.

Está escrito con tablas y estilos en línea porque Gmail, Outlook y Apple Mail
descartan `<style>`, flexbox y grid. Lo que parece anticuado es lo único que
se ve igual en los tres.

Variables que usa:

| variable | de dónde sale |
|---|---|
| `{{ .ConfirmationURL }}` | el enlace de un solo uso |
| `{{ .Email }}` | a quién va dirigido |
| `{{ .Data.name }}` | nombre real, de los metadatos del usuario |
| `{{ .Data.track }}` | track elegido |

Los bloques `{{ if }}` están para que, si un dato no llegó, el correo se lea
bien igual en vez de mostrar un hueco o la palabra `<no value>`.

## Configuración del panel que no es un archivo

- **Authentication → URL Configuration**
  - Site URL: la del entorno (`http://localhost:3000` o el dominio de Vercel)
  - Redirect URLs: `<sitio>/bienvenida` y `<sitio>/mi-inscripcion`
  - Al desplegar hay que **agregar** las de producción, no reemplazar las de
    local, o se rompe el desarrollo.

- **Authentication → Emails → SMTP Settings**: cuenta propia para que el
  remitente sea `ieee.cis@uni.edu.pe` y no `noreply@mail.app.supabase.io`.

- **Authentication → Rate Limits**: el envío de correos viene muy bajo por
  defecto. Con 250 cupos hay que subirlo.

## Variables de entorno

Las mismas tienen que estar en local (`.env`) y en Vercel:

| variable | para qué | ojo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | proyecto | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave pública | — |
| `API_APP_JSON` | consulta de DNI | es de pago: nunca al navegador |
| `DNI_PEPPER` | sal del hash del DNI | **si cambia, los hashes guardados dejan de cuadrar** |
| `INSCRIPCION_SECRETO` | firma del boleto | si cambia, los boletos en vuelo se invalidan |
| `NEXT_PUBLIC_SITE_URL` | a dónde vuelve el correo | en Vercel se puede omitir: `VERCEL_URL` la reemplaza |
