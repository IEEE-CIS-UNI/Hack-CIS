/**
 * De los errores de la base a frases que se entienden.
 *
 * Las funciones de la base fallan con un código corto («cupo_lleno») o con el
 * código y la posición del dato que falló («dni_no_inscrito:2»). Aquí se
 * traducen, y la posición se usa para decirle al líder cuál de los DNI es el
 * problema.
 */

type Traduccion = { motivo: string; estado: number; posicion?: number; reintentable?: boolean };

const TEXTOS: Record<string, { motivo: string; estado: number }> = {
  sin_sesion: { motivo: "Tu sesión venció. Vuelve a entrar.", estado: 401 },
  sin_perfil: { motivo: "Todavía no tienes inscripción. Inscríbete primero.", estado: 404 },
  falta_nombre: { motivo: "Falta tu nombre.", estado: 422 },
  oferta_inexistente: { motivo: "Esa sesión no existe.", estado: 404 },
  cerrado: { motivo: "Las inscripciones a esto están cerradas.", estado: 409 },
  cupo_lleno: { motivo: "Se llenaron los 250 cupos de la hackathon.", estado: 409 },
  requiere_verificacion: {
    motivo: "Para la hackathon necesitas verificar tu identidad con el correo institucional y tu DNI. Inscríbete con ese correo.",
    estado: 403,
  },
  falta_dni: { motivo: "Escribe tu DNI.", estado: 422 },
  falta_celular: { motivo: "La hackathon pide tu celular, para coordinar con tu equipo.", estado: 422 },
  ciclo_invalido: { motivo: "Elige en qué ciclo estás, del 1 al 10.", estado: 422 },
  sin_hack: { motivo: "Para formar un equipo primero tienes que estar inscrito en la hackathon.", estado: 403 },
  ya_tiene_equipo: { motivo: "Ya perteneces a un equipo.", estado: 409 },
  track_inexistente: { motivo: "Ese track todavía no está disponible.", estado: 404 },
  track_aun_no: { motivo: "Todavía no se abre la elección de track. Será el viernes 27 de noviembre.", estado: 409 },
  track_cerrado: { motivo: "Ya cerró la elección de track.", estado: 409 },
  nombre_invalido: { motivo: "El nombre del equipo debe tener entre 3 y 40 caracteres.", estado: 422 },
  tamano_equipo: { motivo: "Un equipo es de 2 a 4 personas: tú y de 1 a 3 compañeros.", estado: 422 },
  dni_repetido: { motivo: "Repetiste un DNI.", estado: 422 },
  dni_no_inscrito: {
    motivo: "Ese DNI no está inscrito en la hackathon. Pídele a esa persona que se inscriba y vuelve a intentarlo.",
    estado: 422,
  },
  dni_propio: { motivo: "Ese es tu propio DNI: el equipo ya te incluye a ti.", estado: 422 },
  carrera_invalida: { motivo: "Elige tu carrera de la lista; si no está, marca «Otra carrera» y escríbela.", estado: 422 },
  carreras_iguales: { motivo: "El equipo necesita al menos 2 carreras o facultades distintas.", estado: 422 },
};

export function traducirError(mensaje: string | null | undefined, codigoPg?: string): Traduccion {
  const [clave, pos] = String(mensaje ?? "").split(":");
  const t = TEXTOS[clave];
  if (t) {
    const posicion = pos !== undefined && /^\d+$/.test(pos) && Number(pos) > 0 ? Number(pos) : undefined;
    return { ...t, posicion };
  }

  // Violaciones de unicidad que no pasaron por una regla.
  if (codigoPg === "23505") {
    if (/hack_teams_name/.test(mensaje ?? "")) {
      return { motivo: "Ya existe un equipo con ese nombre. Elige otro.", estado: 409 };
    }
    if (/hack_team_members/.test(mensaje ?? "")) {
      return { motivo: "Alguien de tu lista acaba de entrar a otro equipo. Inténtalo de nuevo.", estado: 409 };
    }
    if (/dni_hash/.test(mensaje ?? "")) {
      return { motivo: "Ese DNI ya está inscrito. Si fuiste tú, entra con el correo que usaste la primera vez.", estado: 409 };
    }
    if (/email|people_email/.test(mensaje ?? "")) {
      return { motivo: "Ese correo ya está inscrito. Entra con él para ver tu ficha.", estado: 409 };
    }
  }

  return { motivo: "No pudimos completar la operación. Inténtalo de nuevo.", estado: 500, reintentable: true };
}
