import type { Metadata, Viewport } from "next";
import { Antonio, Inter, Michroma, Rubik_Mono_One, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Metricas from "@/components/Metricas";
import { DESCRIPCION, NOMBRE, TITULO } from "@/lib/seo";
import "./globals.css";

const antonio = Antonio({ variable: "--font-antonio", subsets: ["latin"], weight: ["400", "700"] });
const rubik = Rubik_Mono_One({ variable: "--font-rubik", subsets: ["latin"], weight: "400" });
const michroma = Michroma({ variable: "--font-michroma", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["300", "400"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: TITULO,
  description: DESCRIPCION,
  applicationName: NOMBRE,
  alternates: { canonical: "./" },
  openGraph: { siteName: NOMBRE, locale: "es_PE", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#08030f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${antonio.variable} ${rubik.variable} ${michroma.variable} ${inter.variable} ${sora.variable}`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Metricas />
      </body>
    </html>
  );
}
