"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CADashboard } from "../components/ca-dashboard"
import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function CADashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthCheck(["CA", "Junior CA", "Admin", "SYSTEM"])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (loading || !user) return null // or show loading

  return <CADashboard user={user} onLogout={handleLogout} />
}
