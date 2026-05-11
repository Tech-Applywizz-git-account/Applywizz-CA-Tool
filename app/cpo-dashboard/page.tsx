//app/cpo-dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CPODashboard } from "../components/cpo-dashboard"
import RoleShell from "../components/RoleShell"

export default function CPODashboardPage() {
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
  <RoleShell basePath="/cpo-dashboard">
    <CPODashboard user={user} onLogout={handleLogout} />
  </RoleShell>
)
}
