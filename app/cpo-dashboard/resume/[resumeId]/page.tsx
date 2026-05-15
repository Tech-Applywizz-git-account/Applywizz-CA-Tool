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
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-8 pt-4">
                <button
                    onClick={() => router.back()}
                    className="text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 transition"
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
