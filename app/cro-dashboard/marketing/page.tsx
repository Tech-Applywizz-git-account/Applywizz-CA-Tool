"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CROMarketingDashboard } from "../../components/cro-marketing-dashboard"
import RoleShell from "../../components/RoleShell"

export default function CROMarketingPage() {
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
            <CROMarketingDashboard basePath="/cro-dashboard" user={user} onLogout={handleLogout} />
        </RoleShell>
    )
}
