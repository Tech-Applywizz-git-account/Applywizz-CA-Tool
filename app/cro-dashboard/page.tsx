"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CRODashboard } from "../components/cro-dashboard"

export default function CRODashboardPage() {
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

  if (!user) return null

  return <CRODashboard user={user} onLogout={handleLogout} />
}
