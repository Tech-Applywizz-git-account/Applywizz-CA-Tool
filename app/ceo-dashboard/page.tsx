//app/ceo-dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CEODashboard } from "../components/ceo-dashboard"
import RoleShell from "../components/RoleShell"
import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function CEODashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthCheck(["CEO", "Admin", "SYSTEM"])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (loading || !user) return null

  return (
    <RoleShell basePath="/ceo-dashboard">
      <CEODashboard user={user} onLogout={handleLogout} />
    </RoleShell>
  )
}
