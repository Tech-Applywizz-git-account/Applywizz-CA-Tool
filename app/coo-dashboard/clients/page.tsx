//app/coo-dashboard/clients/page.tsx

"use client"

import RoleShell from "../../components/RoleShell"
import ClientsList from "../../components/ClientsList"

export default function COOClientsPage() {
  return (
    <RoleShell basePath="/coo-dashboard">
      <ClientsList title="Clients Information — COO" />
    </RoleShell>
  )
}
