// app/ceo-dashboard/client/[clientId]/page.tsx

"use client"

import { useRouter } from "next/navigation"
import { ClientDashboard } from "@/app/components/client-dashboard"

export default function Page({ params }: { params: { clientId: string } }) {
  const { clientId } = params
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.push("/ceo-dashboard")}
          className="text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 transition mb-4"
        >
          ← Back to CEO Dashboard
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <ClientDashboard clientId={clientId} />
      </div>
    </div>
  )
}
