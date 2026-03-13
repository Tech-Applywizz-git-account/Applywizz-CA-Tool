// "use client"

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { TeamLeadDashboard } from "../components/team-lead-dashboard"

// export default function TeamLeadDashboardPage() {
//   const router = useRouter()
//   const [user, setUser] = useState<any>(null)

//   useEffect(() => {
//     const storedUser = localStorage.getItem("loggedInUser")
//     if (!storedUser) {
//       router.push("/login")
//     } else {
//       setUser(JSON.parse(storedUser))
//     }
//   }, [])

//   const handleLogout = () => {
//     localStorage.removeItem("loggedInUser")
//     router.push("/login")
//   }

//   if (!user) return null

//   return <TeamLeadDashboard user={user} onLogout={handleLogout} />
// }

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/app/components/Sidebar"
import { TeamLeadDashboard } from "../components/team-lead-dashboard"

export default function TeamLeadDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser")
    if (!storedUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex">
      <Sidebar basePath="/team-lead-dashboard" />
      <main className="flex-1 p-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <TeamLeadDashboard user={user} onLogout={handleLogout} />
        </div>
      </main>
    </div>
  )
}
