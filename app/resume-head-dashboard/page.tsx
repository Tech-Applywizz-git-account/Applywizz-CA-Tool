"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ResumeHeadDashboard } from "../components/resume-head-dashboard"

export default function ResumeHeadDashboardPage() {
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

  return <ResumeHeadDashboard user={user} onLogout={handleLogout} />
}
