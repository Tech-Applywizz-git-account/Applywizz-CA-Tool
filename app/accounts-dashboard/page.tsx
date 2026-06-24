"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AccountsDashboard } from "../components/accounts-dashboard"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewAs = searchParams.get("viewAs")
  const viewName = searchParams.get("viewName")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser")
    if (!storedUser) {
      router.push("/login")
    } else {
      const parsedUser = JSON.parse(storedUser)
      if (viewAs) {
        // Construct a viewing user object with the target email and name
        setUser({
          ...parsedUser,
          email: viewAs,
          name: viewName || viewAs.split('@')[0].replace('.', ' '),
          isViewingAs: true
        })
      } else {
        setUser(parsedUser)
      }
    }
  }, [viewAs, viewName, router])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (!user) return null

  return <AccountsDashboard user={user} onLogout={handleLogout} isViewOnly={!!viewAs} />
}

export default function AccountsDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
