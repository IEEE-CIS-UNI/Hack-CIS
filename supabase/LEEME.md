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

## `004-inscripciones.sql`

La versión 2 de las inscripciones. **Va después de 001 y 003** y también es
idempotente. Se corre igual: SQL Editor → pegar → Run.

Una persona (`people`) ya no es «un hacker»: puede estar inscrita en la hack,
en una o varias sesiones del bootcamp, o en ambas. Lo que existe para
inscribirse vive en `offerings` (`hack`, `bootcamp-01`…`bootcamp-05`) y cada
inscripción es una fila de `enrollments`.

| tabla | para qué |
|---|---|
| `people` | una fila por persona; el DNI solo como huella (`dni_hash`) |
| `offerings` | lo que se puede elegir; la hack tiene `capacity = 250`, el bootcamp no tiene tope |
| `enrollments` | persona + oferta; en la hack lleva el número de inscrito y el código de Discord |
| `tracks` | los tres tracks (todos por anunciar), con la ventana en que se pueden elegir |
| `hack_teams`, `hack_team_members` | el equipo (nombre, track, líder) y sus integrantes |

El track ya **no** es de la persona: es del equipo, y lo elige el líder desde
la página del track. Nadie escribe directo en `enrollments` ni en los equipos:
pasa por funciones (`register_person`, `enroll_in`, `create_team`,
`leave_team`) que hacen cumplir el tope de 250, la elegibilidad y las reglas de
equipo (2 a 4 personas, al menos 2 carreras distintas, ya inscritos, sin
equipo). Lo que había en `hackers` se **copia** a `people` con el mismo id; las
tablas viejas (`hackers`, `teams`, `sponsors`) no se tocan.

También marca como elegibles a los institutos y deja dos cosas para el bot de
Discord, que usa la clave de servicio:

- `redeem_hack_code(código, discord_id, discord_username)`: canjea el código de
  4 letras + 4 números de un inscrito y devuelve su nombre, equipo y track.
  Acepta el código con o sin guion.
- la vista `hack_roster`: inscritos con equipo y track. **El bot debe leer de
  aquí y no de `hackers.track`**, que ya no se actualiza.

Las fechas de elección de track (`opens_at`/`closes_at`) están puestas para el
viernes 27 y el sábado 28 de noviembre; se cambian en la tabla `tracks`.

## `correo-confirmacion.html`

Va en **Authentication → Emails → Confirm signup → Body** (es el que Supabase
manda a quien se inscribe por primera vez).
Asunto: `Confirma tu lugar en HACK[CIS] UNI 2026`

`correo-ingreso.html` va en **Magic Link → Body** (para quien ya tiene cuenta y
pide entrar sin contraseña). Asunto: `Tu acceso a HACK[CIS] UNI 2026`.
Conviene probar los dos una vez, porque cuál plantilla usa Supabase en cada caso
depende de si la persona ya existía.

Las imágenes están en Vercel Blob; los originales viven en `marca/correo/`. Las
URL llevan `?v=2` para saltarse el caché cuando se vuelve a subir una imagen
con el mismo nombre: si cambias una, sube el número en las plantillas.

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
| `{{ .Data.plan_label }}` | a qué se inscribe («la Hackathon», «el Bootcamp»…) |

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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clave pública (sirve también `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | — |
| `API_APP_JSON` | consulta de DNI (opcional) | hoy no se usa: el DNI y el nombre los escribe la persona |
| `DNI_PEPPER` | sal del hash del DNI | **si cambia, los hashes guardados dejan de cuadrar** |
| `INSCRIPCION_SECRETO` | firma del boleto | si cambia, los boletos en vuelo se invalidan |
| `NEXT_PUBLIC_SITE_URL` | a dónde vuelve el correo y la imagen para compartir | `https://hackcis.lat` en producción |
