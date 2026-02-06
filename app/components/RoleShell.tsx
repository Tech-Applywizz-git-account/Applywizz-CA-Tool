"use client"

import Sidebar from "./Sidebar"
import { useAuthCheck } from "@/hooks/useAuthCheck"

type RoleShellProps = {
  basePath: "/cro-dashboard" | "/ceo-dashboard" | "/coo-dashboard" | "/cpo-dashboard" | "/team-lead-dashboard" | "/sales-dashboard"
  children: React.ReactNode
}

export default function RoleShell({ basePath, children }: RoleShellProps) {
  const { user, loading } = useAuthCheck()

  if (loading || !user) {
    return null // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div>
        <div className="flex">
          <Sidebar basePath={basePath} />
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </div>
  )
}
