//app/sales-dashboard/clients/page.tsx

"use client"

import RoleShell from "@/app/components/RoleShell"
import ClientsList from "@/app/components/ClientsList"

export default function SalesClientsPage() {
    return (
        <RoleShell basePath="/sales-dashboard">
            <div className="p-4">
                <ClientsList title="Sales - Client Management" />
            </div>
        </RoleShell>
    )
}
