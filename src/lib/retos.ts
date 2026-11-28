/** Los retos que entregaron los sponsors (27/11). Se muestran completos en la página de cada track. */
export type Bloque = { titulo: string; texto?: string; lista?: string[] };
export type RetoDatos = { nombre: string; destacado: string; bloques: Bloque[]; nota?: string };

export const RETOS: Record<"energia" | "cloud" | "fintech", RetoDatos> = {
  energia: {
    nombre: "Agente de Eficiencia Energética",
    destacado: "Visibilizar la infraestructura energética de una empresa y plantear estrategias de ahorro.",
    bloques: [
      { titulo: "Problemática", texto: "Las empresas no conocen su infraestructura energética, por eso les cuesta detectar eficiencias y proyectar ahorros. Esto genera pérdidas financieras de hasta USD 50 000 al año." },
      { titulo: "Solución esperada", texto: "Prototipo web o chatbot con un agente de IA que lea los datos de los diagramas unifilares y del consumo, detecte patrones y explique las recomendaciones." },
      { titulo: "Usuarios", texto: "Gerencias generales de empresas con varias sedes (por ejemplo, cadenas de comida rápida, bancos o tiendas por departamento) que consumen más de S/ 50 000 al mes en energía." },
      { titulo: "Restricciones", texto: "No hay conexión a medidores reales: se les entregan los datos." },
      { titulo: "Criterio del sponsor", texto: "Claridad de las recomendaciones para alguien sin conocimientos técnicos." },
      { titulo: "Material de apoyo", lista: ["Diagrama unifilar", "Archivo CSV con 6 meses de consumo", "Recibos de luz"] },
    ],
  },
  cloud: {
    nombre: "Un orientador de IA que ayuda a jóvenes a elegir qué estudiar",
    destacado: "Que un estudiante converse con la herramienta, identifique sus fortalezas e intereses y reciba al menos 3 caminos posibles (carreras o programas técnicos), cada uno con requisitos, duración y salidas laborales.",
    bloques: [
      { titulo: "Problemática", texto: "Muchos estudiantes de último año de secundaria eligen carrera con poca información sobre sus intereses, el mercado laboral y los costos. Los test vocacionales tradicionales dan resultados genéricos y no explican por qué una carrera encaja con cada joven. Como resultado, muchos cambian de carrera o abandonan en el primer año." },
      { titulo: "Solución esperada", texto: "Prototipo web o chatbot con un agente de IA que haga preguntas al estudiante, cruce sus respuestas con la base de carreras y explique cada recomendación en lenguaje simple. Demo en vivo." },
      { titulo: "Usuarios", texto: "Estudiantes de 4.° y 5.° de secundaria (15 a 17 años) y sus familias, sin conocimientos técnicos." },
      { titulo: "Restricciones", lista: ["Solo herramientas gratuitas o con crédito educativo.", "Interfaz en español.", "No usar datos reales de menores: trabajar con los perfiles ficticios de apoyo.", "La herramienta orienta, no decide por el estudiante."] },
      { titulo: "Criterio del sponsor", texto: "Claridad y utilidad de las recomendaciones para un joven de 16 años y su familia: que se entienda por qué se recomienda cada camino." },
      { titulo: "Material de apoyo", lista: ["CSV con 40 carreras y programas técnicos (requisitos, duración, costo referencial y salidas laborales)", "10 perfiles ficticios de estudiantes con intereses y rendimiento académico"] },
    ],
  },
  fintech: {
    nombre: "Del volante a la cuota",
    destacado: "¿Cómo podemos usar la telemetría GPS para anticipar qué contratos pasarán a tener 7 o más días de atraso en las próximas dos semanas, y qué debería hacer cobranzas con cada caso?",
    bloques: [
      { titulo: "Contexto", texto: "Millennium entrega vehículos en leasing a conductores que trabajan en taxi por aplicativo, que pagan su cuota con lo que ganan manejando. La hipótesis es que la forma de usar el vehículo cambia antes de que se deje de pagar: compruébenla o refútenla con datos. El GPS solo no basta, por eso el reto combina el uso del vehículo con el historial de pagos." },
      { titulo: "Qué valoran", texto: "Cada equipo decide qué señales construir (kilómetros por día, horas activas, días trabajados, horarios y zonas, excesos de velocidad, conducción nocturna u otras) y cómo explicarlas. Deben ser útiles para una persona de cobranzas: un agrupamiento que no sirva para cobranzas, o un tablero que solo describa el pasado, no resuelve el reto." },
      { titulo: "Qué entregar", lista: ["Predicciones (obligatorio): CSV con id_contrato, fecha_corte y la probabilidad de llegar a 7 o más días de atraso en las dos semanas siguientes, para todas las filas de «evaluacion».", "Recomendado: motivo y acción de cobranza por cada contrato en alerta.", "Recomendado: explicación en lenguaje de negocio de las señales o perfiles usados.", "Bonus: un hallazgo en los datos que cambiaría la forma de operar el leasing."] },
      { titulo: "Datos", texto: "Seis tablas anonimizadas: viajes, puntos_gps (muestra), contratos, pagos, estados_semanales y evaluacion. El GPS va desde el 2 de marzo de 2026; las últimas 6 semanas se reservan para evaluar." },
      { titulo: "Ojo con los datos", lista: ["Un silencio largo indica falta de señal o desconexión, no necesariamente un vehículo apagado.", "«ignition» no es confiable: usen velocidad y movimiento.", "«distance» está en kilómetros e «io16» (odómetro) en metros; no usen «totaldistance».", "La ubicación llega como zona y el atraso se mide una vez por semana.", "Para saber si hubo atraso usen «estados_semanales», no «se_cobro_mora».", "Hay tres productos codificados (A, B, C), dos modelos de rastreador y reportes duplicados en el tiempo."] },
      { titulo: "Reglas del reto", lista: ["Corte temporal: solo se usa información anterior al vencimiento de la cuota y a la fecha de corte. Incumplirlo anula la solución analítica.", "Sin señal no es inactividad: no se trata como cero kilómetros ni como vacío.", "El perfil es del vehículo y su contrato, no la conducta personal del titular.", "Durante el desarrollo se anunciará un cambio en una regla de negocio, que todos deben incorporar antes del cierre."] },
      { titulo: "Cómo se mide", lista: ["Anticipación de atrasos: del 20 % marcado como de mayor riesgo, cuántos de los nuevos atrasos reales quedaron dentro.", "Mejora frente a un modelo que use solo el historial de pagos.", "Utilidad para cobranzas: cada alerta, motivo y acción se entienden sin ayuda."] },
      { titulo: "Uso responsable de los datos", lista: ["Son confidenciales y describen a personas reales (Ley 29733), aunque estén anonimizados.", "Solo para este reto y durante el evento; no se suben a servicios no autorizados ni al control de versiones.", "No se intenta identificar clientes ni reconstruir domicilios o rutinas.", "Al cierre, cada equipo elimina sus copias.", "Las acciones propuestas son gestiones de cobranza; ninguna sanción se aplica sin revisión de una persona."] },
    ],
  },
};
