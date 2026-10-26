/**
 * Teléfonos en formato internacional.
 *
 * Se guarda siempre en E.164 (+51999888777): sin espacios, sin guiones y con
 * código de país. Es el único formato que un bot de Discord, un SMS o una
 * hoja de cálculo pueden leer sin adivinar de dónde es el número.
 *
 * Qué se acepta al escribir: espacios, guiones, paréntesis, el prefijo 00 o
 * el + delante. Lo que no se acepta es un número sin país cuando no hay uno
 * por defecto, porque «999888777» no significa nada fuera del Perú.
 *
 * No usamos libphonenumber: pesa ~150 KB en el cliente y aquí solo hacen
 * falta los países desde los que alguien se va a inscribir a un hackathon
 * peruano. Los que no están en la tabla igual pasan, con una regla genérica.
 */

export type Pais = {
  iso: string;
  nombre: string;
  codigo: string;      // sin el +
  bandera: string;
  /** Largo del número nacional, sin el código de país. */
  largos: number[];
  /** Si el país tiene una marca clara de móvil, se exige. */
  movil?: RegExp;
  ejemplo: string;
};

/** Perú primero: es de donde va a venir casi todo el mundo. */
export const PAISES: Pais[] = [
  { iso: "PE", nombre: "Perú",        codigo: "51",  bandera: "🇵🇪", largos: [9],    movil: /^9/,  ejemplo: "999 888 777" },
  { iso: "AR", nombre: "Argentina",   codigo: "54",  bandera: "🇦🇷", largos: [10, 11],             ejemplo: "9 11 1234 5678" },
  { iso: "BO", nombre: "Bolivia",     codigo: "591", bandera: "🇧🇴", largos: [8],    movil: /^[67]/, ejemplo: "712 34567" },
  { iso: "BR", nombre: "Brasil",      codigo: "55",  bandera: "🇧🇷", largos: [10, 11],             ejemplo: "11 91234 5678" },
  { iso: "CL", nombre: "Chile",       codigo: "56",  bandera: "🇨🇱", largos: [9],    movil: /^9/,  ejemplo: "9 1234 5678" },
  { iso: "CO", nombre: "Colombia",    codigo: "57",  bandera: "🇨🇴", largos: [10],   movil: /^3/,  ejemplo: "321 234 5678" },
  { iso: "EC", nombre: "Ecuador",     codigo: "593", bandera: "🇪🇨", largos: [9],    movil: /^9/,  ejemplo: "99 123 4567" },
  { iso: "MX", nombre: "México",      codigo: "52",  bandera: "🇲🇽", largos: [10],                 ejemplo: "55 1234 5678" },
  { iso: "PY", nombre: "Paraguay",    codigo: "595", bandera: "🇵🇾", largos: [9],    movil: /^9/,  ejemplo: "991 234567" },
  { iso: "UY", nombre: "Uruguay",     codigo: "598", bandera: "🇺🇾", largos: [8],    movil: /^9/,  ejemplo: "91 234 567" },
  { iso: "VE", nombre: "Venezuela",   codigo: "58",  bandera: "🇻🇪", largos: [10],   movil: /^4/,  ejemplo: "412 123 4567" },
  { iso: "ES", nombre: "España",      codigo: "34",  bandera: "🇪🇸", largos: [9],    movil: /^[67]/, ejemplo: "612 34 56 78" },
  { iso: "US", nombre: "EE. UU.",     codigo: "1",   bandera: "🇺🇸", largos: [10],                 ejemplo: "555 123 4567" },
];

export const PAIS_POR_DEFECTO = "PE";

const porIso = new Map(PAISES.map((p) => [p.iso, p]));

export const paisPorIso = (iso: string | null | undefined) =>
  iso ? porIso.get(iso.toUpperCase()) ?? null : null;

/**
 * El país que corresponde a un número que ya trae código.
 *
 * Se prueba del código más largo al más corto: +1 es prefijo de +51, así que
 * buscar por el más corto primero mandaría todos los peruanos a EE. UU.
 */
export function paisPorCodigo(digitos: string): Pais | null {
  const candidatos = [...PAISES].sort((a, b) => b.codigo.length - a.codigo.length);
  return candidatos.find((p) => digitos.startsWith(p.codigo)) ?? null;
}

