// app/team-lead-dashboard/reports/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RoleShell from "../../components/RoleShell"
import { ReportPage } from "../../components/reports/ReportPage"

const ALLOWED_ROLES = ["Team Lead"]

export default function TeamLeadReportsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    const stored = localStorage.getItem("loggedInUser")
    if (!stored) { router.push("/login"); return }
    const user = JSON.parse(stored)
    if (!ALLOWED_ROLES.includes(user.role)) { router.push("/team-lead-dashboard"); return }
    setUserEmail(user.email)
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <RoleShell basePath="/team-lead-dashboard">
      <ReportPage teamLeadEmail={userEmail} />
    </RoleShell>
  )
}
