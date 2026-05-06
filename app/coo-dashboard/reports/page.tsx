// app/coo-dashboard/reports/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RoleShell from "../../components/RoleShell"
import { ReportPage } from "../../components/reports/ReportPage"

const ALLOWED_ROLES = ["CRO", "COO", "CEO"]

export default function COOReportsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("loggedInUser")
    if (!stored) { router.push("/login"); return }
    const user = JSON.parse(stored)
    if (!ALLOWED_ROLES.includes(user.role)) { router.push("/coo-dashboard"); return }
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <RoleShell basePath="/coo-dashboard">
      <ReportPage />
    </RoleShell>
  )
}
