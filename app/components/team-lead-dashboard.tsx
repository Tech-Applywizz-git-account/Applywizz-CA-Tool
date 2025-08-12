// "use client"

// import { useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Calendar, Plus, AlertTriangle } from "lucide-react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { NewClientForm } from "./new-client-form"

// interface TeamLeadDashboardProps {
//   user: any
//   onLogout: () => void
// }

// const mockClients = [
//   {
//     id: "1",
//     name: "John Miller",
//     email: "john.miller@example.com",
//     dateAssigned: "2024-01-26",
//     jobsApplied: 15,
//     emailsSubmitted: 3,
//     emailsRequired: 10,
//     status: "Completed",
//     assignedCA: "rama@applywizz.com",
//     lastUpdate: "2024-01-27",
//   },
//   {
//     id: "2",
//     name: "Riya Patel",
//     email: "riya.patel@example.com",
//     dateAssigned: "2024-01-26",
//     jobsApplied: 8,
//     emailsSubmitted: 1,
//     emailsRequired: 5,
//     status: "Paused",
//     assignedCA: "rama@applywizz.com",
//     lastUpdate: "2024-01-28",
//   },
//   {
//     id: "3",
//     name: "Ahmed Khan",
//     email: "ahmed.khan@example.com",
//     dateAssigned: "2024-01-26",
//     jobsApplied: 0,
//     emailsSubmitted: 0,
//     emailsRequired: 7,
//     status: "Started",
//     assignedCA: "rama@applywizz.com",
//     lastUpdate: "2024-01-29",
//   },
// ]

// export function TeamLeadDashboard({ user, onLogout }: TeamLeadDashboardProps) {
//   const [selectedCA, setSelectedCA] = useState("rama-krishna")
//   const [clients, setClients] = useState(mockClients)
//   const [newClientOpen, setNewClientOpen] = useState(false)
//   const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
//   const [selectedClient, setSelectedClient] = useState(null)
//   const [currentView, setCurrentView] = useState("overview")
//   const [onBehalfCA, setOnBehalfCA] = useState("")
//   const [dateFrom, setDateFrom] = useState("2024-01-29")
//   const [dateTo, setDateTo] = useState("2024-01-29")

//   // Extended team data
//   const teamMembers = [
//     { id: "ca1", name: "Rama Krishna", email: "rama@applywizz.com", salary: 6000, designation: "Junior CA" },
//     { id: "ca2", name: "Priya Sharma", email: "priya@applywizz.com", salary: 6000, designation: "Junior CA" },
//     { id: "ca3", name: "Arjun Patel", email: "arjun@applywizz.com", salary: 8000, designation: "CA" },
//   ]

//   const caOptions = [
//     { value: "all", label: "All CAs" },
//     { value: "rama-krishna", label: "Rama Krishna" },
//     { value: "naveen-teja", label: "Naveen Teja" },
//     { value: "anusha-reddy", label: "Anusha Reddy" },
//   ]

//   const calculateCAIncentives = (caEmail) => {
//     const caClients = clients.filter((c) => c.assignedCA === caEmail)
//     const completedClients = caClients.filter((c) => c.status === "Completed").length

//     let incentive = 0
//     let badge = ""

//     if (completedClients >= 6) {
//       incentive = 11000
//       badge = "Top Performer"
//     } else if (completedClients >= 5) {
//       incentive = 8000
//       badge = "Tier 2"
//     } else if (completedClients >= 4) {
//       incentive = 4500
//       badge = "Tier 2"
//     } else if (completedClients >= 3) {
//       incentive = 2000
//       badge = "Tier 1"
//     }

//     return { completedClients, incentive, badge, totalClients: caClients.length }
//   }

//   // Get current CA data and metrics
//   const getCurrentCAData = () => {
//     if (selectedCA === "all") return null
//     const caName = caOptions.find((ca) => ca.value === selectedCA)?.label
//     const caEmail = teamMembers.find((m) => m.name === caName)?.email || "rama@applywizz.com"
//     return {
//       name: caName,
//       email: caEmail,
//       metrics: calculateCAIncentives(caEmail),
//     }
//   }

//   const currentCAData = getCurrentCAData()
//   const filteredClients = selectedCA === "all" ? clients : clients.filter((c) => c.assignedCA === currentCAData?.email)

//   // Calculate statistics for selected CA
//   const getStatistics = () => {
//     const totalClients = filteredClients.length
//     const startedClients = filteredClients.filter((c) => c.status === "Started").length
//     const pausedClients = filteredClients.filter((c) => c.status === "Paused").length
//     const completedClients = filteredClients.filter((c) => c.status === "Completed").length
//     const missingUpdates = filteredClients.filter((c) => c.status === "Started" && c.jobsApplied === 0).length

//     return { totalClients, startedClients, pausedClients, completedClients, missingUpdates }
//   }

