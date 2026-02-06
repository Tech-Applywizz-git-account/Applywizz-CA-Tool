"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("loggedInUser")
    if (savedUser) {
      // If session exists, let the login page handle the redirectByRole 
      // or we can duplicate the map here.
      // Easiest is to go to /login which is now fast with the loading spinner.
      router.push("/login")
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>
  )
}