export type Telefono =
  | { ok: true; e164: string; pais: Pais | null; codigoPais: string; nacional: string; bonito: string }
  | { ok: false; motivo: string };

/** Deja solo dígitos y recuerda si venía con + o con 00 delante. */
function limpiar(valor: string) {
  const texto = valor.trim();
  const internacional = texto.startsWith("+") || /^00\d/.test(texto);
  const digitos = texto.replace(/\D/g, "").replace(/^00/, "");
  return { digitos, internacional };
}

/** Agrupa el número nacional para que se lea: 999 888 777. */
function agrupar(nacional: string) {
  if (nacional.length === 9) return nacional.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  if (nacional.length === 10) return nacional.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  if (nacional.length === 8) return nacional.replace(/(\d{4})(\d{4})/, "$1 $2");
  return nacional.replace(/(\d{2,3})(?=\d)/g, "$1 ").trim();
}

/**
 * Valida y normaliza. `iso` es el país elegido en el selector; si el número
 * ya viene con + y otro código, manda el código escrito.
 */
export function normalizarTelefono(valor: unknown, iso: string = PAIS_POR_DEFECTO): Telefono {
  const texto = String(valor ?? "");
  if (!texto.trim()) return { ok: false, motivo: "Escribe tu número de celular." };

  const { digitos, internacional } = limpiar(texto);
  if (!digitos) return { ok: false, motivo: "El número solo lleva dígitos." };
  if (digitos.length > 15) return { ok: false, motivo: "Ese número tiene demasiados dígitos." };

  const elegido = paisPorIso(iso);

  // Si lo escribió en internacional, el código que puso manda sobre el selector.
  let pais = elegido;
  let nacional = digitos;

  if (internacional) {
    pais = paisPorCodigo(digitos);
    if (!pais) {
      // País que no está en la tabla: no lo rechazamos, solo lo comprobamos a lo básico.
      if (digitos.length < 8) return { ok: false, motivo: "Ese número parece incompleto." };
      // Sin saber cuánto mide su código de país, agrupar sería inventar: se
      // muestra tal cual lo escribió.
      return {
        ok: true, e164: "+" + digitos, pais: null,
        codigoPais: "", nacional: digitos, bonito: "+" + digitos,
      };
    }
    nacional = digitos.slice(pais.codigo.length);
  } else if (elegido) {
    // Dentro del país se marca un 0 de troncal que no va en el E.164.
    let n = digitos.replace(/^0+/, "");
    // «51999888777»: trae el código delante aunque no escribió el +. Solo se
    // recorta si al quitarlo el largo cuadra, para no mutilar un número real.
    if (
      n.startsWith(elegido.codigo) &&
      !elegido.largos.includes(n.length) &&
      elegido.largos.includes(n.length - elegido.codigo.length)
    ) {
      n = n.slice(elegido.codigo.length);
    }
    nacional = n;
  }

  if (!pais) return { ok: false, motivo: "Elige el país de tu número." };

  if (!pais.largos.includes(nacional.length)) {
    const esperado = pais.largos.join(" o ");
    return {
      ok: false,
      motivo: `Un número de ${pais.nombre} tiene ${esperado} dígitos; escribiste ${nacional.length}.`,
    };
  }

  if (pais.movil && !pais.movil.test(nacional)) {
    return {
      ok: false,
      motivo: `Ese no parece un celular de ${pais.nombre}. Ejemplo: ${pais.ejemplo}.`,
    };
  }

  return {
    ok: true,
    e164: `+${pais.codigo}${nacional}`,
    pais,
    codigoPais: pais.codigo,
    nacional,
    bonito: `+${pais.codigo} ${agrupar(nacional)}`,
  };
}

/** Para mostrar un número ya guardado sin volver a validarlo. */
export function formatearE164(e164: string | null | undefined) {
  if (!e164) return "";
  const digitos = e164.replace(/\D/g, "");
  const pais = paisPorCodigo(digitos);
  if (!pais) return "+" + digitos;
  return `+${pais.codigo} ${agrupar(digitos.slice(pais.codigo.length))}`;
}
