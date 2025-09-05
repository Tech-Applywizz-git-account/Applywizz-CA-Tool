// app/cpo-dashboard/clients/comleted/page.tsx

import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = { teamId?: string }

export default function CPOCompletedClientsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  return (
    <RoleShell basePath="/cpo-dashboard">
      <ClientsList
        title="Clients Information — CPO"
        teamId={teamId}
        initialStatus="Completed"
        pageSize={20}
      />
    </RoleShell>
  )
}