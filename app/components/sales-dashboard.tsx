//app/components/sales-dashboard.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Users,
    TrendingUp,
    UserPlus,
    Search,
    LayoutDashboard,
    Mail,
    Loader2
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User } from "lucide-react"

interface SalesDashboardProps {
    user: any
    onLogout: () => void
}

export function SalesDashboard({ user, onLogout }: SalesDashboardProps) {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from("clients")
            .select("*")
            .order("created_at", { ascending: false })

        if (!error && data) {
            setClients(data)
        }
        setLoading(false)
    }

    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return clients
        const term = searchTerm.toLowerCase()
        return clients.filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.client_designation?.toLowerCase().includes(term)
        )
    }, [clients, searchTerm])

    const stats = useMemo(() => {
        return {
            total: clients.length,
            active: clients.filter(c => c.is_active !== false).length,
            inactive: clients.filter(c => c.is_active === false).length,
            recentlyAdded: clients.filter(c => {
                const added = new Date(c.created_at || c.date_assigned)
                const now = new Date()
                const diff = now.getTime() - added.getTime()
                return diff < 7 * 24 * 60 * 60 * 1000 // Last 7 days
            }).length
        }
    }, [clients])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Sales Dashboard</h1>
                    <p className="text-slate-600">Welcome back, {user.name}. Manage your sales pipeline and clients.</p>
                </div>
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 rounded-full h-10 w-10 flex items-center justify-center bg-black">
                                <User className="h-6 w-6 text-white" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <p className="font-medium">{user.name}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout}>
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Clients</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Active Clients</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.active}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <UserPlus className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Added This Week</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.recentlyAdded}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Mail className="h-6 w-6 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Pending Actions</p>
                                <h3 className="text-2xl font-bold text-slate-900">0</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Recent Clients</CardTitle>
                    <div className="relative w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search clients..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Client Name</th>
                                        <th className="px-6 py-3 font-semibold">Designation</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                        <th className="px-6 py-3 font-semibold">Assigned CA</th>
                                        <th className="px-6 py-3 font-semibold">Date Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredClients.slice(0, 10).map((client) => (
                                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{client.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{client.client_designation || "N/A"}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={client.is_active !== false ? "default" : "secondary"}>
                                                    {client.is_active !== false ? "Active" : "Inactive"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{client.assigned_ca_name || "Unassigned"}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(client.created_at || client.date_assigned).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                No clients found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
