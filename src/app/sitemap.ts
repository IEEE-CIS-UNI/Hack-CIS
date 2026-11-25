import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/seo";
import { DATOS_SESION } from "@/lib/sesiones";

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas: [string, number][] = [
    ["/", 1], ["/bases", 0.8], ["/tracks", 0.8], ["/tracks/energia", 0.7], ["/tracks/cloud", 0.7], ["/tracks/fintech", 0.7],
    ["/bootcamp", 0.8], ...Object.keys(DATOS_SESION).sort().map((n): [string, number] => [`/bootcamp/${n}`, 0.5]), ["/sponsors", 0.6], ["/registro", 0.6],
  ];
  const hoy = new Date();
  return rutas.map(([ruta, prioridad]) => ({ url: `${SITIO}${ruta === "/" ? "/" : ruta}`, lastModified: hoy, priority: prioridad }));
}
