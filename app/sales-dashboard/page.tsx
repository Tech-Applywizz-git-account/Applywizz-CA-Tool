//app/sales-dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SalesDashboard } from "../components/sales-dashboard"
import RoleShell from "../components/RoleShell"
import { useAuthCheck } from "@/hooks/useAuthCheck"

export default function SalesDashboardPage() {
    const router = useRouter()
    const { user, loading } = useAuthCheck(["Sales", "Admin", "SYSTEM"])

    const handleLogout = () => {
        localStorage.removeItem("loggedInUser")
        router.push("/login")
    }

    if (loading || !user) return null

    return (
        <RoleShell basePath="/sales-dashboard">
            <SalesDashboard user={user} onLogout={handleLogout} />
        </RoleShell>
    )
}
