//api/componenrs/team-lead-dashboard.tsx

"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NewClientForm } from "./new-client-form"
import { User, Users } from "lucide-react"
import { Pencil } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRef } from "react"


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
  const [searchTerm, setSearchTerm] = useState("");
  const [assignClientOpen, setAssignClientOpen] = useState(false)
  const [clientToAssign, setClientToAssign] = useState<any | null>(null)
  const [availableCAs, setAvailableCAs] = useState<any[]>([])
  const clientListRef = useRef<HTMLDivElement>(null)

  const fetchClients = async () => {
    const memberIds = teamMembers.map((m) => m.id)
    if (memberIds.length > 0) {
      const { data, error } = await supabase.from("clients").select("*").in("assigned_ca_id", memberIds)
      if (!error && data) setClients(data)
    }
  }

  // Add this right after fetchClients()
  const handleToggleActive = async (clientId: string, currentIsActive: boolean) => {
    // First fetch applywizz_id and email if available
    const { data: currentClient, error: fetchError } = await supabase
      .from("clients")
      .select("id, is_active, applywizz_id, email")
      .eq("id", clientId)
      .single();

    if (fetchError) {
      alert("Failed to fetch client details: " + fetchError.message);
      return;
    }

    const newIsActive = !currentIsActive;

    // Call Applywizz external API first
    let applywizzUpdated = false;
    let applywizzErrorMsg = "";

    try {
      if (currentClient.email) {
        const newStatus = newIsActive ? "In Progress" : "Paused";
        const authHeader = 'Basic ' + btoa('vivek@mail.com:Created@123');
        const baseUrl = process.env.NEXT_PUBLIC_APPLYWIZZ_API_URL;
        
        // 1. Search for the lead by email to get the internal ID
        const searchRes = await fetch(`${baseUrl}/api/v1/leads/?search=${encodeURIComponent(currentClient.email)}`, {
          headers: { "Authorization": authHeader },
        });
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.results && searchData.results.length > 0) {
            const internalId = searchData.results[0].id;
            
            // 2. Update the status using the internal ID
            const res = await fetch(`${baseUrl}/api/v1/leads/${internalId}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
              },
              body: JSON.stringify({ status: newStatus }),
            });
            
            if (res.ok) {
              applywizzUpdated = true;
            } else {
              applywizzErrorMsg = `Failed to update status on Applywizz backend: ${await res.text()}`;
            }
          } else {
            applywizzErrorMsg = `Lead not found on Applywizz backend for email: ${currentClient.email}`;
          }
        } else {
          applywizzErrorMsg = `Failed to search lead on Applywizz backend: ${await searchRes.text()}`;
        }
      } else {
        applywizzErrorMsg = "Client has no email, cannot sync with Applywizz.";
      }
    } catch (err: any) {
      applywizzErrorMsg = `Error connecting to Applywizz: ${err.message || err}`;
    }

    if (!applywizzUpdated) {
      alert(`Error updating Applywizz status: ${applywizzErrorMsg}. Status update aborted.`);
      return;
    }

    // Now update in Supabase (Task Management database)
    const { data, error } = await supabase
      .from("clients")
      .update({ is_active: newIsActive })
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      alert("Failed to update status in Task Management database: " + error.message);
      return;
    }

    alert(`Successfully updated status to ${newIsActive ? 'Active' : 'Inactive'} in both Task Management and CA Management!`);

    // Optimistically update UI
    setClients(prev =>
      prev.map(c => (c.id === clientId ? { ...c, is_active: data.is_active } : c))
    );
  };

  const handleToggleCAActive = async (caId: string, currentIsActive: boolean) => {
    const { data, error } = await supabase
      .from("users")
      .update({ isactive: !currentIsActive })
      .eq("id", caId)
      .select()
      .single();

    if (error) {
      console.error("Failed to toggle CA active state:", error.message);
      return;
    }

    // Optimistically update UI
    setTeamMembers(prev =>
      prev.map(m => (m.id === caId ? { ...m, isactive: data.isactive } : m))
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
      // .eq("isactive", true)
      setTeamMembers(members || [])
      const memberIds = members?.map((m) => m.id) || []
      if (memberIds.length > 0) {
        const { data: clientData } = await supabase.from("clients").select("*").in("assigned_ca_id", memberIds)
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

  const caOptions = [
    { value: "all", label: "All CA Clients" },
    ...teamMembers.map((m) => ({
      value: m.id,
      label: m.name,
      isactive: m.isactive
    }))
  ] as const;

  const selectedCAObj =
    selectedCA !== "all" ? teamMembers.find((m) => m.id === selectedCA) : null;

  const baseClients =
    selectedCA === "all"
      ? clients
      : clients.filter((c) => c.assigned_ca_id === selectedCA);
  const [clientSortOrder, setClientSortOrder] = useState<"active-first" | "paused-first" | "started-first" | "completed-first" | "status-paused-first" | null>("active-first");

  const q = searchTerm.trim().toLowerCase();

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 160;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleSortClick = (order: typeof clientSortOrder) => {
    setClientSortOrder(order);
    scrollToElement("all-clients-section");
    if (clientListRef.current) {
      clientListRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // const filteredClients = !q
  //   ? baseClients
  //   : baseClients.filter((c) => {
  //     const name = (c.name ?? "").toLowerCase();
  //     const email = (c.email ?? "").toLowerCase();
  //     return name.includes(q) || email.includes(q);
  //   });

  const filteredClients = (!q
    ? baseClients
    : baseClients.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    }))
    // ⭐ Sort dynamically based on clientSortOrder
    .sort((a, b) => {
      if (clientSortOrder === "active-first") {
        if (a.is_active === b.is_active) return 0;
        return a.is_active ? -1 : 1;
      } else if (clientSortOrder === "paused-first") {
        if (a.is_active === b.is_active) return 0;
        return a.is_active ? 1 : -1;
      } else if (clientSortOrder === "started-first") {
        const aStarted = a.status === "Started";
        const bStarted = b.status === "Started";
        if (aStarted === bStarted) return 0;
        return aStarted ? -1 : 1;
      } else if (clientSortOrder === "completed-first") {
        const aCompleted = a.status === "Completed";
        const bCompleted = b.status === "Completed";
        if (aCompleted === bCompleted) return 0;
        return aCompleted ? -1 : 1;
      } else if (clientSortOrder === "status-paused-first") {
        const aPaused = a.status === "Paused";
        const bPaused = b.status === "Paused";
        if (aPaused === bPaused) return 0;
        return aPaused ? -1 : 1;
      }
      return 0;
    });


  const stats = {
    totalCAs: teamMembers.filter(m => m.isactive).length,
    totalClients: filteredClients.length,
    startedClients: filteredClients.filter((c) => c.status === "Started").length,
    completedClients: filteredClients.filter((c) => c.status === "Completed").length,
    renewedClients: filteredClients.filter((c) => c.is_active === false).length,
    statusPausedClients: filteredClients.filter((c) => c.status === "Paused").length,
    activeClients: filteredClients.filter((c) => c.is_active === true).length,
  }

  const selectedCAIncentive = selectedCA !== "all" ? incentives.find((i) => i.user_id === selectedCA) : null
  // Handle assigning client to a different CA
  const handleAssignClient = async (clientId: string, newCaId: string) => {
    if (!clientToAssign) return

    // Get the current CA and new CA names for the alert
    const currentCA = teamMembers.find(m => m.id === clientToAssign.assigned_ca_id)
    const newCA = teamMembers.find(m => m.id === newCaId)

    const { error } = await supabase
      .from("clients")
      .update({ assigned_ca_id: newCaId })
      .eq("id", clientId)

    if (error) {
      alert("Failed to assign client: " + error.message)
      return
    }

    // Update local state
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, assigned_ca_id: newCaId } : c
    ))

    setAssignClientOpen(false)
    setClientToAssign(null)

    // Show detailed alert with CA names
    alert(`Client assigned successfully!\n\nFrom: ${currentCA?.name || "Unknown CA"}\nTo: ${newCA?.name || "Unknown CA"}`)
  }

  // Open assign dialog - show only active CAs from the same team
  const openAssignDialog = async (client: any) => {
    setClientToAssign(client)

    // Fetch active CAs from the same team (current user's team)
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, team_id, designation, isactive")
      .in("role", ["CA", "Junior CA", "Career Associative Trainee"])
      .eq("isactive", true)
      .eq("team_id", teamMembers[0]?.team_id) // All team members should have same team_id

    if (error) {
      console.error("Error fetching available CAs:", error)
      return
    }

    setAvailableCAs(data || [])
    setAssignClientOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Lead</p>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{user.name}</h1>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select CA</span>
                  <Select value={selectedCA} onValueChange={setSelectedCA}>
                    <SelectTrigger className="w-44 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {caOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{option.label}</span>
                            {'isactive' in option && (
                              <Badge
                                variant={option.isactive ? "default" : "secondary"}
                                className={option.isactive ? "bg-green-100 text-green-800 h-4 text-[9px] px-1" : "bg-gray-100 text-gray-600 h-4 text-[9px] px-1"}
                              >
                                {option.isactive ? "Act" : "In"}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Clients</span>
                  <div className="relative">
                    <Input
                      placeholder="Name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-56 h-8 text-xs"
                    />
                  </div>
                </div>

                {selectedCAObj && (
                  <Link href={`/team-lead-dashboard/ca/${selectedCAObj.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                      View {selectedCAObj.name.split(" ")[0]}'s Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Date</span>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded border border-slate-200 h-8">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">{dateTo}</span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 rounded-full h-8 w-8 flex items-center justify-center bg-black hover:bg-black/80">
                    <User className="h-4 w-4 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-medium">{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Sticky Stats Cards */}
          <div className="grid grid-cols-7 gap-3">
            <Card className="cursor-pointer hover:bg-blue-50 transition-colors border-slate-100" onClick={() => scrollToElement("all-cas-section")}>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-blue-600 leading-tight">{stats.totalCAs}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Active CAs</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-blue-50 transition-colors border-slate-100" onClick={() => scrollToElement("all-clients-section")}>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-blue-600 leading-tight">{stats.totalClients}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Total Clients</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-100" onClick={() => handleSortClick("started-first")}>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-blue-600 leading-tight">{stats.startedClients}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Started</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-orange-50 transition-colors border-slate-100" onClick={() => handleSortClick("active-first")}>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-orange-600 leading-tight">{stats.activeClients}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Active Clients</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-green-50 transition-colors border-slate-100" onClick={() => handleSortClick("completed-first")}>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-green-600 leading-tight">{stats.completedClients}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Completed</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-red-50 transition-colors border-slate-100" onClick={() => handleSortClick("paused-first")}>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-red-900 leading-tight">{stats.renewedClients}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase leading-none">Non Renewed</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-100" onClick={() => handleSortClick("status-paused-first")}>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-slate-600 leading-tight">{stats.statusPausedClients}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Paused</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="p-4 pt-6 max-w-7xl mx-auto">

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
        <Card id="all-clients-section" className="overflow-visible">
          <CardHeader className="sticky top-[152px] z-30 bg-white border-b border-slate-100 shadow-sm rounded-t-xl px-4 py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-700">{selectedCA === "all" ? "All Clients" : "Clients for selected CA"}</CardTitle>
              <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-7 text-xs px-3"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Client</Button>
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
              {/* Assign Client Dialog */}
              <Dialog open={assignClientOpen} onOpenChange={setAssignClientOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Client to CA</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {clientToAssign && (() => {
                      const currentCA = teamMembers.find(m => m.id === clientToAssign.assigned_ca_id)
                      return (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900">Client: {clientToAssign.name}</h4>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="text-sm">
                              <span className="font-medium text-blue-700">Current CA:</span>
                              <div className="text-blue-600 mt-1">
                                {currentCA ? (
                                  <>
                                    <div>{currentCA.name}</div>
                                    <div className="text-xs text-blue-500">{currentCA.email}</div>
                                  </>
                                ) : (
                                  <div className="text-red-600">Not assigned</div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-green-700">New CA:</span>
                              <div className="text-green-600 mt-1">
                                <div>Select below →</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <div>
                      <Label htmlFor="ca-select" className="text-slate-700">
                        Select New CA from Your Team
                      </Label>
                      <Select onValueChange={(value) => {
                        const selectedCA = availableCAs.find(ca => ca.id === value)
                        if (selectedCA && clientToAssign) {
                          // Show confirmation with both CA names
                          const currentCA = teamMembers.find(m => m.id === clientToAssign.assigned_ca_id)
                          const confirmMessage = `Are you sure you want to assign this client?\n\nFrom: ${currentCA?.name || "Unknown CA"}\nTo: ${selectedCA.name}`

                          if (window.confirm(confirmMessage)) {
                            handleAssignClient(clientToAssign.id, value)
                          }
                        }
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a CA from your team..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCAs.length > 0 ? (
                            availableCAs.map((ca) => (
                              <SelectItem key={ca.id} value={ca.id}>
                                <div className="flex flex-col">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{ca.name}</span>
                                    <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
                                      {ca.designation || "CA"}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-slate-500">{ca.email}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-slate-500 text-center">
                              No active CAs available in your team
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAssignClientOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent 
            ref={clientListRef}
            className="max-h-[720px] overflow-y-auto pt-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent scroll-smooth"
          >
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    {client.status === "Started" && client.jobs_applied === 0 && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    <div>
                      <Link
                        href={`/team-lead-dashboard/client/${client.id}`}
                        className="font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors cursor-pointer"
                      >
                        {client.name}
                      </Link>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-purple-300"
                      onClick={() => openAssignDialog(client)}
                    >
                      Assign
                    </Button>
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

        {/* All CA Card */}
        <Card className="mt-6 overflow-visible" id="all-cas-section">
          <CardHeader className="sticky top-[152px] z-30 bg-white border-b border-slate-100 shadow-sm rounded-t-xl px-4 py-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Users className="h-4 w-4 text-blue-600" />
              All Career Associates (CAs)
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto pt-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="space-y-4">
              {teamMembers.map((ca) => {
                const caClientsCount = clients.filter(c => c.assigned_ca_id === ca.id).length;
                return (
                  <div key={ca.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{ca.name}</h3>
                        <p className="text-sm text-slate-600">{ca.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{caClientsCount}</div>
                        <div className="text-xs text-slate-600">Assigned Clients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-800">{ca.designation || "CA"}</div>
                        <div className="text-xs text-slate-600">Designation</div>
                      </div>
                      <Badge className={ca.isactive ? "bg-green-600 text-white" : "bg-red-900 text-white"}>
                        {ca.isactive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className={ca.isactive ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"}
                        onClick={() => handleToggleCAActive(ca.id, ca.isactive)}
                      >
                        {ca.isactive ? "Set Inactive" : "Set Active"}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {teamMembers.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-4">No CAs found in your team.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
