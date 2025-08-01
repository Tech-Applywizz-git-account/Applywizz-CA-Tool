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

  const fetchClients = async () => {
    const memberIds = teamMembers.map((m) => m.id)
    if (memberIds.length > 0) {
      const { data, error } = await supabase.from("clients").select("*").in("assigned_ca_id", memberIds)
      if (!error && data) setClients(data)
    }
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

  const caOptions = [{ value: "all", label: "All CAs" }, ...teamMembers.map((m) => ({ value: m.id, label: m.name }))]

  const filteredClients = selectedCA === "all" ? clients : clients.filter((c) => c.assigned_ca_id === selectedCA)

  const stats = {
    totalClients: filteredClients.length,
    startedClients: filteredClients.filter((c) => c.status === "Started").length,
    pausedClients: filteredClients.filter((c) => c.status === "Paused").length,
    completedClients: filteredClients.filter((c) => c.status === "Completed").length,
    missingUpdates: filteredClients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length,
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
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
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

        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.startedClients}</div><div className="text-sm text-slate-600">Started</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{stats.pausedClients}</div><div className="text-sm text-slate-600">Paused</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.completedClients}</div><div className="text-sm text-slate-600">Completed</div></CardContent></Card>
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
                    <div><div className="text-lg font-bold text-blue-600">{client.jobs_applied}</div><div className="text-xs text-slate-600">Jobs Applied</div></div>
                    <div><div className="text-lg font-bold text-blue-600">{client.emails_submitted}</div><div className="text-xs text-slate-600">Emails Received</div></div>
                    <Badge variant={client.status === "Completed" ? "default" : client.status === "Started" ? "secondary" : "destructive"}>{client.status}</Badge>
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
