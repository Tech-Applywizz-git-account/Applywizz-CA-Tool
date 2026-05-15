// app/coo-dashboard/clients/active/page.tsx
import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = { teamId?: string }

export default function CROActiveClientsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  return (
    <RoleShell basePath="/coo-dashboard">
      <ClientsList clientLinkPrefix="/coo-dashboard/client/" 
        title="Clients Information — COO"
        teamId={teamId}
        initialActive="active"
        pageSize={20}
      />
    </RoleShell>
  )
}
