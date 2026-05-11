//src/app/team-lead-dashboard/ca/[caId]/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { CADashboard } from "@/app/components/ca-dashboard"

export default function Page({ params }: { params: { caId: string } }) {
  const { caId } = params
  const router = useRouter()
  const [caUser, setCaUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, email, designation, team_id")
        .eq("id", caId)
        .single()
      setCaUser(data || null)
      setLoading(false)
    }
    load()
  }, [caId])

  if (loading) return <div className="p-6">Loading…</div>
  if (!caUser) return <div className="p-6">CA not found.</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.push("/team-lead-dashboard")}
          className="text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 transition"
        >
          ← Back to Team Lead Dashboard
        </button>
      </div>

      <CADashboard
        user={caUser}
        onLogout={() => router.push("/team-lead-dashboard")}
        viewerMode
        forceCAId={caId}
      />
    </div>
  )
}
