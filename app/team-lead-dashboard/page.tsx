"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamLeadDashboard } from "../components/team-lead-dashboard"

export default function TeamLeadDashboardPage() {
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

  return <TeamLeadDashboard user={user} onLogout={handleLogout} />
}
