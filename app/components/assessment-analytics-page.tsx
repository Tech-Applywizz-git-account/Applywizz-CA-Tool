// app/components/assessment-analytics-page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { ClientAssessmentsTracker } from "./client-assessments-tracker"
import { Loader2 } from "lucide-react"

interface AssessmentAnalyticsPageProps {
  scope: "team-lead" | "executive"
}

export function AssessmentAnalyticsPage({ scope }: AssessmentAnalyticsPageProps) {
  const [user, setUser] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const stored = localStorage.getItem("loggedInUser")
        if (!stored) return
        const loggedUser = JSON.parse(stored)
        setUser(loggedUser)

        if (scope === "team-lead") {
          // Fetch team lead's team members and their clients
          const { data: teams } = await supabase
            .from("teams")
            .select("id")
            .eq("lead_id", loggedUser.id)
            
          const teamIds = teams?.map((t) => t.id) || []

          const { data: members } = await supabase
            .from("users")
            .select("*")
            .in("team_id", teamIds)
            .neq("role", "Team Lead")
          
          const activeMembers = members || []
          setTeamMembers(activeMembers)
          const memberIds = activeMembers.map((m) => m.id)

          if (memberIds.length > 0) {
            const { data: clientData } = await supabase
              .from("clients")
              .select("*")
              .in("assigned_ca_id", memberIds)
            setClients(clientData || [])
          }
        } else {
          // Executive scope: fetch all clients and all CAs
          const { data: clientData } = await supabase
            .from("clients")
            .select("*")
          setClients(clientData || [])

          const { data: members } = await supabase
            .from("users")
            .select("*")
            .in("role", ["CA", "Junior CA", "Career Associative Trainee"])
          setTeamMembers(members || [])
        }
      } catch (error) {
        console.error("Error loading data for Assessment Analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [scope])

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Loading Assessment Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assessment Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed metrics, client comparison cohorts, and hiring company performance reports.
        </p>
      </div>
      <ClientAssessmentsTracker
        user={user}
        scope={scope}
        teamMembers={teamMembers}
        clients={clients}
      />
    </div>
  )
}
