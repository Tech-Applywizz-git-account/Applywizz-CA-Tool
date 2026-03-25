"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { BDADashboard } from "@/app/components/bda-dashboard"

export default function SalesViewerPage({ params }: { params: { salesId: string } }) {
  const { salesId } = params
  const router = useRouter()
  const [salesUser, setSalesUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, email, role, designation")
        .eq("id", salesId)
        .single()
      setSalesUser(data || null)
      setLoading(false)
    }
    load()
  }, [salesId])

  if (loading) return <div className="p-6">Loading…</div>
  if (!salesUser) return <div className="p-6">Sales Rep not found.</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 pt-4">
        <button
          onClick={() => router.back()}
          className="text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      <BDADashboard
        user={salesUser}
        onLogout={() => router.push("/login")}
        viewerMode={true}
      />
    </div>
  )
}
