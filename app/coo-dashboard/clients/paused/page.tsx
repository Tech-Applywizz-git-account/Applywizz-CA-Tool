"use client"
import ClientsList from "@/app/components/ClientsList"
import Sidebar from "@/app/components/Sidebar"

export default function COOActiveClientsPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar basePath="/coo-dashboard" />
      <main className="flex-1 bg-slate-50 p-4">
        <ClientsList title="Clients Information — COO" initialActive="inactive" />
      </main>
    </div>
  )
}
