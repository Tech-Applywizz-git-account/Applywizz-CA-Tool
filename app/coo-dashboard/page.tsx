//app/coo-dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { COODashboard } from "../components/coo-dashboard"
import RoleShell from "../components/RoleShell"
import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function COODashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthCheck(["COO", "Admin", "SYSTEM"])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (loading || !user) return null

  return (
    <RoleShell basePath="/coo-dashboard">
      <COODashboard user={user} onLogout={handleLogout} />
    </RoleShell>
  )
}
