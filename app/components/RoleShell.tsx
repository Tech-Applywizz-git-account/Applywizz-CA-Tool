//app/components/RoleShell.tsx

"use client"

import Sidebar from "./Sidebar"

type RoleShellProps = {
  basePath: "/cro-dashboard" | "/ceo-dashboard" | "/coo-dashboard" | "/cpo-dashboard" | "/team-lead-dashboard"
  children: React.ReactNode
}

export default function RoleShell({ basePath, children }: RoleShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar basePath={basePath} />
      <main className="flex-1 p-4 overflow-x-hidden">{children}</main>
    </div>
  )
}
