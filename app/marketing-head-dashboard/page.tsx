"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MarketingHeadDashboard } from "../components/marketing-head-dashboard"

export default function MarketingHeadDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser")
    if (!storedUser) {
      router.push("/login")
    } else {
      setUser(JSON.parse(storedUser))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (!user) return null

  return <MarketingHeadDashboard user={user} onLogout={handleLogout} />
}
