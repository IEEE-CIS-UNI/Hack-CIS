/**
 * Datos propios de cada sesión del bootcamp que no están en `contenido.ts`:
 * fecha, color, resumen del PDF, ideas clave y ponentes.
 *
 * Títulos, íconos y textos de la sesión salen de `SESIONES` (contenido.ts);
 * aquí se indexa por su número («01»…«05»).
 */

export type Ponente = {
  name: string;
  role: string;
  bio: string;
  href?: string; // perfil de LinkedIn
};

export type DatosSesion = {
  fecha: string;
  tone: string;
  tone2: string;
  resumen: string; // descripción de la hoja de ponentes
  ideas: string[];
  ponentes: Ponente[]; // vacío = tarjetas «por anunciar»
};

const POR_COMPLETAR = "Biografía por completar.";
const IN = "https://www.linkedin.com/in/";

// Ponentes: salen de la hoja de ponentes (estado «mapeado», aún sin confirmar).
// Solo se publican cargo, empresa y formación; los comentarios internos de la hoja no.
export const DATOS_SESION: Record<string, DatosSesion> = {
  "01": {
    fecha: "Lun 23/11",
    tone: "#8b5cf6",
    tone2: "#4d17c2",
    resumen:
      "Aprende a identificar problemas reales y transformarlos en soluciones innovadoras mediante herramientas de ideación y diseño centrado en el usuario.",
    ideas: ["Detectar problemas reales", "Ideación centrada en el usuario", "Un prototipo que se puede probar"],
    ponentes: [
      { name: "Miluska Talavera", role: "UI/UX", bio: "Especialista en UI/UX con experiencia como docente de sistemas.", href: `${IN}miluska-talavera/` },
      { name: "Kevin Melgarejo Solis", role: "Fundador y CEO de Uberfy", bio: "Mentor en Startup UNI.", href: `${IN}kevinmelgarejo` },
      { name: "Juan Manuel Huamancayo Pierrend", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}jmhuamancayo` },
      { name: "Ronald Barzola", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}ronaldbarzola/` },
      { name: "Kevin Edinson Vilcherres Trinidad", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}kevinedinson/` },
      { name: "Karen Camargo Alvarez", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}karencamargoalvarez/` },
    ],
  },
  "02": {
    fecha: "Mar 24/11",
    tone: "#22c7ee",
    tone2: "#0b7a96",
    resumen: "Valida el potencial de tu idea, define tu propuesta de valor y aprende a estructurar un pitch claro y convincente.",
    ideas: ["Propuesta de valor", "Validar con evidencia", "Estructura de un buen pitch"],
    ponentes: [
      { name: "Ghissell Loayza", role: "Negocios", bio: "Perfil orientado al negocio.", href: `${IN}gklm/` },
      { name: "Mg. Aldo Siu", role: "Fundador de IngenIA", bio: "Magíster por la UNI FIIS. Dirige IngenIA, una consultora de IA.", href: `${IN}aldosiu/` },
      { name: "Jorge Portilla Swayne", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}jpswayne91/` },
      { name: "Jonathan Alva", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}jonathanalvaa/` },
      { name: "Fiorella Cisneros", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}fiorella-cisneros/` },
      { name: "Mariana Zzvi", role: "Ponente", bio: POR_COMPLETAR },
    ],
  },
  "03": {
    fecha: "Mié 25/11",
    tone: "#d946ef",
    tone2: "#8d1ba3",
    resumen:
      "Conoce las etapas del ciclo de vida del desarrollo de software y cómo aplicarlas para construir un MVP de manera ágil.",
    ideas: ["Etapas del ciclo de vida", "Del requisito al MVP", "Trabajo ágil en equipo"],
    ponentes: [
      { name: "Mg. Michell Alvarez", role: "INDRA", bio: "Magíster con varios años de experiencia en INDRA.", href: `${IN}michell-alvarez-cadillo-608231144/` },
      { name: "Javier Alejandro Arteaga Gonzales", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}javierargo/` },
      { name: "Pablo Jauregui", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}pablo-jaureguip/` },
    ],
  },
  "04": {
    fecha: "Jue 26/11",
    tone: "#8b5cf6",
    tone2: "#4d17c2",
    resumen:
      "Explora cómo utilizar herramientas de inteligencia artificial y Spec-Driven Development para acelerar y estructurar el desarrollo de soluciones.",
    ideas: ["IA como copiloto de desarrollo", "Spec-Driven Development", "De la especificación al código"],
    ponentes: [
      { name: "Ing. Wilmer Paucar", role: "Analítica de datos y calidad · ISAT", bio: "Egresado de la FIIS UNI. Coordina analítica de datos y calidad en ISAT.", href: `${IN}wilmerjesuspaucar/` },
      { name: "Abel Tarazona", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}abeltarazona/` },
      { name: "Gera Flores Sempertegui", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}soymissyera/` },
    ],
  },
  "05": {
    fecha: "Vie 27/11",
    tone: "#22c7ee",
    tone2: "#0b7a96",
    resumen:
      "Conoce buenas prácticas de seguridad, pruebas y validación para asegurar la calidad de tu MVP y preparar los entregables finales de la hackathon.",
    ideas: ["Seguridad desde el diseño", "Pruebas y validación", "Entregables de la hackathon"],
    ponentes: [
      { name: "Omar Palomino", role: "Especialista en ciberseguridad", bio: "Tiene su propia empresa de ciberseguridad, Kuruk.", href: `${IN}opalomino` },
      { name: "Ing. Luis Sanchez", role: "Seguridad cloud", bio: "5 años de experiencia en NTT Data. Ha dictado cursos de seguridad, SOC y documentación de seguridad.", href: `${IN}ing-luis-gonzalo-s-0b0915100/` },
      { name: "Oscar Campos Andía", role: "Ponente", bio: POR_COMPLETAR, href: `${IN}oscar-campos-and%C3%ADa-69060446/` },
    ],
  },
};

/** Estructura interna de cada sesión. Aún no hay agenda explícita: 4 bloques por definir. */
export const BLOQUES = [1, 2, 3, 4].map((n) => ({
  title: `Bloque ${n}`,
  desc: "Contenido por definir.",
}));