//   const stats = getStatistics()

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">Team Lead Dashboard</h1>
//             <p className="text-slate-600">Welcome back, Team Lead!</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="flex gap-4 mb-6">
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Select CA</label>
//             <Select value={selectedCA} onValueChange={setSelectedCA}>
//               <SelectTrigger className="w-48">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 {caOptions.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
//             <div className="flex items-center gap-2">
//               <div className="flex items-center gap-1 px-3 py-1 bg-white border rounded">
//                 <Calendar className="h-4 w-4" />
//                 <span className="text-sm text-slate-600">July 29th, 2025</span>
//               </div>
//               <Button variant="outline" size="sm">
//                 Today
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Statistics Cards */}
//         <div className="grid grid-cols-5 gap-4 mb-6">
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div>
//               <div className="text-sm text-slate-600">Total Clients</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-blue-600">{stats.startedClients}</div>
//               <div className="text-sm text-slate-600">Started</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-orange-600">{stats.pausedClients}</div>
//               <div className="text-sm text-slate-600">Paused</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-green-600">{stats.completedClients}</div>
//               <div className="text-sm text-slate-600">Completed</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-red-600">{stats.missingUpdates}</div>
//               <div className="text-sm text-slate-600">Missing Updates</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Incentive Information - Only show when specific CA is selected */}
//         {selectedCA !== "all" && currentCAData && (
//           <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-900">{currentCAData.name} - Incentive Details</h3>
//                   <p className="text-sm text-slate-600">Current performance and earnings</p>
//                 </div>
//                 <div className="flex items-center gap-6">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-blue-600">
//                       ₹{currentCAData.metrics.incentive.toLocaleString()}
//                     </div>
//                     <div className="text-sm text-slate-600">Current Incentive</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-green-600">{currentCAData.metrics.completedClients}</div>
//                     <div className="text-sm text-slate-600">Completed Clients</div>
//                   </div>
//                   {currentCAData.metrics.badge && (
//                     <Badge variant="outline" className="text-sm px-3 py-1 bg-white">
//                       🏅 {currentCAData.metrics.badge}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Clients List */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle>{selectedCA === "all" ? "All Clients" : `Clients for ${currentCAData?.name}`}</CardTitle>
//               <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
//                 <DialogTrigger asChild>
//                   <Button>
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add New Client
//                   </Button>
//                 </DialogTrigger>
//                 <DialogContent>
//                   <DialogHeader>
//                     <DialogTitle>Add New Client</DialogTitle>
//                   </DialogHeader>
//                   <NewClientForm
//                     onSubmit={(data) => {
//                       const newClient = {
//                         id: Date.now().toString(),
//                         ...data,
//                         emailsSubmitted: 0,
//                         jobsApplied: 0,
//                         dateAssigned: new Date().toISOString().split("T")[0],
//                         lastUpdate: new Date().toISOString().split("T")[0],
//                       }
//                       setClients((prev) => [...prev, newClient])
//                       setNewClientOpen(false)
//                     }}
//                   />
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {filteredClients.map((client) => (
//                 <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
//                   <div className="flex items-center gap-3">
//                     {client.status === "Started" && client.jobsApplied === 0 && (
//                       <AlertTriangle className="h-5 w-5 text-red-500" />
//                     )}
//                     <div>
//                       <h3 className="font-semibold text-slate-900">{client.name}</h3>
//                       <p className="text-sm text-slate-600">{client.dateAssigned}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-8 text-center">
//                     <div>
//                       <div className="text-lg font-bold text-blue-600">{client.jobsApplied}</div>
//                       <div className="text-xs text-slate-600">Jobs Applied</div>
//                     </div>
//                     <div>
//                       <div className="text-lg font-bold text-blue-600">{client.emailsSubmitted}</div>
//                       <div className="text-xs text-slate-600">Emails Received</div>
//                     </div>
//                     <Badge
//                       variant={
//                         client.status === "Completed"
//                           ? "default"
//                           : client.status === "Started"
//                             ? "secondary"
//                             : client.status === "Paused"
//                               ? "destructive"
//                               : "outline"
//                       }
//                       className={
//                         client.status === "Completed"
//                           ? "bg-green-100 text-green-800 border-green-300"
//                           : client.status === "Paused"
//                             ? "bg-orange-100 text-orange-800 border-orange-300"
//                             : client.status === "Started"
//                               ? "bg-blue-100 text-blue-800 border-blue-300"
//                               : ""
//                       }
//                     >
//                       {client.status}
//                     </Badge>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

// "use client"

// import { useState, useEffect } from "react"
// import { supabase } from "@/lib/supabaseClient"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Calendar, Plus, AlertTriangle } from "lucide-react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { NewClientForm } from "./new-client-form"

// interface TeamLeadDashboardProps {
//   user: any
//   onLogout: () => void
// }

// export function TeamLeadDashboard({ user, onLogout }: TeamLeadDashboardProps) {
//   const [teamMembers, setTeamMembers] = useState<any[]>([])
//   const [clients, setClients] = useState<any[]>([])
//   const [incentives, setIncentives] = useState<any[]>([])
//   const [selectedCA, setSelectedCA] = useState("all")
//   const [newClientOpen, setNewClientOpen] = useState(false)
//   const [dateFrom] = useState(new Date().toISOString().split("T")[0])
//   const [dateTo] = useState(new Date().toISOString().split("T")[0])

//   // ---------- Fetch Team Members ----------
//   useEffect(() => {
//     const fetchTeamData = async () => {
//       // 1) Get team members under this Team Lead
//       const { data: members, error: membersError } = await supabase
//         .from("users")
//         .select("*")
//         .eq("team_id", user.team_id)
//         .neq("role", "Team Lead")

//       if (!membersError && members) setTeamMembers(members)

//       // 2) Get all clients assigned to these members
//       const memberIds = members?.map((m) => m.id) || []
//       if (memberIds.length > 0) {
//         const { data: clientData, error: clientError } = await supabase
//           .from("clients")
//           .select("*")
//           .in("assigned_ca_id", memberIds)

//         if (!clientError && clientData) setClients(clientData)
//       }

//       // 3) Get incentives for these members (current month)
//       const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
//       const { data: incentiveData, error: incentiveError } = await supabase
//         .from("incentives")
//         .select("*")
//         .in("user_id", memberIds)
//         .eq("month", startOfMonth)

//       if (!incentiveError && incentiveData) setIncentives(incentiveData)
//     }

//     fetchTeamData()
//   }, [user.team_id])

//   // ---------- Derived CA Options ----------
//   const caOptions = [{ value: "all", label: "All CAs" }, ...teamMembers.map((m) => ({ value: m.id, label: m.name }))]

//   // ---------- Filter Clients ----------
//   const filteredClients =
//     selectedCA === "all" ? clients : clients.filter((c) => c.assigned_ca_id === selectedCA)

//   // ---------- Stats ----------
//   const stats = {
//     totalClients: filteredClients.length,
//     startedClients: filteredClients.filter((c) => c.status === "Started").length,
//     pausedClients: filteredClients.filter((c) => c.status === "Paused").length,
//     completedClients: filteredClients.filter((c) => c.status === "Completed").length,
//     missingUpdates: filteredClients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length,
//   }

//   // ---------- Incentive Data for selected CA ----------
//   const selectedCAIncentive =
//     selectedCA !== "all"
//       ? incentives.find((i) => i.user_id === selectedCA)
//       : null

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">Team Lead Dashboard</h1>
//             <p className="text-slate-600">Welcome back, {user.name}!</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="flex gap-4 mb-6">
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Select CA</label>
//             <Select value={selectedCA} onValueChange={setSelectedCA}>
//               <SelectTrigger className="w-48">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 {caOptions.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
//             <div className="flex items-center gap-2">
//               <div className="flex items-center gap-1 px-3 py-1 bg-white border rounded">
//                 <Calendar className="h-4 w-4" />
//                 <span className="text-sm text-slate-600">{dateTo}</span>
//               </div>
//               <Button variant="outline" size="sm">
//                 Today
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Statistics Cards */}
//         <div className="grid grid-cols-5 gap-4 mb-6">
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.startedClients}</div><div className="text-sm text-slate-600">Started</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{stats.pausedClients}</div><div className="text-sm text-slate-600">Paused</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.completedClients}</div><div className="text-sm text-slate-600">Completed</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{stats.missingUpdates}</div><div className="text-sm text-slate-600">Missing Updates</div></CardContent></Card>
//         </div>

