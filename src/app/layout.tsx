import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CIS[HACK] UNI 2026 · The Agentic Era",
  description:
    "Hackathon universitaria de 100 horas: resuelve un reto real de empresa con un agente de IA como 5to miembro de tu equipo. UNI, PUCP y Universidad del Pacífico.",
};

export const viewport: Viewport = {
  themeColor: "#05000d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
