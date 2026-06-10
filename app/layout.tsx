import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ApplyWizz CA Assignment Dashboard",
  description: "Career Associate auto-assignment, capacity management, and analytics",
  icons: {
    icon: "/apply_wizz_logo.jpg",
  },
  generator: "Applywizz",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="ca-dashboard-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
