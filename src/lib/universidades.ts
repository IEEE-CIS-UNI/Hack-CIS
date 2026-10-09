/**
 * Registro de universidades peruanas.
 *
 * 80 dominios verificados por DNS (registros MX activos) el 2026-10-08 con
 * scripts/verificar-dominios.mjs. Agregar una universidad es agregar una
 * entrada aquí: no hay lógica que tocar.
 *
 * `formato` es OPCIONAL. Casi ninguna universidad publica el formato de sus
 * códigos y el sistema no lo necesita: solo afina el mensaje de error cuando
 * existe. Hoy solo la UNI lo tiene, confirmado con un código real.
 *
 * Cualquier dominio .edu.pe que no esté aquí se acepta igual y queda marcado
 * para que un admin lo catalogue. Nadie pierde su cupo por no estar en esta
 * lista.
 */

export type Prioridad = "anfitriona" | "general";

export type Universidad = {
  siglas: string;
  nombre: string;
  tipo: string;
  prioridad: Prioridad;
  dominios: string[];
  formato: RegExp | null;
};

/** Sufijos que en Perú solo usa una institución educativa. */
export const SUFIJOS_EDUCATIVOS = ["edu.pe"];

export const UNIVERSIDADES: Universidad[] = [
  { siglas: "UNMSM", nombre: "Universidad Nacional Mayor de San Marcos", tipo: "publica",
    prioridad: "general", dominios: ["unmsm.edu.pe"], formato: null },
  { siglas: "UNI", nombre: "Universidad Nacional de Ingeniería", tipo: "publica",
    prioridad: "anfitriona", dominios: ["uni.edu.pe", "uni.pe"], formato: /^\d{8}[A-Z]$/ },
  { siglas: "UNFV", nombre: "Universidad Nacional Federico Villarreal", tipo: "publica",
    prioridad: "general", dominios: ["unfv.edu.pe"], formato: null },
  { siglas: "UNAC", nombre: "Universidad Nacional del Callao", tipo: "publica",
    prioridad: "general", dominios: ["unac.edu.pe"], formato: null },
  { siglas: "UNALM", nombre: "Universidad Nacional Agraria La Molina", tipo: "publica",
    prioridad: "general", dominios: ["lamolina.edu.pe"], formato: null },
  { siglas: "UNE", nombre: "Universidad Nacional de Educación Enrique Guzmán y Valle", tipo: "publica",
    prioridad: "general", dominios: ["une.edu.pe"], formato: null },
  { siglas: "UNJFSC", nombre: "Universidad Nacional José Faustino Sánchez Carrión", tipo: "publica",
    prioridad: "general", dominios: ["unjfsc.edu.pe"], formato: null },
  { siglas: "UNTELS", nombre: "Universidad Nacional Tecnológica de Lima Sur", tipo: "publica",
    prioridad: "general", dominios: ["untels.edu.pe"], formato: null },
  { siglas: "PUCP", nombre: "Pontificia Universidad Católica del Perú", tipo: "privada",
    prioridad: "anfitriona", dominios: ["pucp.edu.pe", "pucp.pe"], formato: null },
  { siglas: "UP", nombre: "Universidad del Pacífico", tipo: "privada",
    prioridad: "anfitriona", dominios: ["up.edu.pe"], formato: null },
  { siglas: "ULIMA", nombre: "Universidad de Lima", tipo: "privada",
    prioridad: "general", dominios: ["ulima.edu.pe"], formato: null },
  { siglas: "ESAN", nombre: "Universidad ESAN", tipo: "privada",
    prioridad: "general", dominios: ["esan.edu.pe"], formato: null },
  { siglas: "USIL", nombre: "Universidad San Ignacio de Loyola", tipo: "privada",
    prioridad: "general", dominios: ["usil.edu.pe"], formato: null },
  { siglas: "UPC", nombre: "Universidad Peruana de Ciencias Aplicadas", tipo: "privada",
    prioridad: "general", dominios: ["upc.edu.pe"], formato: null },
  { siglas: "UTP", nombre: "Universidad Tecnológica del Perú", tipo: "privada",
    prioridad: "general", dominios: ["utp.edu.pe"], formato: null },
  { siglas: "UTEC", nombre: "Universidad de Ingeniería y Tecnología", tipo: "privada",
    prioridad: "general", dominios: ["utec.edu.pe"], formato: null },
  { siglas: "USMP", nombre: "Universidad de San Martín de Porres", tipo: "privada",
    prioridad: "general", dominios: ["usmp.edu.pe", "usmp.pe"], formato: null },
  { siglas: "URP", nombre: "Universidad Ricardo Palma", tipo: "privada",
    prioridad: "general", dominios: ["urp.edu.pe"], formato: null },
  { siglas: "UCSUR", nombre: "Universidad Científica del Sur", tipo: "privada",
    prioridad: "general", dominios: ["cientifica.edu.pe"], formato: null },
  { siglas: "UWIENER", nombre: "Universidad Privada Norbert Wiener", tipo: "privada",
    prioridad: "general", dominios: ["uwiener.edu.pe"], formato: null },
  { siglas: "UCV", nombre: "Universidad César Vallejo", tipo: "privada",
    prioridad: "general", dominios: ["ucv.edu.pe"], formato: null },
  { siglas: "UPN", nombre: "Universidad Privada del Norte", tipo: "privada",
    prioridad: "general", dominios: ["upn.edu.pe"], formato: null },
  { siglas: "UA", nombre: "Universidad Autónoma del Perú", tipo: "privada",
    prioridad: "general", dominios: ["autonoma.edu.pe"], formato: null },
  { siglas: "UCAL", nombre: "Universidad de Ciencias y Artes de América Latina", tipo: "privada",
    prioridad: "general", dominios: ["ucal.edu.pe"], formato: null },
  { siglas: "UPeU", nombre: "Universidad Peruana Unión", tipo: "privada",
    prioridad: "general", dominios: ["upeu.edu.pe"], formato: null },
  { siglas: "UARM", nombre: "Universidad Antonio Ruiz de Montoya", tipo: "privada",
    prioridad: "general", dominios: ["ual.edu.pe", "uarm.edu.pe"], formato: null },
  { siglas: "UCSS", nombre: "Universidad Católica Sedes Sapientiae", tipo: "privada",
    prioridad: "general", dominios: ["ucss.edu.pe"], formato: null },
  { siglas: "USP", nombre: "Universidad San Pedro", tipo: "privada",
    prioridad: "general", dominios: ["usanpedro.edu.pe", "usp.edu.pe"], formato: null },
  { siglas: "UCH", nombre: "Universidad de Ciencias y Humanidades", tipo: "privada",
    prioridad: "general", dominios: ["uch.edu.pe"], formato: null },
  { siglas: "UIGV", nombre: "Universidad Inca Garcilaso de la Vega", tipo: "privada",
    prioridad: "general", dominios: ["uigv.edu.pe"], formato: null },
  { siglas: "UNIFE", nombre: "Universidad Femenina del Sagrado Corazón", tipo: "privada",
    prioridad: "general", dominios: ["unife.edu.pe"], formato: null },
  { siglas: "UNSA", nombre: "Universidad Nacional de San Agustín de Arequipa", tipo: "publica",
    prioridad: "general", dominios: ["unsa.edu.pe"], formato: null },
  { siglas: "UNSAAC", nombre: "Universidad Nacional de San Antonio Abad del Cusco", tipo: "publica",
    prioridad: "general", dominios: ["unsaac.edu.pe"], formato: null },
  { siglas: "UNT", nombre: "Universidad Nacional de Trujillo", tipo: "publica",
    prioridad: "general", dominios: ["unitru.edu.pe"], formato: null },
  { siglas: "UNPRG", nombre: "Universidad Nacional Pedro Ruiz Gallo", tipo: "publica",
    prioridad: "general", dominios: ["unprg.edu.pe"], formato: null },
  { siglas: "UNP", nombre: "Universidad Nacional de Piura", tipo: "publica",
    prioridad: "general", dominios: ["unp.edu.pe"], formato: null },
  { siglas: "UNCP", nombre: "Universidad Nacional del Centro del Perú", tipo: "publica",
    prioridad: "general", dominios: ["uncp.edu.pe"], formato: null },
  { siglas: "UNSCH", nombre: "Universidad Nacional de San Cristóbal de Huamanga", tipo: "publica",
    prioridad: "general", dominios: ["unsch.edu.pe"], formato: null },
  { siglas: "UNAP", nombre: "Universidad Nacional del Altiplano", tipo: "publica",
    prioridad: "general", dominios: ["unap.edu.pe"], formato: null },
  { siglas: "UNAPI", nombre: "Universidad Nacional de la Amazonía Peruana", tipo: "publica",
    prioridad: "general", dominios: ["unapiquitos.edu.pe"], formato: null },
  { siglas: "UNAS", nombre: "Universidad Nacional Agraria de la Selva", tipo: "publica",
    prioridad: "general", dominios: ["unas.edu.pe"], formato: null },
  { siglas: "UNHEVAL", nombre: "Universidad Nacional Hermilio Valdizán", tipo: "publica",
    prioridad: "general", dominios: ["unheval.edu.pe"], formato: null },
  { siglas: "UNICA", nombre: "Universidad Nacional San Luis Gonzaga", tipo: "publica",
    prioridad: "general", dominios: ["unica.edu.pe"], formato: null },
  { siglas: "UNJBG", nombre: "Universidad Nacional Jorge Basadre Grohmann", tipo: "publica",
    prioridad: "general", dominios: ["unjbg.edu.pe"], formato: null },
  { siglas: "UNSM", nombre: "Universidad Nacional de San Martín", tipo: "publica",
    prioridad: "general", dominios: ["unsm.edu.pe"], formato: null },
  { siglas: "UNTRM", nombre: "Universidad Nacional Toribio Rodríguez de Mendoza", tipo: "publica",
    prioridad: "general", dominios: ["untrm.edu.pe"], formato: null },
  { siglas: "UNDAC", nombre: "Universidad Nacional Daniel Alcides Carrión", tipo: "publica",
    prioridad: "general", dominios: ["undac.edu.pe"], formato: null },
  { siglas: "UNH", nombre: "Universidad Nacional de Huancavelica", tipo: "publica",
    prioridad: "general", dominios: ["unh.edu.pe"], formato: null },
  { siglas: "UNU", nombre: "Universidad Nacional de Ucayali", tipo: "publica",
    prioridad: "general", dominios: ["unu.edu.pe"], formato: null },
  { siglas: "UNAMAD", nombre: "Universidad Nacional Amazónica de Madre de Dios", tipo: "publica",
    prioridad: "general", dominios: ["unamad.edu.pe"], formato: null },
  { siglas: "UNAMBA", nombre: "Universidad Nacional Micaela Bastidas de Apurímac", tipo: "publica",
    prioridad: "general", dominios: ["unamba.edu.pe"], formato: null },
  { siglas: "UNASAM", nombre: "Universidad Nacional Santiago Antúnez de Mayolo", tipo: "publica",
    prioridad: "general", dominios: ["unasam.edu.pe"], formato: null },
  { siglas: "UNF", nombre: "Universidad Nacional de Frontera", tipo: "publica",
    prioridad: "general", dominios: ["unf.edu.pe"], formato: null },
  { siglas: "UNIFSLB", nombre: "Universidad Nacional Intercultural Fabiola Salazar", tipo: "publica",
    prioridad: "general", dominios: ["unibagua.edu.pe"], formato: null },
  { siglas: "UCSM", nombre: "Universidad Católica de Santa María", tipo: "privada",
    prioridad: "general", dominios: ["ucsm.edu.pe"], formato: null },
  { siglas: "UCSP", nombre: "Universidad Católica San Pablo", tipo: "privada",
    prioridad: "general", dominios: ["ucsp.edu.pe"], formato: null },
  { siglas: "ULASALLE", nombre: "Universidad La Salle", tipo: "privada",
    prioridad: "general", dominios: ["ulasalle.edu.pe"], formato: null },
  { siglas: "UDEP", nombre: "Universidad de Piura", tipo: "privada",
    prioridad: "general", dominios: ["udep.edu.pe"], formato: null },
  { siglas: "USAT", nombre: "Universidad Católica Santo Toribio de Mogrovejo", tipo: "privada",
    prioridad: "general", dominios: ["usat.edu.pe"], formato: null },
  { siglas: "USS", nombre: "Universidad Señor de Sipán", tipo: "privada",
    prioridad: "general", dominios: ["uss.edu.pe"], formato: null },
  { siglas: "UPAO", nombre: "Universidad Privada Antenor Orrego", tipo: "privada",
    prioridad: "general", dominios: ["upao.edu.pe"], formato: null },
  { siglas: "UC", nombre: "Universidad Continental", tipo: "privada",
    prioridad: "general", dominios: ["continental.edu.pe"], formato: null },
  { siglas: "UAC", nombre: "Universidad Andina del Cusco", tipo: "privada",
    prioridad: "general", dominios: ["uandina.edu.pe"], formato: null },
  { siglas: "UANCV", nombre: "Universidad Andina Néstor Cáceres Velásquez", tipo: "privada",
    prioridad: "general", dominios: ["uancv.edu.pe"], formato: null },
  { siglas: "UCP", nombre: "Universidad Científica del Perú", tipo: "privada",
    prioridad: "general", dominios: ["ucp.edu.pe"], formato: null },
  { siglas: "UDH", nombre: "Universidad de Huánuco", tipo: "privada",
    prioridad: "general", dominios: ["udh.edu.pe"], formato: null },
  { siglas: "UPSJB", nombre: "Universidad Privada San Juan Bautista", tipo: "privada",
    prioridad: "general", dominios: ["upsjb.edu.pe"], formato: null },
  { siglas: "UAP", nombre: "Universidad Alas Peruanas", tipo: "privada",
    prioridad: "general", dominios: ["uap.edu.pe"], formato: null },
  { siglas: "UTEA", nombre: "Universidad Tecnológica de los Andes", tipo: "privada",
    prioridad: "general", dominios: ["utea.edu.pe"], formato: null },
  { siglas: "UPLA", nombre: "Universidad Peruana Los Andes", tipo: "privada",
    prioridad: "general", dominios: ["upla.edu.pe"], formato: null },
  { siglas: "TECSUP", nombre: "Tecsup", tipo: "instituto",
    prioridad: "general", dominios: ["tecsup.edu.pe"], formato: null },
  { siglas: "SENATI", nombre: "SENATI", tipo: "instituto",
    prioridad: "general", dominios: ["senati.edu.pe"], formato: null },
  { siglas: "CERTUS", nombre: "Instituto Certus", tipo: "instituto",
    prioridad: "general", dominios: ["certus.edu.pe"], formato: null },
  { siglas: "CIBERTEC", nombre: "Instituto Cibertec", tipo: "instituto",
    prioridad: "general", dominios: ["cibertec.edu.pe"], formato: null },
  { siglas: "IDAT", nombre: "Instituto IDAT", tipo: "instituto",
    prioridad: "general", dominios: ["idat.edu.pe"], formato: null },
];

const POR_DOMINIO = new Map<string, Universidad>();
for (const u of UNIVERSIDADES) for (const d of u.dominios) POR_DOMINIO.set(d, u);

const POR_SIGLA = new Map(UNIVERSIDADES.map((u) => [u.siglas, u]));

export const porSiglas = (s: string | null | undefined) => (s ? POR_SIGLA.get(s) ?? null : null);

/** Busca por dominio exacto y, si no, por subdominio (alum.up.edu.pe -> UP). */
export function porDominio(dominio: string): Universidad | null {
  const d = dominio.toLowerCase();
  const exacta = POR_DOMINIO.get(d);
  if (exacta) return exacta;
  for (const [reg, u] of POR_DOMINIO) if (d.endsWith("." + reg)) return u;
  return null;
}

export const esDominioEducativo = (dominio: string) =>
  SUFIJOS_EDUCATIVOS.some((s) => dominio === s || dominio.endsWith("." + s));

export const totalUniversidades = POR_SIGLA.size;
export const totalDominios = POR_DOMINIO.size;
