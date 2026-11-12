import { Bot, GitBranch, Lightbulb, ShieldCheck, Target } from "lucide-react";

/** Temas del Bootcamp. Los usan la landing y /bootcamp. */
export const TEMAS_BOOTCAMP = [
  {
    icon: Lightbulb,
    title: "Design Thinking & Design Sprint",
    text: "Entender al usuario y convertir una idea en algo que se pueda probar en días.",
    detalle:
      "Cómo pasar de un problema difuso a un prototipo que alguien pueda probar, con el método de un sprint de diseño.",
  },
  {
    icon: Target,
    title: "Validación de negocio",
    text: "Comprobar que tu solución le importa a alguien: usuario, propuesta de valor y viabilidad.",
    detalle:
      "Comprobar que la solución le importa a alguien: quién es el usuario, qué valor le das y si es viable. Es lo que convence a un sponsor.",
  },
  {
    icon: GitBranch,
    title: "Fundamentos de SDLC",
    text: "Cómo se planifica, construye y entrega software de punta a punta.",
    detalle:
      "El ciclo de vida del software de punta a punta, para que tu equipo se organice y no improvise durante las 100 horas.",
  },
  {
    icon: Bot,
    title: "Desarrollo con IA y SDD",
    text: "Construir con un agente de IA como quinto miembro, guiado por especificaciones.",
    detalle:
      "Trabajar con un agente de IA como quinto miembro del equipo, partiendo de una especificación clara y con herramientas gratuitas para estudiantes.",
  },
  {
    icon: ShieldCheck,
    title: "Buenas prácticas de seguridad, testing y entregables",
    text: "Lo que separa un prototipo vistoso de una solución que un sponsor puede pilotear.",
    detalle:
      "Lo mínimo de seguridad y pruebas, y cómo armar un entregable que un sponsor pueda evaluar y pilotear.",
  },
];

/**
 * Las sesiones del bootcamp como ofertas de inscripción: «01» es la página
 * /bootcamp/01 y «bootcamp-01» es la fila de `offerings` en la base.
 */
export const SESIONES = TEMAS_BOOTCAMP.map((t, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { ...t, n, slug: `bootcamp-${n}` };
});

export const sesionPorN = (n: string) => SESIONES.find((s) => s.n === n);

/** Qué recibe un sponsor de track. */
export const SPONSOR_OFRECE = [
  "Exclusividad: un solo sponsor por track.",
  "Stand en la feria de la Gran Final, afuera del auditorio.",
  "Una sección con tu marca en la web del evento.",
  "Acceso a las 5 soluciones finalistas de tu track.",
  "Base de participantes, con su consentimiento.",
  "Informe del evento al terminar.",
];

/** Qué se le pide a un sponsor de track. */
export const SPONSOR_PIDE = [
  "Un aporte económico que se destina a los premios.",
  "Un jurado para la Gran Final.",
  "Un mentor para tu track durante el build.",
];

/** Mentores y jurados: tiempo y criterio, no dinero. */
export const APOYO_ROLES = [
  {
    role: "Mentor",
    text: "Acompañas a los equipos de un track durante el build, entre 1 y 2 horas al día.",
  },
  {
    role: "Jurado de la Gran Final",
    text: "Evalúas los pitch y las demos de los 15 finalistas el sábado 5 de diciembre.",
  },
  {
    role: "Jurado del filtro inicial",
    text: "Opcional: revisas las propuestas de los equipos antes de elegir a los finalistas.",
  },
];
