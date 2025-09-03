// //app/ceo-dashboard/clients/page.tsx

"use client"

import RoleShell from "@/app/components/RoleShell" // if you already use this wrapper; otherwise remove
import ClientsList from "@/app/components/ClientsList"

export default function CROClientsPage() {
  return (
    <RoleShell basePath="/ceo-dashboard">
      <div className="p-4">
        <ClientsList title="All Clients" />
      </div>
    </RoleShell>
  )
}
