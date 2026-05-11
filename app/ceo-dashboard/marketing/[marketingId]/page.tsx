"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { MarketingDashboard } from "@/app/components/marketing-dashboard"

export default function MarketingViewerPage({ params }: { params: { marketingId: string } }) {
    const { marketingId } = params
    const router = useRouter()
    const [marketingUser, setMarketingUser] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("users")
                .select("id, name, email, role, department, isactive")
                .eq("id", marketingId)
                .single()
            setMarketingUser(data || null)
            setLoading(false)
        }
        load()
    }, [marketingId])

    if (loading) return <div className="p-6">Loading…</div>
    if (!marketingUser) return <div className="p-6">Marketing Rep not found.</div>

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

            <MarketingDashboard
                user={marketingUser}
                onLogout={() => router.push("/login")}
                viewerMode={true}
            />
        </div>
    )
}
