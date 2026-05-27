"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CROAccountsDashboard } from "@/app/components/cro-accounts-dashboard"
import RoleShell from "@/app/components/RoleShell"

export default function CROAccountsPage() {
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
    <RoleShell basePath="/cro-dashboard">
      <CROAccountsDashboard user={user} onLogout={handleLogout} />
    </RoleShell>
  )
}
