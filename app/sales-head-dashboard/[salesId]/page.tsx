"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { BDADashboard } from "@/app/components/bda-dashboard"

export default function SalesHeadRepViewPage({ params }: { params: { salesId: string } }) {
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-violet-50/20 flex items-center justify-center">
      <div className="text-center">
        <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-t-4 border-rose-500 animate-[spin_1s_linear_infinite]"></div>
          <div className="absolute inset-2 rounded-full border-r-4 border-violet-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
        </div>
        <p className="text-sm font-semibold text-slate-500">Loading representative dashboard...</p>
      </div>
    </div>
  )

  if (!salesUser) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-violet-50/20 flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-bold text-slate-600 mb-4">Sales Rep not found.</p>
        <button
          onClick={() => router.push("/sales-head-dashboard")}
          className="text-sm px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition font-bold"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 pt-4">
        <button
          onClick={() => router.push("/sales-head-dashboard")}
          className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:from-rose-600 hover:to-violet-600 transition-all font-bold shadow-md shadow-rose-500/20"
        >
          ← Back to Sales Head Dashboard
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
