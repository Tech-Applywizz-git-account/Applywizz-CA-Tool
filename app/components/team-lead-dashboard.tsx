//api/componenrs/team-lead-dashboard.tsx

"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NewClientForm } from "./new-client-form"
import { User } from "lucide-react"
import { Pencil } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"


interface TeamLeadDashboardProps {
  user: any
  onLogout: () => void
}

export function TeamLeadDashboard({ user, onLogout }: TeamLeadDashboardProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [incentives, setIncentives] = useState<any[]>([])
  const [selectedCA, setSelectedCA] = useState("all")
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [dateTo] = useState(new Date().toISOString().split("T")[0])
  const [editClientOpen, setEditClientOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<any | null>(null)

  const fetchClients = async () => {
    const memberIds = teamMembers.map((m) => m.id)
    if (memberIds.length > 0) {
      const { data, error } = await supabase.from("clients").select("*").in("assigned_ca_id", memberIds).order("name", { ascending: true })
      if (!error && data) setClients(data)
    }
  }

  // Add this right after fetchClients()
  const handleToggleActive = async (clientId: string, currentIsActive: boolean) => {
    const { data, error } = await supabase
      .from("clients")
      .update({ is_active: !currentIsActive })
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      console.error("Failed to toggle active state:", error.message);
      return;
    }

    // Optimistically update UI
    setClients(prev =>
      prev.map(c => (c.id === clientId ? { ...c, is_active: data.is_active } : c))
    );
  };

  const openEditDialog = async (clientId: string) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    if (error) {
      console.error("Failed to load client:", error.message)
      return
    }
    setClientToEdit(data)
    setEditClientOpen(true)
  }



  useEffect(() => {
    const fetchTeamData = async () => {
      const { data: teams } = await supabase.from("teams").select("id").eq("lead_id", user.id)
      const teamIds = teams?.map((t) => t.id) || []

      const { data: members } = await supabase
        .from("users")
        .select("*")
        .in("team_id", teamIds)
        .neq("role", "Team Lead")

      setTeamMembers(members || [])
      const memberIds = members?.map((m) => m.id) || []
      if (memberIds.length > 0) {
        const { data: clientData } = await supabase.from("clients").select("*").in("assigned_ca_id", memberIds).order("name", { ascending: true })
        setClients(clientData || [])
      }

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { data: incentiveData } = await supabase
        .from("incentives")
        .select("*")
        .in("user_id", memberIds)
        .eq("month", startOfMonth)
      setIncentives(incentiveData || [])
    }
    fetchTeamData()
  }, [user.id])

  const caOptions = [{ value: "all", label: "All Clients" }, ...teamMembers.map((m) => ({ value: m.id, label: m.name }))]

  const filteredClients = selectedCA === "all" ? clients : clients.filter((c) => c.assigned_ca_id === selectedCA)

  const stats = {
    totalCAs: teamMembers.length,
    totalClients: filteredClients.length,
    startedClients: filteredClients.filter((c) => c.status === "Started").length,
    completedClients: filteredClients.filter((c) => c.status === "Completed").length,
    missingUpdates: filteredClients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length,
    pausedClients: filteredClients.filter((c) => c.is_active === false).length,
    activeClients: filteredClients.filter((c) => c.is_active === true).length,
  }

  const selectedCAIncentive = selectedCA !== "all" ? incentives.find((i) => i.user_id === selectedCA) : null

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team Lead Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user.name}!</p>
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

        <div className="flex gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Select CA</label>
            <Select value={selectedCA} onValueChange={setSelectedCA}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {caOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-white border rounded">
                <Calendar className="h-4 w-4" />
                <span className="text-sm text-slate-600">{dateTo}</span>
              </div>
              <Button variant="outline" size="sm">
                Today
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.totalCAs}</div><div className="text-sm text-slate-600">Total CAs</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.startedClients}</div><div className="text-sm text-slate-600">Started</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{stats.activeClients}</div><div className="text-sm text-slate-600">Active Clients</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.completedClients}</div><div className="text-sm text-slate-600">Completed</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-900">{stats.pausedClients}</div><div className="text-sm text-slate-600">Paused Clients</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{stats.missingUpdates}</div><div className="text-sm text-slate-600">Missing Updates</div></CardContent></Card>
        </div>

        {selectedCAIncentive && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Incentive Details</h3>
                  <p className="text-sm text-slate-600">Current performance and earnings</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">₹{selectedCAIncentive.incentive_amount}</div>
                    <div className="text-sm text-slate-600">Current Incentive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{selectedCAIncentive.total_clients_completed}</div>
                    <div className="text-sm text-slate-600">Completed Clients</div>
                  </div>
                  {selectedCAIncentive.badge && (
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-white">
                      🏅 {selectedCAIncentive.badge}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedCA === "all" ? "All Clients" : "Clients for selected CA"}</CardTitle>
              <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Add New Client</Button>
                </DialogTrigger>

                <Dialog open={editClientOpen} onOpenChange={setEditClientOpen}>
                  <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden p-0">
                    <DialogHeader>
                      <DialogTitle>Edit Client</DialogTitle>
                    </DialogHeader>
                    <NewClientForm
                      mode="edit"
                      initialClient={clientToEdit}
                      fetchClients={async () => {
                        await fetchClients()
                        setEditClientOpen(false)
                      }}
                      onClose={() => setEditClientOpen(false)}
                    />
                  </DialogContent>
                </Dialog>


                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
                  <NewClientForm fetchClients={fetchClients} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    {client.status === "Started" && client.jobs_applied === 0 && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    <div>
                      <h3 className="font-semibold text-slate-900">{client.name}</h3>
                      <p className="text-sm text-slate-600">{client.date_assigned}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{client.jobs_applied}</div>
                      <div className="text-xs text-slate-600">Jobs Applied</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{client.emails_submitted}</div>
                      <div className="text-xs text-slate-600">Emails Received</div>
                    </div>

                    {/* Status badge (existing) */}
                    <Badge
                      className={
                        client.status === "Not Started"
                          ? "bg-red-500 text-white"
                          : client.status === "Started"
                            ? "bg-orange-500 text-white"
                            : client.status === "Paused"
                              ? "bg-white text-black border border-slate-300"
                              : client.status === "Completed"
                                ? "bg-green-500 text-white"
                                : ""
                      }
                    >
                      {client.status}
                    </Badge>

                    <Badge className={client.is_active ? "bg-green-600 text-white" : "bg-red-900 text-white"}>
                      {client.is_active ? "Active" : "Inactive"}
                    </Badge>

                    {/* New: Toggle button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-300"
                      onClick={() => handleToggleActive(client.id, client.is_active)}
                    >
                      {client.is_active ? "Set Inactive" : "Set Active"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-slate-100"
                      onClick={() => openEditDialog(client.id)}
                      title="Edit client"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
