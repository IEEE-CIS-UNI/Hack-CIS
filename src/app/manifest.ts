import type { MetadataRoute } from "next";
import { DESCRIPCION, NOMBRE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOMBRE, short_name: "HACK[CIS]", description: DESCRIPCION, lang: "es-PE", start_url: "/", display: "browser",
    background_color: "#08030f", theme_color: "#08030f",
    icons: [{ src: "/icon1.png", sizes: "192x192", type: "image/png" }, { src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
