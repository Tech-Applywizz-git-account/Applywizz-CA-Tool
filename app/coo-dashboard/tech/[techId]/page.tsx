"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { TechDashboard } from "@/app/components/tech-dashboard"

export default function TechViewerPage({ params }: { params: { techId: string } }) {
    const { techId } = params
    const router = useRouter()
    const [techUser, setTechUser] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("users")
                .select("id, name, email, role, department, isactive")
                .eq("id", techId)
                .single()
            setTechUser(data || null)
            setLoading(false)
        }
        load()
    }, [techId])

    if (loading) return <div className="p-6">Loading…</div>
    if (!techUser) return <div className="p-6">Tech Rep not found.</div>

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

            <TechDashboard
                user={techUser}
                onLogout={() => router.push("/login")}
                viewerMode={true}
            />
        </div>
    )
}
