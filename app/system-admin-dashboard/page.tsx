"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SystemAdminDashboard } from "../components/system-admin-dashboard"
import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function SystemAdminDashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthCheck(["Admin", "SYSTEM"])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (loading || !user) return null

  return <SystemAdminDashboard user={user} onLogout={handleLogout} />
}
