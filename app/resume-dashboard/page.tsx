"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ResumeDashboard } from "../components/resume-dashboard"

export default function ResumeDashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("loggedInUser")
        if (!storedUser) {
            router.push("/login")
        } else {
            setUser(JSON.parse(storedUser))
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("loggedInUser")
        router.push("/login")
    }

    if (!user) return null // or show a loading state

    return <ResumeDashboard user={user} onLogout={handleLogout} />
}
