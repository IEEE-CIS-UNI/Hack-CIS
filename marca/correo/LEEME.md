# Imágenes del correo (para subir a Vercel Blob)

Todas están hechas al doble del tamaño con el que se muestran (retina): en el
HTML del correo se ponen con `width` en la mitad y `height="auto"`.

| archivo | tamaño | se muestra a | dónde va |
|---|---|---|---|
| `email-cabecera.png` | 1200×560 | 600 px | arriba del correo (logo, «The Agentic Era», cohete y robot) |
| `email-separador.png` | 1200×24 | 600 px | línea entre bloques |
| `email-robot.png` | 600×600 | 200–300 px | junto al botón de confirmar |
| `email-logotipo.png` | 800×240 | 260–400 px | versión compacta del nombre, para correos cortos |
| `email-organizadores.png` | 1200×180 | 600 px | antes del pie: CIS UNI, DSC PUCP, DSC UNI |
| `email-pie.png` | 1200×300 | 600 px | cierre del correo |
| `og.jpg` | 1200×630 | — | imagen para compartir el enlace (ya está en `src/app/opengraph-image.jpg`) |
| `icono-robot.png` | 512×512 | 48–96 px | ícono del robot |

Todas llevan el fondo oscuro de la marca incluido (`#08030f`), a propósito: así
se ven igual en el modo oscuro de Gmail y Apple Mail, que cambian los fondos
transparentes. El fondo del `<body>` del correo también debe ser `#08030f`.

Los botones y los textos van en HTML, no en imagen: si el cliente bloquea las
imágenes (Outlook lo hace por defecto), el correo se tiene que poder leer igual.
Pon siempre `alt` en cada `<img>`.
