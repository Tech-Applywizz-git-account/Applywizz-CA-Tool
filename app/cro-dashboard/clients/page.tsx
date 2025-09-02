//app/cro-dashboard/clients/page.tsx

"use client"

import RoleShell from "../../components/RoleShell"
import ClientsList from "../../components/ClientsList"

export default function CROClientsPage() {
  return (
    <RoleShell basePath="/cro-dashboard">
      <ClientsList title="Clients Information — CRO" />
    </RoleShell>
  )
}
