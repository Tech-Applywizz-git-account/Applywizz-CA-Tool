import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ApplyWizz CA Performance Tracker",
  description: "Track performance and incentives for Career Associates",
  icons: {
    icon: "/apply_wizz_logo.jpg", // Path from public folder
  },
    generator: 'Applywizz'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
