"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CEODashboard } from "../components/ceo-dashboard"
import RoleShell from "../components/RoleShell"

export default function CEODashboardPage() {
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

  return (
    <RoleShell basePath="/ceo-dashboard">
      <CEODashboard user={user} onLogout={handleLogout} />
    </RoleShell>
  )
}
