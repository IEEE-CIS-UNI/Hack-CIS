/**
 * Datos propios de cada sesión del bootcamp que no están en `contenido.ts`:
 * fecha, hora, color, descripción del workshop, ideas clave y ponentes.
 *
 * Títulos, íconos y textos de la sesión salen de `SESIONES` (contenido.ts);
 * aquí se indexa por su número («01»…«05»).
 */

export type Ponente = {
  name: string;
  role: string;
  bio: string;
  href?: string; // perfil de LinkedIn
  foto?: string; // archivo en /public/fotos; sin foto se muestran las iniciales
};

export type Bloque = { title: string; desc: string };

export type DatosSesion = {
  fecha: string;
  hora: string;
  horario: string; // inicio y fin, para la tarjeta de Zoom
  tone: string;
  tone2: string;
  resumen: string; // descripción corta (tarjetas de /bootcamp)
  workshop?: string; // enfoque del workshop según la ponencia; si falta, se usa `resumen`
  ideas: string[];
  video?: string; // ID del video de YouTube; sin él se muestra «Próximamente»
  bloques?: Bloque[]; // agenda de la sesión; si falta, se muestran los bloques «por definir»
  ponentes: Ponente[]; // solo confirmados (uno por sesión)
};

const IN = "https://www.linkedin.com/in/";

