import type { Metadata, Viewport } from "next";
import { Antonio, Inter, Michroma, Rubik_Mono_One } from "next/font/google";
import "./globals.css";

const antonio = Antonio({ variable: "--font-antonio", subsets: ["latin"], weight: ["400", "700"] });
const rubik = Rubik_Mono_One({ variable: "--font-rubik", subsets: ["latin"], weight: "400" });
const michroma = Michroma({ variable: "--font-michroma", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CIS[HACK] UNI 2026 · The Agentic Era",
  description:
    "Hackathon universitaria de 100 horas: resuelve un reto real de empresa con un agente de IA como 5to miembro de tu equipo. UNI, PUCP y Universidad del Pacífico.",
};

export const viewport: Viewport = {
  themeColor: "#08030f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${antonio.variable} ${rubik.variable} ${michroma.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
