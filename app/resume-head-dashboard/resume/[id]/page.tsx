"use client"

import { useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ResumeDashboard } from "@/app/components/resume-dashboard"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ResumeHeadViewPage({ params }: { params: any }) {
    const resolvedParams = params && typeof params.then === 'function' ? use<{ id: string }>(params) : (params as { id: string })
    const id = resolvedParams?.id
    const router = useRouter()
    const searchParams = useSearchParams()
    const [repUser, setRepUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return;
            setLoading(true)
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", id)
                .single()

            if (error) {
                setError(error.message)
            } else {
                setRepUser(data)
            }
            setLoading(false)
        }
        fetchUser()
    }, [id])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-500 font-semibold">Loading Associate Dashboard...</p>
            </div>
        )
    }

    if (error || !repUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <p className="text-red-500 font-bold mb-4">Error: {error || "User not found"}</p>
                <Link href="/resume-head-dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="fixed top-6 left-6 z-[60]">
                <Link href="/resume-head-dashboard">
                    <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm hover:bg-white gap-2 font-bold text-slate-700">
                        <ArrowLeft className="h-4 w-4" /> Back to Team
                    </Button>
                </Link>
            </div>
            <ResumeDashboard 
                user={repUser} 
                onLogout={() => {}} 
                viewerMode={true} 
            />
        </div>
    )
}
