//app/coo-dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { COODashboard } from "../components/coo-dashboard"
import RoleShell from "../components/RoleShell"

export default function COODashboardPage() {
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
  <RoleShell basePath="/coo-dashboard">
    <COODashboard user={user} onLogout={handleLogout} />
  </RoleShell>
)
}
