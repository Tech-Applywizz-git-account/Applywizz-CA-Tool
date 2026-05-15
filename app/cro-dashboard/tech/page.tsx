"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CroTechDashboard } from "@/app/components/cro-tech-dashboard"
import RoleShell from "@/app/components/RoleShell"

export default function CROTechPage() {
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

    if (!user) return null

    return (
        <RoleShell basePath="/cro-dashboard">
            <CroTechDashboard basePath="/cro-dashboard" user={user} onLogout={handleLogout} />
        </RoleShell>
    )
}
