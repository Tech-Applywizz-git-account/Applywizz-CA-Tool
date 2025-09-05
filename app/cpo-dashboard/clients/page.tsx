

// app/cpo-dashboard/clients/page.tsx
import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = {
  teamId?: string
  active?: "all" | "active" | "inactive"
  status?: "all" | "Not Started" | "Started" | "Paused" | "Completed"
}

export default function CPOClientsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  const initialActive =
    (typeof searchParams.active === "string"
      ? searchParams.active
      : "all") as "all" | "active" | "inactive"

  const initialStatus =
    (typeof searchParams.status === "string"
      ? searchParams.status
      : "all") as "all" | "Not Started" | "Started" | "Paused" | "Completed"

  return (
    <RoleShell basePath="/cpo-dashboard">
      <ClientsList
        title="Clients Information — CPO"
        teamId={teamId}
        initialActive={initialActive}
        initialStatus={initialStatus}
        pageSize={20}
      />
    </RoleShell>
  )
}

