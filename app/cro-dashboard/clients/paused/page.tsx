// app/cro-dashboard/clients/paused/page.tsx
import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = { teamId?: string }

export default function CROPausedClientsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  return (
    <RoleShell basePath="/cro-dashboard">
      <ClientsList
        title="Clients Information — CRO"
        teamId={teamId}
        initialActive="inactive"
        pageSize={20}
      />
    </RoleShell>
  )
}
