# datos/

## padron.csv

El padrón de matriculados que entrega Registros Académicos de cada
universidad. **Este archivo no existe todavía y el sitio funciona sin él.**

Sin padrón, la inscripción se verifica con el correo institucional: se
confirma el nombre contra el DNI y la universidad contra el dominio. Lo que
falta es la carrera, la facultad, el ciclo y la prueba de que el código le
pertenece a quien lo escribe.

Con padrón, esos cuatro datos aparecen solos y el sistema detecta a quien
use un código ajeno.

### Cómo activarlo

Copia aquí el CSV que te entreguen con el nombre `padron.csv`. Se lee en
caliente: no hay que reiniciar el servidor.

Columnas mínimas:

```csv
codigo,nombres,apellido_paterno
```

Recomendadas, porque cada una habilita algo:

| Columna | Para qué |
|---|---|
| `universidad` | Siglas (UNI, PUCP…). Permite juntar varias universidades en un archivo. |
| `apellido_materno` | Hace más estricto el cruce con el DNI. |
| `carrera`, `facultad`, `ciclo` | Se autocompletan en el formulario. |
| `estado` | `matriculado` pasa; cualquier otro valor se rechaza. |

### Para probar

`padron-ejemplo.csv` tiene ocho filas de prueba. **Sus carreras y ciclos son
inventados.** Si lo copias como `padron.csv` para ver el flujo completo,
recuerda borrarlo después:

```powershell
Copy-Item datos/padron-ejemplo.csv datos/padron.csv   # activar la demo
Remove-Item datos/padron.csv                          # volver a la realidad
```

Nunca pongas datos aproximados en `padron.csv`. Un padrón inventado es peor
que no tener padrón: muestra con total confianza una carrera equivocada, y
la mayoría de gente no se da cuenta.

### Protección de datos

`padron.csv` está en `.gitignore`. Son datos personales de terceros bajo la
Ley 29733: no van al repositorio, no se comparten por WhatsApp y se borran
cuando termine el evento.
