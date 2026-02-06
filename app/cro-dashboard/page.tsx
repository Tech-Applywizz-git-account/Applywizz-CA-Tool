//app/cro-dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CRODashboard } from "../components/cro-dashboard"
import RoleShell from "../components/RoleShell"
import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function CRODashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthCheck(["CRO", "Admin", "SYSTEM"])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (loading || !user) return null

  // return <CRODashboard user={user} onLogout={handleLogout} />
  return (
    <RoleShell basePath="/cro-dashboard">
      <CRODashboard user={user} onLogout={handleLogout} />
    </RoleShell>
  )
}
