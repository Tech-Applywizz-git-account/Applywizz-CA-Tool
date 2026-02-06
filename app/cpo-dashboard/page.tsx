//app/cpo-dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CPODashboard } from "../components/cpo-dashboard"
import RoleShell from "../components/RoleShell"
import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function CPODashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthCheck(["CPO", "Admin", "SYSTEM"])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (loading || !user) return null

  return (
    <RoleShell basePath="/cpo-dashboard">
      <CPODashboard user={user} onLogout={handleLogout} />
    </RoleShell>
  )
}
