import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flowix — Automatización, asistentes y chat con IA",
  description:
    "Crea workflows de automatización, asistentes y chatbots, y chatea con los modelos más avanzados desde una sola plataforma.",
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem("flowix-theme");var dark=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
        <ThemeProvider>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
