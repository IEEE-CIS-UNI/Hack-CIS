import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/seo";

/**
 * Todo lo público se puede rastrear, también por asistentes de IA. Las páginas privadas (/card, /mi-inscripcion…) no se
 * bloquean aquí a propósito: llevan «noindex», y para leerlo el buscador tiene que poder entrar.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${SITIO}/sitemap.xml`, host: SITIO };
}
