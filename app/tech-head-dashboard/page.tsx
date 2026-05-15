"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TechHeadDashboard } from "../components/tech-head-dashboard"

export default function TechHeadDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser")
    if (!storedUser) {
      router.push("/login")
    } else {
      setUser(JSON.parse(storedUser))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (!user) return null

  return <TechHeadDashboard user={user} onLogout={handleLogout} />
}
