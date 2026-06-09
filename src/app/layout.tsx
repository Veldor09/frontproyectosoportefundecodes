import "./globals.css";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import ClientProviders from "./ClientProviders";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "FUNDECODES",
  description: "Plataforma administrativa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* suppressHydrationWarning por si extensiones del navegador inyectan atributos */}
      <body className={openSans.className} suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
