"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CROSalesDashboard } from "@/app/components/cro-sales-dashboard"
import RoleShell from "@/app/components/RoleShell"

export default function CROSalesPage() {
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

  return (
    <RoleShell basePath="/cro-dashboard">
      <CROSalesDashboard basePath="/cro-dashboard" user={user} onLogout={handleLogout} />
    </RoleShell>
  )
}
