"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/app/components/Sidebar"
import { supabase } from "@/lib/supabaseClient"
import ClientsList from "@/app/components/ClientsList"

import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function TeamLeadClientsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthCheck()
  const [teamIds, setTeamIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return

      // fetch TL-owned teams
      const { data: teams, error } = await supabase
        .from("teams")
        .select("id")
        .eq("lead_id", user.id)

      if (!error && teams) {
        setTeamIds(teams.map(t => t.id))
      }
      setLoading(false)
    }
    fetchTeams()
  }, [user])

  if (authLoading || !user) return null

  return (
    <div className="min-h-screen flex">
      <Sidebar basePath="/team-lead-dashboard" />
      <main className="flex-1 p-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Clients Information</h1>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <ClientsList
              title="Clients Information"
              teamIds={teamIds}         // ← only the TL’s teams
              pageSize={20}
              initialActive="all"
              initialStatus="all"
            />
          )}
        </div>
      </main>
    </div>
  )
}
