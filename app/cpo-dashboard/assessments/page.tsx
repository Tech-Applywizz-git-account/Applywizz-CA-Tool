// app/cpo-dashboard/assessments/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RoleShell from "../../components/RoleShell"
import { AssessmentAnalyticsPage } from "../../components/assessment-analytics-page"

export default function CPOAssessmentsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("loggedInUser")
    if (!stored) {
      router.push("/login")
      return
    }
    const user = JSON.parse(stored)
    if (user.role !== "CPO") {
      router.push("/cpo-dashboard")
      return
    }
    setReady(true)
  }, [router])

  if (!ready) return null

  return (
    <RoleShell basePath="/cpo-dashboard">
      <AssessmentAnalyticsPage scope="executive" />
    </RoleShell>
  )
}
