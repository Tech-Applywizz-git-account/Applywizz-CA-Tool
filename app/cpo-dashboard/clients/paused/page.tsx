// app/cpo-dashboard/clients/paused/page.tsx
import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = { teamId?: string }

export default function CPOPausedClientsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  return (
    <RoleShell basePath="/cpo-dashboard">
      <ClientsList clientLinkPrefix="/cpo-dashboard/client/" 
        title="Clients Information — CPO"
        teamId={teamId}
        initialActive="inactive"
        pageSize={20}
      />
    </RoleShell>
  )
}
