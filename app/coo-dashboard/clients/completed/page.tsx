//app/coo-dashboard/clients/completed/page.tsx

// "use client"
// import ClientsList from "@/app/components/ClientsList"
// import Sidebar from "@/app/components/Sidebar"

// export default function COOCompletedClientsPage() {
//   return (
//     <div className="min-h-screen flex">
//       <Sidebar basePath="/coo-dashboard" />
//       <main className="flex-1 bg-slate-50 p-4">
//         <ClientsList title="Clients Information — COO" initialStatus="Completed" />
//       </main>
//     </div>
//   )
// }

// app/coo-dashboard/clients/completed/page.tsx
import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = { teamId?: string }

export default function COOCompletedClientsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  return (
    <RoleShell basePath="/coo-dashboard">
      <ClientsList
        title="Clients Information — COO"
        teamId={teamId}
        initialStatus="Completed"
        pageSize={20}
      />
    </RoleShell>
  )
}
