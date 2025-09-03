//app/cro-dashboard/clients/completed/page.tsx

// "use client"
// import ClientsList from "@/app/components/ClientsList"
// import Sidebar from "@/app/components/Sidebar"

// export default function CROCompletedClientsPage() {
//   return (
//     <div className="min-h-screen flex">
//       <Sidebar basePath="/cro-dashboard" />
//       <main className="flex-1 bg-slate-50 p-4">
//         <ClientsList title="Clients Information — CRO" initialStatus="Completed" />
//       </main>
//     </div>
//   )
// }

// app/cro-dashboard/clients/completed/page.tsx
import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

type SearchParams = { teamId?: string }

export default function CROCompletedClientsPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const teamId =
    typeof searchParams.teamId === "string" ? searchParams.teamId : null

  return (
    <RoleShell basePath="/cro-dashboard">
      <ClientsList
        title="Clients Information — CRO"
        teamId={teamId}
        initialStatus="Completed"
        pageSize={20}
      />
    </RoleShell>
  )
}