//         {/* Incentive Info for selected CA */}
//         {selectedCAIncentive && (
//           <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-900">Incentive Details</h3>
//                   <p className="text-sm text-slate-600">Current performance and earnings</p>
//                 </div>
//                 <div className="flex items-center gap-6">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-blue-600">₹{selectedCAIncentive.incentive_amount}</div>
//                     <div className="text-sm text-slate-600">Current Incentive</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-green-600">{selectedCAIncentive.total_clients_completed}</div>
//                     <div className="text-sm text-slate-600">Completed Clients</div>
//                   </div>
//                   {selectedCAIncentive.badge && (
//                     <Badge variant="outline" className="text-sm px-3 py-1 bg-white">
//                       🏅 {selectedCAIncentive.badge}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Clients List */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle>{selectedCA === "all" ? "All Clients" : "Clients for selected CA"}</CardTitle>
//               <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
//                 <DialogTrigger asChild>
//                   <Button><Plus className="h-4 w-4 mr-2" />Add New Client</Button>
//                 </DialogTrigger>
//                 <DialogContent>
//                   <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
//                   <NewClientForm onSubmit={(data) => {
//                     const newClient = {
//                       id: Date.now().toString(),
//                       ...data,
//                       date_assigned: new Date().toISOString().split("T")[0],
//                       last_update: new Date().toISOString().split("T")[0],
//                     }
//                     setClients((prev) => [...prev, newClient])
//                     setNewClientOpen(false)
//                   }} />
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {filteredClients.map((client) => (
//                 <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
//                   <div className="flex items-center gap-3">
//                     {client.status === "Started" && client.jobs_applied === 0 && <AlertTriangle className="h-5 w-5 text-red-500" />}
//                     <div>
//                       <h3 className="font-semibold text-slate-900">{client.name}</h3>
//                       <p className="text-sm text-slate-600">{client.date_assigned}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-8 text-center">
//                     <div><div className="text-lg font-bold text-blue-600">{client.jobs_applied}</div><div className="text-xs text-slate-600">Jobs Applied</div></div>
//                     <div><div className="text-lg font-bold text-blue-600">{client.emails_submitted}</div><div className="text-xs text-slate-600">Emails Received</div></div>
//                     <Badge variant={client.status === "Completed" ? "default" : client.status === "Started" ? "secondary" : "destructive"}>
//                       {client.status}
//                     </Badge>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }


// "use client"

// import { useState, useEffect } from "react"
// import { supabase } from "@/lib/supabaseClient"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Calendar, Plus, AlertTriangle } from "lucide-react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { NewClientForm } from "./new-client-form"

// interface TeamLeadDashboardProps {
//   user: any
//   onLogout: () => void
// }

// export function TeamLeadDashboard({ user, onLogout }: TeamLeadDashboardProps) {
//   const [teamMembers, setTeamMembers] = useState<any[]>([])
//   const [clients, setClients] = useState<any[]>([])
//   const [incentives, setIncentives] = useState<any[]>([])
//   const [selectedCA, setSelectedCA] = useState("all")
//   const [newClientOpen, setNewClientOpen] = useState(false)
//   const [dateFrom] = useState(new Date().toISOString().split("T")[0])
//   const [dateTo] = useState(new Date().toISOString().split("T")[0])

//   // ========== FETCH TEAM MEMBERS BASED ON LEAD ID ==========
//   useEffect(() => {
//     const fetchTeamData = async () => {
//       // 1) Get teams managed by this lead
//       const { data: teams, error: teamError } = await supabase
//         .from("teams")
//         .select("id")
//         .eq("lead_id", user.id)

//       if (teamError) {
//         console.error("Error fetching teams:", teamError)
//         return
//       }

//       const teamIds = teams?.map((t) => t.id) || []

//       // 2) Get team members (excluding the Team Lead role)
//       const { data: members, error: membersError } = await supabase
//         .from("users")
//         .select("*")
//         .in("team_id", teamIds)
//         .neq("role", "Team Lead")

//       if (!membersError && members) setTeamMembers(members)

//       // 3) Get all clients assigned to these members
//       const memberIds = members?.map((m) => m.id) || []
//       if (memberIds.length > 0) {
//         const { data: clientData, error: clientError } = await supabase
//           .from("clients")
//           .select("*")
//           .in("assigned_ca_id", memberIds)

//         if (!clientError && clientData) setClients(clientData)
//       }

//       // 4) Get incentives for these members (current month)
//       const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
//       const { data: incentiveData, error: incentiveError } = await supabase
//         .from("incentives")
//         .select("*")
//         .in("user_id", memberIds)
//         .eq("month", startOfMonth)

//       if (!incentiveError && incentiveData) setIncentives(incentiveData)
//     }

//     fetchTeamData()
//   }, [user.id])

//   // ========== CA DROPDOWN OPTIONS ==========
//   const caOptions = [{ value: "all", label: "All CAs" }, ...teamMembers.map((m) => ({ value: m.id, label: m.name }))]

//   // ========== CLIENT FILTER ==========
//   const filteredClients =
//     selectedCA === "all" ? clients : clients.filter((c) => c.assigned_ca_id === selectedCA)

//   // ========== STATS ==========
//   const stats = {
//     totalClients: filteredClients.length,
//     startedClients: filteredClients.filter((c) => c.status === "Started").length,
//     pausedClients: filteredClients.filter((c) => c.status === "Paused").length,
//     completedClients: filteredClients.filter((c) => c.status === "Completed").length,
//     missingUpdates: filteredClients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length,
//   }

//   // ========== INCENTIVE DATA ==========
//   const selectedCAIncentive =
//   selectedCA !== "all"
//     ? incentives.find((i) => i.user_id === selectedCA)
//     : null

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">Team Lead Dashboard</h1>
//             <p className="text-slate-600">Welcome back, {user.name}!</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="flex gap-4 mb-6">
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Select CA</label>
//             <Select value={selectedCA} onValueChange={setSelectedCA}>
//               <SelectTrigger className="w-48">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 {caOptions.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
//             <div className="flex items-center gap-2">
//               <div className="flex items-center gap-1 px-3 py-1 bg-white border rounded">
//                 <Calendar className="h-4 w-4" />
//                 <span className="text-sm text-slate-600">{dateTo}</span>
//               </div>
//               <Button variant="outline" size="sm">
//                 Today
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-5 gap-4 mb-6">
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.startedClients}</div><div className="text-sm text-slate-600">Started</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{stats.pausedClients}</div><div className="text-sm text-slate-600">Paused</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.completedClients}</div><div className="text-sm text-slate-600">Completed</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{stats.missingUpdates}</div><div className="text-sm text-slate-600">Missing Updates</div></CardContent></Card>
//         </div>

//         {/* Incentive Info */}
//         {selectedCAIncentive && (
//           <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-900">Incentive Details</h3>
//                   <p className="text-sm text-slate-600">Current performance and earnings</p>
//                 </div>
//                 <div className="flex items-center gap-6">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-blue-600">₹{selectedCAIncentive.incentive_amount}</div>
//                     <div className="text-sm text-slate-600">Current Incentive</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-green-600">{selectedCAIncentive.total_clients_completed}</div>
//                     <div className="text-sm text-slate-600">Completed Clients</div>
//                   </div>
//                   {selectedCAIncentive.badge && (
//                     <Badge variant="outline" className="text-sm px-3 py-1 bg-white">
//                       🏅 {selectedCAIncentive.badge}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Clients List */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle>{selectedCA === "all" ? "All Clients" : "Clients for selected CA"}</CardTitle>
//               <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
//                 <DialogTrigger asChild>
//                   <Button><Plus className="h-4 w-4 mr-2" />Add New Client</Button>
//                 </DialogTrigger>
//                 <DialogContent>
//                   <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
//                   <NewClientForm
//                     caOptions={teamMembers}  
//                     onSubmit={(data) => {
//                       const newClient = {
//                         id: Date.now().toString(),
//                         ...data,
//                         date_assigned: new Date().toISOString().split("T")[0],
//                         last_update: new Date().toISOString().split("T")[0],
//                       }
//                       setClients((prev) => [...prev, newClient])
//                       setNewClientOpen(false)
//                     }}
//                   />
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {filteredClients.map((client) => (
//                 <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
//                   <div className="flex items-center gap-3">
//                     {client.status === "Started" && client.jobs_applied === 0 && (
//                       <AlertTriangle className="h-5 w-5 text-red-500" />
//                     )}
//                     <div>
//                       <h3 className="font-semibold text-slate-900">{client.name}</h3>
//                       <p className="text-sm text-slate-600">{client.date_assigned}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-8 text-center">
//                     <div><div className="text-lg font-bold text-blue-600">{client.jobs_applied}</div><div className="text-xs text-slate-600">Jobs Applied</div></div>
//                     <div><div className="text-lg font-bold text-blue-600">{client.emails_submitted}</div><div className="text-xs text-slate-600">Emails Received</div></div>
//                     <Badge
//                       variant={
//                         client.status === "Completed"
//                           ? "default"
//                           : client.status === "Started"
//                           ? "secondary"
//                           : "destructive"
//                       }
//                     >
//                       {client.status}
//                     </Badge>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

// "use client"

// import { useState, useEffect } from "react"
// import { supabase } from "@/lib/supabaseClient"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Calendar, Plus, AlertTriangle } from "lucide-react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { NewClientForm } from "./new-client-form"

// interface TeamLeadDashboardProps {
//   user: any
//   onLogout: () => void
// }

// export function TeamLeadDashboard({ user, onLogout }: TeamLeadDashboardProps) {
//   const [teamMembers, setTeamMembers] = useState<any[]>([])
//   const [clients, setClients] = useState<any[]>([])
//   const [incentives, setIncentives] = useState<any[]>([])
//   const [selectedCA, setSelectedCA] = useState("all")
//   const [newClientOpen, setNewClientOpen] = useState(false)
//   const [dateTo] = useState(new Date().toISOString().split("T")[0])

//   const fetchClients = async () => {
//     const memberIds = teamMembers.map((m) => m.id)
//     if (memberIds.length > 0) {
//       const { data, error } = await supabase.from("clients").select("*").in("assigned_ca_id", memberIds)
//       if (!error && data) setClients(data)
//     }
//   }

//   useEffect(() => {
//     const fetchTeamData = async () => {
//       const { data: teams } = await supabase.from("teams").select("id").eq("lead_id", user.id)
//       const teamIds = teams?.map((t) => t.id) || []

//       const { data: members } = await supabase
//         .from("users")
//         .select("*")
//         .in("team_id", teamIds)
//         .neq("role", "Team Lead")

//       setTeamMembers(members || [])
//       const memberIds = members?.map((m) => m.id) || []
//       if (memberIds.length > 0) {
//         const { data: clientData } = await supabase.from("clients").select("*").in("assigned_ca_id", memberIds)
//         setClients(clientData || [])
//       }

//       const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
//       const { data: incentiveData } = await supabase
//         .from("incentives")
//         .select("*")
//         .in("user_id", memberIds)
//         .eq("month", startOfMonth)
//       setIncentives(incentiveData || [])
//     }
//     fetchTeamData()
//   }, [user.id])

//   const caOptions = [{ value: "all", label: "All Clients" }, ...teamMembers.map((m) => ({ value: m.id, label: m.name }))]

//   const filteredClients = selectedCA === "all" ? clients : clients.filter((c) => c.assigned_ca_id === selectedCA)

//   const stats = {
//     totalClients: filteredClients.length,
//     startedClients: filteredClients.filter((c) => c.status === "Started").length,
//     pausedClients: filteredClients.filter((c) => c.status === "Paused").length,
//     completedClients: filteredClients.filter((c) => c.status === "Completed").length,
//     missingUpdates: filteredClients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length,
//   }

//   const selectedCAIncentive = selectedCA !== "all" ? incentives.find((i) => i.user_id === selectedCA) : null

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">Team Lead Dashboard</h1>
//             <p className="text-slate-600">Welcome back, {user.name}!</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         <div className="flex gap-4 mb-6">
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Select Client</label>
//             <Select value={selectedCA} onValueChange={setSelectedCA}>
//               <SelectTrigger className="w-48">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 {caOptions.map((option) => (
//                   <SelectItem key={option.value} value={option.value}>
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
//             <div className="flex items-center gap-2">
//               <div className="flex items-center gap-1 px-3 py-1 bg-white border rounded">
//                 <Calendar className="h-4 w-4" />
//                 <span className="text-sm text-slate-600">{dateTo}</span>
//               </div>
//               <Button variant="outline" size="sm">
//                 Today
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-5 gap-4 mb-6">
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.startedClients}</div><div className="text-sm text-slate-600">Started</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{stats.pausedClients}</div><div className="text-sm text-slate-600">Paused</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.completedClients}</div><div className="text-sm text-slate-600">Completed</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{stats.missingUpdates}</div><div className="text-sm text-slate-600">Missing Updates</div></CardContent></Card>
//         </div>

//         {selectedCAIncentive && (
//           <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-slate-900">Incentive Details</h3>
//                   <p className="text-sm text-slate-600">Current performance and earnings</p>
//                 </div>
//                 <div className="flex items-center gap-6">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-blue-600">₹{selectedCAIncentive.incentive_amount}</div>
//                     <div className="text-sm text-slate-600">Current Incentive</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-green-600">{selectedCAIncentive.total_clients_completed}</div>
//                     <div className="text-sm text-slate-600">Completed Clients</div>
//                   </div>
//                   {selectedCAIncentive.badge && (
//                     <Badge variant="outline" className="text-sm px-3 py-1 bg-white">
//                       🏅 {selectedCAIncentive.badge}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle>{selectedCA === "all" ? "All Clients" : "Clients for selected CA"}</CardTitle>
//               <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
//                 <DialogTrigger asChild>
//                   <Button><Plus className="h-4 w-4 mr-2" />Add New Client</Button>
//                 </DialogTrigger>
//                 <DialogContent>
//                   <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
//                   <NewClientForm fetchClients={fetchClients} />
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {filteredClients.map((client) => (
//                 <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
//                   <div className="flex items-center gap-3">
//                     {client.status === "Started" && client.jobs_applied === 0 && <AlertTriangle className="h-5 w-5 text-red-500" />}
//                     <div>
//                       <h3 className="font-semibold text-slate-900">{client.name}</h3>
//                       <p className="text-sm text-slate-600">{client.date_assigned}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-8 text-center">
//                     <div><div className="text-lg font-bold text-blue-600">{client.jobs_applied}</div><div className="text-xs text-slate-600">Jobs Applied</div></div>
//                     <div><div className="text-lg font-bold text-blue-600">{client.emails_submitted}</div><div className="text-xs text-slate-600">Emails Received</div></div>
//                     <Badge variant={client.status === "Completed" ? "default" : client.status === "Started" ? "secondary" : "destructive"}>{client.status}</Badge>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NewClientForm } from "./new-client-form"

interface TeamLeadDashboardProps {
  user: any
  onLogout: () => void
}

type CAUser = {
  id: string
  name: string
  email: string
  designation?: string | null
  team_id?: string | null
  role?: string | null
  isactive?: boolean | null
}

type ClientRow = {
  id: string
  name: string | null
  email: string
  status: string | null
  assigned_ca_id: string | null
  date_assigned: string | null
  emails_submitted: number | null
  jobs_applied: number | null
  work_done_by?: string | null
  date?: string | null
}

export function TeamLeadDashboard({ user, onLogout }: TeamLeadDashboardProps) {
  // Filters & UI
  const [selectedCA, setSelectedCA] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>(new Date().toISOString().split("T")[0])
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split("T")[0])
  const [newClientOpen, setNewClientOpen] = useState(false)

  // Data
  const [teamCAs, setTeamCAs] = useState<CAUser[]>([])
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(false)

  // CA accordion state
  const [expandedCA, setExpandedCA] = useState<string | null>(null)
  const [caClients, setCaClients] = useState<Record<string, ClientRow[]>>({})

  // Per-CA “today” snapshot (emails, jobs, status)
  const [caPerformance, setCaPerformance] = useState<Record<string, any>>({})

  // --- Fetch TL's teams → TL's CAs ---
  useEffect(() => {
    const fetchCAsForTL = async () => {
      setLoading(true)
      // Get team IDs for this Team Lead
      const { data: teams, error: teamsErr } = await supabase
        .from("teams")
        .select("id")
        .eq("lead_id", user.id)

      if (teamsErr) {
        console.error("Error fetching TL teams:", teamsErr)
        setTeamCAs([])
        setLoading(false)
        return
      }

      const teamIds = (teams || []).map((t: any) => t.id)
      if (teamIds.length === 0) {
        setTeamCAs([])
        setLoading(false)
        return
      }

      // Get CAs in those teams (only active)
      const { data: cas, error: casErr } = await supabase
        .from("users")
        .select("id, name, email, designation, team_id, role, isactive")
        .in("team_id", teamIds)
        .in("role", ["CA", "Junior CA"])
        .eq("isactive", true)

      if (casErr) {
        console.error("Error fetching team CAs:", casErr)
        setTeamCAs([])
        setLoading(false)
        return
      }

      setTeamCAs(cas || [])
      setLoading(false)
    }

    fetchCAsForTL()
  }, [user.id])

  // --- Fetch clients for KPIs (all TL CAs, filtered by date_assigned) ---
  useEffect(() => {
    const fetchClientsForKPIs = async () => {
      if (!teamCAs.length) {
        setClients([])
        return
      }
      setLoading(true)
      const caIds = teamCAs.map((c) => c.id)

      // Pull clients assigned to these CAs, constrained by assignment date
      let query = supabase
        .from("clients")
        .select("*")
        .in("assigned_ca_id", caIds)

      if (dateFrom) query = query.gte("date_assigned", dateFrom)
      if (dateTo) query = query.lte("date_assigned", dateTo)

      const { data, error } = await query
      if (error) {
        console.error("Error fetching clients for KPIs:", error)
        setClients([])
      } else {
        setClients(data || [])
      }
      setLoading(false)
    }
    fetchClientsForKPIs()
  }, [teamCAs, dateFrom, dateTo])

  // --- Build per-CA "today" snapshot using clients.work_done_by + date === today ---
  useEffect(() => {
    const fetchTodayPerformance = async () => {
      if (!teamCAs.length) {
        setCaPerformance({})
        return
      }
      const caIds = teamCAs.map((c) => c.id)
      const today = new Date().toISOString().split("T")[0]

      const { data: logs, error } = await supabase
        .from("clients")
        .select("assigned_ca_id, work_done_by, emails_submitted, jobs_applied, status, date")
        .in("work_done_by", caIds)
        .eq("date", today)

      if (error) {
        console.error("Error fetching today's CA performance:", error)
        setCaPerformance({})
        return
      }

      const perf: Record<string, any> = {}
      for (const ca of teamCAs) {
        const caLogs = (logs || []).filter((l) => l.work_done_by === ca.id)
        if (caLogs.length > 0) {
          const totalEmails = caLogs.reduce((sum, l) => sum + (l.emails_submitted || 0), 0)
          const totalJobs = caLogs.reduce((sum, l) => sum + (l.jobs_applied || 0), 0)
          const lastStatus = caLogs[caLogs.length - 1].status || "Started"
          perf[ca.id] = { ...ca, emails_submitted: totalEmails, jobs_applied: totalJobs, status: lastStatus }
        } else {
          perf[ca.id] = { ...ca, emails_submitted: 0, jobs_applied: 0, status: "Not Yet Started" }
        }
      }
      setCaPerformance(perf)
    }
    fetchTodayPerformance()
  }, [teamCAs])

  // --- Expand a CA to view their clients (in current date range by assignment) ---
  const fetchClientsForCA = async (caId: string) => {
    // Toggle if already loaded
    if (expandedCA === caId && caClients[caId]) {
      setExpandedCA(null)
      return
    }
    // Load if not cached or different CA
    let query = supabase
      .from("clients")
      .select("*")
      .eq("assigned_ca_id", caId)

    if (dateFrom) query = query.gte("date_assigned", dateFrom)
    if (dateTo) query = query.lte("date_assigned", dateTo)

    const { data, error } = await query
    if (error) {
      console.error("Error fetching clients for CA:", error)
      return
    }
    setCaClients((prev) => ({ ...prev, [caId]: data || [] }))
    setExpandedCA(caId)
  }

  // --- Options for CA filter ---
  const caOptions = useMemo(
    () => [{ value: "all", label: "All CAs" }, ...teamCAs.map((m) => ({ value: m.id, label: m.name }))],
    [teamCAs]
  )

  // --- KPI calculations (respect selected CA filter) ---
  const filteredClients: ClientRow[] = useMemo(() => {
    if (selectedCA === "all") return clients
    return clients.filter((c) => c.assigned_ca_id === selectedCA)
  }, [clients, selectedCA])

  const stats = useMemo(() => {
    const totalClients = filteredClients.length
    const submitted = filteredClients.filter((c) => c.status === "Completed").length
    const missedToday = filteredClients.filter((c) => c.status === "Started" && (c.jobs_applied || 0) === 0).length
    const submissionRate = totalClients > 0 ? Math.round((submitted / totalClients) * 100) : 0

    const totalCAs = selectedCA === "all" ? teamCAs.length : 1

    return { totalCAs, totalClients, submitted, missedToday, submissionRate }
  }, [filteredClients, selectedCA, teamCAs.length])

  // Helper to refresh the KPI clients after adding a client
  const refreshClients = async () => {
    if (!teamCAs.length) return
    const caIds = teamCAs.map((c) => c.id)
    let query = supabase.from("clients").select("*").in("assigned_ca_id", caIds)
    if (dateFrom) query = query.gte("date_assigned", dateFrom)
    if (dateTo) query = query.lte("date_assigned", dateTo)
    const { data, error } = await query
    if (!error && data) setClients(data)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team Lead Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Select CA</label>
            <Select value={selectedCA} onValueChange={setSelectedCA}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All CAs" />
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

          <div className="flex items-center gap-2">
            <Label className="text-sm">From:</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
            <Label className="text-sm">To:</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0]
                setDateFrom(today)
                setDateTo(today)
              }}
            >
              Today
            </Button>
          </div>

          {/* Optional: allow TL to add new clients (assign to one of their CAs) */}
          <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <NewClientForm fetchClients={refreshClients} />
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCAs}</div>
              <div className="text-sm text-slate-600">Total CAs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div>
              <div className="text-sm text-slate-600">Total Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
              <div className="text-sm text-slate-600">Submitted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.missedToday}</div>
              <div className="text-sm text-slate-600">Missed Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.submissionRate}%</div>
              <div className="text-sm text-slate-600">Submission Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* CA List (accordion) */}
        {loading && (
          <div className="text-center my-4 text-blue-600 font-semibold text-lg">Loading...</div>
        )}

        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCA === "all" ? "Career Associates" : "Selected CA"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.values(caPerformance)
                  .filter((ca: any) => selectedCA === "all" || ca.id === selectedCA)
                  .map((ca: any) => (
                    <div key={ca.id} className="flex flex-col border rounded-lg bg-white">
                      {/* CA Summary Row */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => fetchClientsForCA(ca.id)}
                      >
                        <div>
                          <h3 className="font-semibold">{ca.name}</h3>
                          <p className="text-sm text-slate-600">
                            {ca.designation || "CA"} • {ca.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:gap-4">
                          <Badge variant="secondary">Emails: {ca.emails_submitted}</Badge>
                          <Badge variant="secondary">Jobs: {ca.jobs_applied}</Badge>
                          <Badge variant={ca.status === "Completed" ? "default" : "secondary"}>
                            {ca.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Expanded Clients for this CA */}
                      {expandedCA === ca.id && (
                        <div className="p-4 bg-slate-50 border-t">
                          {caClients[ca.id]?.length ? (
                            <ul className="space-y-2">
                              {caClients[ca.id].map((client) => (
                                <li key={client.id} className="flex justify-between p-2 bg-white rounded border">
                                  <div>
                                    <p className="font-medium">{client.name}</p>
                                    <p className="text-sm text-slate-600">{client.email}</p>
                                    <p className="text-xs text-slate-500">
                                      Assigned: {client.date_assigned || "-"}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <Badge>{client.status || "Not Started"}</Badge>
                                    <Badge variant="secondary">Emails: {client.emails_submitted || 0}</Badge>
                                    <Badge variant="secondary">Jobs: {client.jobs_applied || 0}</Badge>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-500">No clients in this range.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
