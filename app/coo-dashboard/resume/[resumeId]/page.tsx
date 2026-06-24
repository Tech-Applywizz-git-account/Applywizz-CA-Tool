"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ResumeDashboard } from "@/app/components/resume-dashboard"

export default function ResumeViewerPage({ params }: { params: { resumeId: string } }) {
    const { resumeId } = params
    const router = useRouter()
    const [resumeUser, setResumeUser] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("users")
                .select("id, name, email, role, department, isactive")
                .eq("id", resumeId)
                .single()
            setResumeUser(data || null)
            setLoading(false)
        }
        load()
    }, [resumeId])

    if (loading) return <div className="p-6">Loading…</div>
    if (!resumeUser) return <div className="p-6">Resume Rep not found.</div>

    return (
        <div className="relative">
            <div className="fixed top-6 left-6 z-[60]">
                <button
                    onClick={() => router.back()}
                    className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm hover:bg-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold text-slate-700 text-sm transition-all"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <ResumeDashboard
                user={resumeUser}
                onLogout={() => router.push("/login")}
                viewerMode={true}
            />
        </div>
    )
}
