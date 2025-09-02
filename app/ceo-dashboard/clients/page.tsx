// //app/ceo-dashboard/clients/page.tsx

// "use client"

// import RoleShell from "../../components/RoleShell"
// import ClientsList from "../../components/ClientsList"

// export default function CEOClientsPage() {
//   return (
//     <RoleShell basePath="/ceo-dashboard">
//       <div className="text-slate-700">Clients Information (CEO) — coming next step.</div>
//     </RoleShell>
//   )
// }

"use client"

import RoleShell from "@/app/components/RoleShell" // if you already use this wrapper; otherwise remove
import ClientsList from "@/app/components/ClientsList"

export default function CROClientsPage() {
  return (
    <RoleShell basePath="/cro-dashboard">
      <div className="p-4">
        <ClientsList title="All Clients" />
      </div>
    </RoleShell>
  )
}
