"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CADashboard } from "../components/ca-dashboard"

export default function CADashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser")
    if (!storedUser) {
      router.push("/login")
    } else {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (!user) return null // or show loading

  return <CADashboard user={user} onLogout={handleLogout} />
}
