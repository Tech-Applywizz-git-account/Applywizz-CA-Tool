"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AccountsHeadDashboard } from "../components/accounts-head-dashboard"

export default function AccountsHeadDashboardPage() {
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

  return <AccountsHeadDashboard user={user} onLogout={handleLogout} />
}