// Ponentes: salen de la hoja «Bootcamp-CIS» y solo se publican los que figuran como CONFIRMADO.
// Los comentarios internos de la hoja (contactos, teléfonos, notas) no se publican.
export const DATOS_SESION: Record<string, DatosSesion> = {
  "01": {
    fecha: "Lun 23/11",
    video: "rjTCJ8MjIX4",
    hora: "8:30 pm",
    horario: "8:30 pm – 11:30 pm",
    tone: "#8b5cf6",
    tone2: "#4d17c2",
    resumen:
      "Aprende a identificar problemas reales y transformarlos en soluciones innovadoras mediante herramientas de ideación y diseño centrado en el usuario.",
    workshop:
      "Taller de problematización: parte del reto hacia un usuario concreto con mapas de empatía y preguntas «¿Cómo podríamos…?», forma equipo con pitch-and-join (ideas en un minuto para que otros se sumen) y define el problema de tu equipo en dos frases para probarlo rápido.",
    ideas: ["Mapas de empatía y «¿Cómo podríamos…?»", "Formar equipo con pitch-and-join", "Tu problema en dos frases"],
    bloques: [
      {
        title: "Problematización",
        desc: "Del reto a un usuario concreto, con mapas de empatía y preguntas «¿Cómo podríamos…?» para enfocar el problema y esbozar una propuesta de valor.",
      },
      {
        title: "Pitch-and-join",
        desc: "Presentas tu idea en un minuto para que otros se sumen y se formen los equipos.",
      },
      {
        title: "El problema en dos frases",
        desc: "Cierras definiendo el problema de tu equipo en dos frases, la base para probarlo rápido.",
      },
    ],
    ponentes: [
      {
        name: "Karen Camargo Alvarez",
        role: "Innovación y emprendimiento",
        bio: "Experta en innovación y emprendimiento, con maestría en Gestión de la Innovación (UPC). Asesora startups y es docente universitaria.",
        href: `${IN}karencamargoalvarez/`,
        foto: "/fotos/karen-camargo.webp",
      },
    ],
  },
  "02": {
    fecha: "Mar 24/11",
    video: "gQGQrtYTXjM",
    hora: "10:00 am",
    horario: "10:00 am – 1:00 pm",
    tone: "#22c7ee",
    tone2: "#0b7a96",
    resumen:
      "Valida el potencial de tu idea, define tu propuesta de valor y aprende a estructurar un pitch claro y convincente.",
    workshop:
      "Una buena solución con IA no basta si nadie la necesita o si no sabes contarla. Aprende a validar el problema con evidencia real, definir a quién ayudas con tu propuesta de valor y armar un pitch breve y convincente. Saldrás con un borrador de ambos, ideal si ya tienes una idea y quieres presentarla ante el jurado.",
    ideas: [
      "Validar el problema con evidencia real",
      "Tu propuesta de valor en una frase",
      "Un pitch con hilo conductor",
    ],
    bloques: [
      { title: "Validar con evidencia", desc: "Comprueba que el problema es real antes de construir." },
      { title: "Tu propuesta de valor", desc: "Define a quién ayudas y cuál es tu propuesta de valor, en una frase clara." },
      { title: "Estructura del pitch", desc: "Arma un pitch breve con un hilo que conecte problema, solución e impacto." },
      { title: "Ejercicio en vivo", desc: "Sales con un borrador de tu propuesta de valor y de la estructura de tu pitch." },
    ],
    ponentes: [
      {
        name: "Mariana Zavaleta",
        role: "Fundadora de Mariana Zavi",
        bio: "Ingeniera industrial y docente de negocios. Ha asesorado a más de 100 proyectos de estudiantes y acompaña a una comunidad de 40 mil personas.",
        href: "https://www.linkedin.com/feed/update/urn:li:activity:7427758390157860866/",
        foto: "/fotos/mariana-zavaleta.webp",
      },
    ],
  },
  "03": {
    fecha: "Mié 25/11",
    hora: "4:00 pm",
    horario: "4:00 pm – 7:00 pm",
    tone: "#d946ef",
    tone2: "#8d1ba3",
    resumen:
      "Conoce las etapas del ciclo de vida del desarrollo de software y cómo aplicarlas para construir un MVP de manera ágil.",
    workshop:
      "Un buen producto en una hackathon necesita estructura y velocidad. Recorrerás las fases del ciclo de vida del software, del levantamiento de requerimientos a las pruebas y el despliegue, y aprenderás a priorizar las funcionalidades clave para llevar tu MVP de inicio a fin.",
    ideas: ["Del requerimiento al despliegue", "Priorizar lo que entra al MVP", "Un flujo de desarrollo ágil"],
    ponentes: [
      {
        name: "Jim Sáenz",
        role: "Arquitecto de soluciones cloud · MCT",
        bio: "Arquitecto cloud y Microsoft Certified Trainer. Instructor de IA generativa y Power Platform, y gerente en Ova Cognition.",
        href: `${IN}ACoAAANd44YBTGf2hpFXDOSCtk7-Q4qneTA6Ph8`,
        foto: "/fotos/jim-saenz.webp",
      },
    ],
  },
  "04": {
    fecha: "Jue 26/11",
    hora: "7:00 pm",
    horario: "7:00 pm – 10:00 pm",
    tone: "#8b5cf6",
    tone2: "#4d17c2",
    resumen:
      "Explora cómo utilizar herramientas de inteligencia artificial y Spec-Driven Development para acelerar y estructurar el desarrollo de soluciones.",
    ideas: ["IA como copiloto de desarrollo", "Spec-Driven Development", "De la especificación al código"],
    ponentes: [
      {
        name: "Gabriel Gonza",
        role: "Technical Lead en Ravn",
        bio: "AI & Cloud Solutions Architect (AWS) y Claude Certified Architect. Lanza productos de IA para startups de EE. UU. y cofundó Paxsi, ganadora del fondo semilla de KOICA.",
        href: `${IN}gadidgc/`,
      },
    ],
  },
  "05": {
    fecha: "Vie 27/11",
    hora: "5:00 pm",
    horario: "5:00 pm – 8:00 pm",
    tone: "#22c7ee",
    tone2: "#0b7a96",
    resumen:
      "Conoce buenas prácticas de seguridad, pruebas y validación para asegurar la calidad de tu MVP y preparar los entregables finales de la hackathon.",
    ideas: ["Seguridad desde el diseño", "Pruebas y validación", "Entregables de la hackathon"],
    ponentes: [
      {
        name: "José Guerra",
        role: "Arquitecto de soluciones cloud",
        bio: "Arquitecto de soluciones cloud con 5 años de experiencia ayudando a empresas de la región a resolver sus desafíos tecnológicos.",
        href: `${IN}jose-carlos-guerra-martinez`,
        foto: "/fotos/jose-guerra.webp",
      },
    ],
  },
};

/** Estructura interna de cada sesión. Aún no hay agenda explícita: 4 bloques por definir. */
export const BLOQUES: Bloque[] = [1, 2, 3, 4].map(() => ({
  title: "Por definir",
  desc: "Contenido por definir.",
}));
