import type React from "react"
import type { Metadata } from "next"
import { Gemunu_Libre, Quicksand } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const gemunuLibre = Gemunu_Libre({
  weight: "400",
  subsets: ["latin"],
})

const quicksand = Quicksand({
  weight: "600",
  subsets: ["latin"],
  variable: "--font-quicksand",
})

export const metadata: Metadata = {
  title: "Dragón de Madera - Club de Juegos de Mesa en Granada",
  description:
    "Tu club de juegos de mesa en Granada. Descubre, juega y conoce gente con tu misma afición. Más de 800 juegos, partidas semanales y un ambiente familiar.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${gemunuLibre.className} ${quicksand.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
