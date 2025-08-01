// "use client"
// import { useState } from "react"
// import LoginPage from "./components/login-page"
// import { COODashboard } from "./components/coo-dashboard"
// import { CRODashboard } from "./components/cro-dashboard"
// import { CEODashboard } from "./components/ceo-dashboard"
// import { TeamLeadDashboard } from "./components/team-lead-dashboard"
// import { CADashboard } from "./components/ca-dashboard"
// import { SystemAdminDashboard } from "./components/system-admin-dashboard"

// export default function ApplyWizzTracker() {
//   const [currentUser, setCurrentUser] = useState<any>(null)

//   const handleLogin = (user: any) => {
//     setCurrentUser(user)
//   }

//   const handleLogout = () => {
//     setCurrentUser(null)
//   }

//   if (!currentUser) {
//     return <LoginPage onLogin={handleLogin} />
//   }

//   // Render appropriate dashboard based on user role
//   switch (currentUser.role) {
//     case "COO":
//       return <COODashboard user={currentUser} onLogout={handleLogout} />
//     case "CRO":
//       return <CRODashboard user={currentUser} onLogout={handleLogout} />
//     case "CEO":
//       return <CEODashboard user={currentUser} onLogout={handleLogout} />
//     case "TL":
//       return <TeamLeadDashboard user={currentUser} onLogout={handleLogout} />
//     case "CA":
//       return <CADashboard user={currentUser} onLogout={handleLogout} />
//     case "SYSTEM":
//       return <SystemAdminDashboard user={currentUser} onLogout={handleLogout} />
//     default:
//       return <LoginPage onLogin={handleLogin} />
//   }
// }


"use client"
import { useState, useEffect } from "react"
import LoginPage from "./components/login-page"
import { COODashboard } from "./components/coo-dashboard"
import { CRODashboard } from "./components/cro-dashboard"
import { CEODashboard } from "./components/ceo-dashboard"
import { TeamLeadDashboard } from "./components/team-lead-dashboard"
import { CADashboard } from "./components/ca-dashboard"
import { SystemAdminDashboard } from "./components/system-admin-dashboard"

export default function ApplyWizzTracker() {
  const [currentUser, setCurrentUser] = useState<any>(null)

  // ---------------- SESSION PERSISTENCE ----------------
  useEffect(() => {
    const savedUser = localStorage.getItem("loggedInUser")
    if (savedUser) setCurrentUser(JSON.parse(savedUser))
  }, [])

  const handleLogin = (user: any) => {
    setCurrentUser(user)
    localStorage.setItem("loggedInUser", JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem("loggedInUser")
  }
  // ------------------------------------------------------

  // ---------------- LOGIN CHECK ----------------
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }
  // ---------------------------------------------

  // ---------------- DASHBOARD SWITCH ----------------
  switch (currentUser.role) {
    case "COO":
      return <COODashboard user={currentUser} onLogout={handleLogout} />
    case "CRO":
      return <CRODashboard user={currentUser} onLogout={handleLogout} />
    case "CEO":
      return <CEODashboard user={currentUser} onLogout={handleLogout} />
    case "Team Lead":
    case "TL": // handle both role values
      return <TeamLeadDashboard user={currentUser} onLogout={handleLogout} />
    case "CA":
      return <CADashboard user={currentUser} onLogout={handleLogout} />
    case "Junior CA":
      return <CADashboard user={currentUser} onLogout={handleLogout} />
    case "Admin":
    case "SYSTEM":
      return <SystemAdminDashboard user={currentUser} onLogout={handleLogout} />
    default:
      return <LoginPage onLogin={handleLogin} />
  }
}
