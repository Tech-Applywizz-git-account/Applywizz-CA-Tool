"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HRDashboard } from "../components/hr-dashboard"

export default function HRDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser")
    if (!storedUser) {
      router.push("/login")
    } else {
      const parsed = JSON.parse(storedUser)
      const role = parsed.designation || parsed.role
      if (role !== "HR" && role !== "Admin" && role !== "SYSTEM") {
        router.push("/login")
      } else {
        setUser(parsed)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (!user) return null

  return <HRDashboard user={user} onLogout={handleLogout} />
}
