//app/coo-dashboard/clients/inprogress/page.tsx

// "use client"
// import ClientsList from "@/app/components/ClientsList"
// import Sidebar from "@/app/components/Sidebar"

// export default function COOInProgressClientsPage() {
//   return (
//     <div className="min-h-screen flex">
//       <Sidebar basePath="/coo-dashboard" />
//       <main className="flex-1 bg-slate-50 p-4">
//         <ClientsList title="Clients Information — COO" initialStatus="Started" />
//       </main>
//     </div>
//   )
// }

// app/cro-dashboard/clients/inprogress/page.tsx
import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = { teamId?: string }

export default function COOInProgressClientsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  return (
    <RoleShell basePath="/coo-dashboard">
      <ClientsList
        title="Clients Information — COO"
        teamId={teamId}
        initialStatus="Started"
        pageSize={20}
      />
    </RoleShell>
  )
}


