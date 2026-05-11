//app/ceo-dashboard/clients/inprogress/page.tsx

"use client"
import ClientsList from "@/app/components/ClientsList"
import Sidebar from "@/app/components/Sidebar"

export default function CEOInProgressClientsPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar basePath="/ceo-dashboard" />
      <main className="flex-1 bg-slate-50 p-4">
        <ClientsList title="Clients Information — CEO" initialStatus="Started" />
      </main>
    </div>
  )
}
