// "use client"

// import type React from "react"

// // import { useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Label } from "@/components/ui/label"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { Users, UserCheck, TrendingUp, Award, Calendar, User } from "lucide-react"
// import { supabase } from '@/lib/supabaseClient'
// import { useEffect, useState } from 'react'



// // Mock data for team members
// // const mockTeamMembers = [
// //   {
// //     id: "ca1",
// //     name: "Priya Sharma",
// //     email: "priya@applywizz.com",
// //     role: "Junior CA",
// //     salary: 6000,
// //     designation: "Junior CA",
// //   },
// //   {
// //     id: "ca2",
// //     name: "Arjun Patel",
// //     email: "arjun@applywizz.com",
// //     role: "CA",
// //     salary: 8000,
// //     designation: "CA",
// //   },
// //   {
// //     id: "ca3",
// //     name: "Sneha Kumar",
// //     email: "sneha@applywizz.com",
// //     role: "Junior CA",
// //     salary: 6000,
// //     designation: "Junior CA",
// //   },
// // ]

// // Mock clients data
// // const mockClients = [
// //   {
// //     id: "1",
// //     name: "John Miller",
// //     email: "john@example.com",
// //     status: "Started",
// //     assignedCA: "priya@applywizz.com",
// //     emailsRequired: 50,
// //     emailsSubmitted: 25,
// //     jobsApplied: 12,
// //     dateAssigned: "2024-01-15",
// //     lastUpdate: "2024-01-28",
// //   },
// //   {
// //     id: "2",
// //     name: "Riya Patel",
// //     email: "riya@example.com",
// //     status: "Completed",
// //     assignedCA: "priya@applywizz.com",
// //     emailsRequired: 40,
// //     emailsSubmitted: 40,
// //     jobsApplied: 20,
// //     dateAssigned: "2024-01-10",
// //     lastUpdate: "2024-01-29",
// //   },
// //   {
// //     id: "3",
// //     name: "Ahmed Khan",
// //     email: "ahmed@example.com",
// //     status: "Paused",
// //     assignedCA: "priya@applywizz.com",
// //     emailsRequired: 60,
// //     emailsSubmitted: 15,
// //     jobsApplied: 5,
// //     dateAssigned: "2024-01-20",
// //     lastUpdate: "2024-01-25",
// //   },
// //   {
// //     id: "4",
// //     name: "Alice Brown",
// //     email: "alice@example.com",
// //     status: "Started",
// //     assignedCA: "arjun@applywizz.com",
// //     emailsRequired: 45,
// //     emailsSubmitted: 30,
// //     jobsApplied: 15,
// //     dateAssigned: "2024-01-12",
// //     lastUpdate: "2024-01-29",
// //   },
// //   {
// //     id: "5",
// //     name: "Diego Gomez",
// //     email: "diego@example.com",
// //     status: "Completed",
// //     assignedCA: "arjun@applywizz.com",
// //     emailsRequired: 35,
// //     emailsSubmitted: 35,
// //     jobsApplied: 18,
// //     dateAssigned: "2024-01-08",
// //     lastUpdate: "2024-01-28",
// //   },
// //   {
// //     id: "6",
// //     name: "Priya Singh",
// //     email: "priyasingh@example.com",
// //     status: "Not Started",
// //     assignedCA: "sneha@applywizz.com",
// //     emailsRequired: 55,
// //     emailsSubmitted: 0,
// //     jobsApplied: 0,
// //     dateAssigned: "2024-01-25",
// //     lastUpdate: "2024-01-25",
// //   },
// // ]

// interface CADashboardProps {
//   user: any
//   onLogout: () => void
// }

// export function CADashboard({ user, onLogout }: CADashboardProps) {
//   const [currentView, setCurrentView] = useState<"myself" | "onbehalf">("myself")
//   const [selectedCA, setSelectedCA] = useState<string>("")
//   // const [clients, setClients] = useState(mockClients)
//   const [selectedClient, setSelectedClient] = useState<any>(null)
//   const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
//   const [profileOpen, setProfileOpen] = useState(false)
//   const [trackingMode, setTrackingMode] = useState<"daily" | "monthly">("daily")
//   const [dateFrom, setDateFrom] = useState("2024-01-29")
//   const [dateTo, setDateTo] = useState("2024-01-29")

//   const [clients, setClients] = useState<any[]>([])
//   const [incentive, setIncentive] = useState<any>(null)

//   useEffect(() => {
//     const fetchData = async () => {
//       const userId = user.id // from logged-in user passed as prop

//       // Fetch clients from Supabase
//       const { data: clientData, error: clientError } = await supabase
//         .from('clients')
//         .select('*')
//         .eq('assigned_ca_id', userId)

//       if (!clientError) setClients(clientData || [])

//       // Fetch incentive for current month
//       const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
//       const { data: incentiveData, error: incentiveError } = await supabase
//         .from('incentives')
//         .select('*')
//         .eq('user_id', userId)
//         .eq('month', startOfMonth)

//       if (!incentiveError && incentiveData.length > 0) setIncentive(incentiveData[0])
//     }

//     fetchData()
//   }, [user.id])



//   // Calculate performance metrics
//   const calculateMetrics = (caEmail: string) => {
//     // const caClients = clients.filter((c) => c.assignedCA === caEmail)
//     const caClients = clients.filter((c) => c.assigned_ca_id === user.id)
//     const completedClients = caClients.filter((c) => c.status === "Completed").length
//     const totalEmailsRequired = caClients.reduce((sum, c) => sum + c.emailsRequired, 0)
//     const totalEmailsSubmitted = caClients.reduce((sum, c) => sum + c.emailsSubmitted, 0)

//     let incentive = 0
//     let badge = ""

//     // Incentive calculation logic
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

//     return {
//       clientsAssigned: caClients.length,
//       completedClients,
//       emailsRequired: totalEmailsRequired,
//       emailsSubmitted: totalEmailsSubmitted,
//       incentive,
//       badge,
//       progress: totalEmailsRequired > 0 ? (totalEmailsSubmitted / totalEmailsRequired) * 100 : 0,
//     }
//   }

//   const handleStatusUpdate = (
//     clientId: string,
//     newStatus: string,
//     reason?: string,
//     emailsSent?: number,
//     jobsApplied?: number,
//   ) => {
//     setClients((prev) =>
//       prev.map((client) =>
//         client.id === clientId
//           ? {
//             ...client,
//             status: newStatus,
//             emailsSubmitted: emailsSent !== undefined ? emailsSent : client.emailsSubmitted,
//             jobsApplied: jobsApplied !== undefined ? jobsApplied : client.jobsApplied,
//             lastUpdate: new Date().toISOString().split("T")[0],
//           }
//           : client,
//       ),
//     )
//     setStatusUpdateOpen(false)
//   }

//   const currentCAEmail = currentView === "myself" ? user.email : selectedCA
//   const currentCAData = currentView === "myself" ? user : mockTeamMembers.find((m) => m.email === selectedCA)
//   const metrics = calculateMetrics(currentCAEmail)

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">🧭 ApplyWizz CA Performance Tracker</h1>
//             <p className="text-slate-600">Welcome back, {user.name}!</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
//               <DialogTrigger asChild>
//                 <Button variant="outline">
//                   <User className="h-4 w-4 mr-2" />
//                   Profile
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Profile Information</DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                   <div>
//                     <Label className="text-sm font-medium">Name</Label>
//                     <p className="text-lg">{user.name}</p>
//                   </div>
//                   <div>
//                     <Label className="text-sm font-medium">Email</Label>
//                     <p className="text-lg">{user.email}</p>
//                   </div>
//                   <div>
//                     <Label className="text-sm font-medium">Role</Label>
//                     <p className="text-lg">{user.role}</p>
//                   </div>
//                   <div>
//                     <Label className="text-sm font-medium">Fixed Salary</Label>
//                     <p className="text-lg font-bold text-green-600">₹6,000</p>
//                   </div>
//                 </div>
//               </DialogContent>
//             </Dialog>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Enhanced Calendar Section */}
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Calendar className="h-5 w-5" />
//               Calendar & Tracking
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="p-4">
//             <div className="flex flex-wrap gap-4 items-center">
//               <div className="flex gap-2">
//                 <Button
//                   variant={trackingMode === "daily" ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setTrackingMode("daily")}
//                 >
//                   Daily Tracking
//                 </Button>
//                 <Button
//                   variant={trackingMode === "monthly" ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setTrackingMode("monthly")}
//                 >
//                   Monthly Tracking
//                 </Button>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Label className="text-sm">From:</Label>
//                 <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
//                 <Label className="text-sm">To:</Label>
//                 <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
//                 <Button variant="outline" size="sm">
//                   Apply Filter
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Toggle View */}
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <UserCheck className="h-5 w-5" />
//               Work Mode
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex gap-4 items-center">
//               <Button
//                 variant={currentView === "myself" ? "default" : "outline"}
//                 onClick={() => setCurrentView("myself")}
//               >
//                 🌟 Myself
//               </Button>
//               <Button
//                 variant={currentView === "onbehalf" ? "default" : "outline"}
//                 onClick={() => setCurrentView("onbehalf")}
//               >
//                 👥 On Behalf of Someone
//               </Button>

//               {currentView === "onbehalf" && (
//                 <div className="flex items-center gap-2">
//                   <Select value={selectedCA} onValueChange={setSelectedCA}>
//                     <SelectTrigger className="w-48">
//                       <SelectValue placeholder="Choose team member" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {mockTeamMembers.map((member) => (
//                         <SelectItem key={member.id} value={member.email}>
//                           {member.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <Badge variant="secondary">Performance credit goes to selected CA</Badge>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Dashboard Split View */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           {/* Left Card: Client List */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Users className="h-5 w-5" />
//                 Client List{" "}
//                 {currentView === "onbehalf" &&
//                   selectedCA &&
//                   `- ${mockTeamMembers.find((m) => m.email === selectedCA)?.name}`}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Client Name</TableHead>
//                     <TableHead>Email</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Action</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {clients
//                     .filter((c) => c.assignedCA === currentCAEmail)
//                     .map((client) => (
//                       <TableRow key={client.id}>
//                         <TableCell className="font-medium">{client.name}</TableCell>
//                         <TableCell>{client.email}</TableCell>
//                         <TableCell>
//                           <Badge
//                             variant={
//                               client.status === "Completed"
//                                 ? "default"
//                                 : client.status === "Started"
//                                   ? "secondary"
//                                   : client.status === "Paused"
//                                     ? "destructive"
//                                     : "outline"
//                             }
//                           >
//                             {client.status}
//                           </Badge>
//                         </TableCell>
//                         <TableCell>
//                           <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
//                             <DialogTrigger asChild>
//                               <Button size="sm" variant="outline" onClick={() => setSelectedClient(client)}>
//                                 Update Status
//                               </Button>
//                             </DialogTrigger>
//                             <DialogContent className="bg-white">
//                               <DialogHeader>
//                                 <DialogTitle>Update Client Status</DialogTitle>
//                               </DialogHeader>
//                               <StatusUpdateForm client={selectedClient} onUpdate={handleStatusUpdate} />
//                             </DialogContent>
//                           </Dialog>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>

//           {/* Right Card: Performance Snapshot */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <TrendingUp className="h-5 w-5" />
//                 Performance Snapshot{" "}
//                 {currentView === "onbehalf" &&
//                   selectedCA &&
//                   `- ${mockTeamMembers.find((m) => m.email === selectedCA)?.name}`}
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label className="text-sm text-slate-600">Base Salary</Label>
//                   <p className="text-2xl font-bold text-green-600">
//                     ₹{currentCAData?.salary?.toLocaleString() || "6,000"}
//                   </p>
//                 </div>
//                 <div>
//                   <Label className="text-sm text-slate-600">Designation</Label>
//                   <p className="text-lg font-semibold">{currentCAData?.designation || "Junior CA"}</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label className="text-sm text-slate-600">Clients Assigned</Label>
//                   <p className="text-xl font-bold">{metrics.clientsAssigned}</p>
//                 </div>
//                 <div>
//                   <Label className="text-sm text-slate-600">Completed</Label>
//                   <p className="text-xl font-bold text-green-600">{metrics.completedClients}</p>
//                 </div>
//               </div>

//               <div>
//                 <Label className="text-sm text-slate-600">Email Progress</Label>
//                 <div className="flex items-center gap-2 mt-1">
//                   <Progress value={metrics.progress} className="flex-1" />
//                   <span className="text-sm font-medium">
//                     {metrics.emailsSubmitted}/{metrics.emailsRequired}
//                   </span>
//                 </div>
//               </div>

//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <Label className="text-sm text-slate-600">Incentive Calculation</Label>
//                 <div className="mt-2 space-y-1 text-sm">
//                   <p>• 3 clients → ₹2,000 (Tier 1)</p>
//                   <p>• 4 clients → ₹4,500 (Tier 2)</p>
//                   <p>• 5 clients → ₹8,000 (Tier 2)</p>
//                   <p>• 6+ clients → ₹11,000 + Zero Error Bonus (Top Performer)</p>
//                 </div>
//                 <div className="mt-3 pt-3 border-t border-blue-200">
//                   <p className="text-lg font-bold text-blue-600">
//                     Current Incentive: ₹{incentive ? incentive.incentive_amount : 0}
//                   </p>
//                   <p className="text-sm text-slate-600">
//                     Badge: {incentive ? incentive.badge : 'No Badge'}
//                   </p>

//                 </div>
//               </div>

//               {metrics.badge && (
//                 <div className="flex items-center gap-2">
//                   <Award className="h-5 w-5 text-yellow-500" />
//                   <Badge variant="secondary" className="text-lg px-3 py-1">
//                     🏅 {metrics.badge}
//                   </Badge>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

// // Status Update Form Component
// function StatusUpdateForm({
//   client,
//   onUpdate,
// }: { client: any; onUpdate: (id: string, status: string, reason?: string, emails?: number, jobs?: number) => void }) {
//   const [status, setStatus] = useState(client?.status || "")
//   const [reason, setReason] = useState("")
//   const [emailsSent, setEmailsSent] = useState(client?.emailsSubmitted?.toString() || "")
//   const [jobsApplied, setJobsApplied] = useState(client?.jobsApplied?.toString() || "")

//   if (!client) return null

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onUpdate(
//       client.id,
//       status,
//       reason,
//       emailsSent ? Number.parseInt(emailsSent) : undefined,
//       jobsApplied ? Number.parseInt(jobsApplied) : undefined,
//     )
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <Label className="text-sm font-medium">Client: {client.name}</Label>
//       </div>

//       <div>
//         <Label htmlFor="status" className="text-sm font-medium">
//           New Status
//         </Label>
//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger className="w-full mt-1">
//             <SelectValue placeholder="Select status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Not Started">Not Started</SelectItem>
//             <SelectItem value="Started">Started</SelectItem>
//             <SelectItem value="Paused">Paused</SelectItem>
//             <SelectItem value="Completed">Completed</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {(status === "Paused" || status === "Completed") && (
//         <>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="emails" className="text-sm font-medium">
//                 Number of Emails Sent
//               </Label>
//               <Input
//                 id="emails"
//                 type="number"
//                 value={emailsSent}
//                 onChange={(e) => setEmailsSent(e.target.value)}
//                 placeholder="Enter email count"
//                 className="mt-1"
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="jobs" className="text-sm font-medium">
//                 Number of Jobs Applied
//               </Label>
//               <Input
//                 id="jobs"
//                 type="number"
//                 value={jobsApplied}
//                 onChange={(e) => setJobsApplied(e.target.value)}
//                 placeholder="Enter job applications"
//                 className="mt-1"
//                 required
//               />
//             </div>
//           </div>

//           {status === "Paused" && (
//             <div>
//               <Label htmlFor="reason" className="text-sm font-medium">
//                 Reason for Pause
//               </Label>
//               <Textarea
//                 id="reason"
//                 value={reason}
//                 onChange={(e) => setReason(e.target.value)}
//                 placeholder="Enter reason for pausing..."
//                 className="mt-1"
//                 rows={3}
//               />
//             </div>
//           )}
//         </>
//       )}

//       <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
//         Update Status
//       </Button>
//     </form>
//   )
// }


"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, UserCheck, TrendingUp, Award, Calendar, User } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"

// ---------------------- REMOVED MOCK DATA ----------------------
// Removed mockTeamMembers and mockClients
// --------------------------------------------------------------

interface CADashboardProps {
  user: any
  onLogout: () => void
}

export function CADashboard({ user, onLogout }: CADashboardProps) {
  const [currentView, setCurrentView] = useState<"myself" | "onbehalf">("myself")
  const [selectedCA, setSelectedCA] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [trackingMode, setTrackingMode] = useState<"daily" | "monthly">("daily")
  const today = new Date().toISOString().split("T")[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)


  // ---------------------- NEW STATES FOR DB DATA ----------------------
  const [clients, setClients] = useState<any[]>([]) // fetch from Supabase
  const [incentive, setIncentive] = useState<any>(null) // fetch from Supabase
  // -------------------------------------------------------------------
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  // const [selectedCA, setSelectedCA] = useState<string>(user.id)
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [Loading, setLoading] = useState<boolean>(false);


  // ---------------------- FETCH DATA FROM SUPABASE ----------------------
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const userId = user.id // passed as prop from login

  //     // Fetch clients assigned to this CA
  //     const { data: clientData, error: clientError } = await supabase
  //       .from("clients")
  //       .select("*")
  //       .eq("assigned_ca_id", userId)

  //     if (!clientError) setClients(clientData || [])

  //     // Fetch incentive for current month
  //     const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  //     const { data: incentiveData, error: incentiveError } = await supabase
  //       .from("incentives")
  //       .select("*")
  //       .eq("user_id", userId)
  //       .eq("month", startOfMonth)

  //     if (!incentiveError && incentiveData.length > 0) setIncentive(incentiveData[0])
  //   }

  //   fetchData()
  // }, [user.id])
  useEffect(() => {
    const fetchData = async () => {
      const userId = user.id;

      // 1. Fetch clients assigned to this CA
      setLoading(true);
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("assigned_ca_id", userId);
      if (!clientError) setClients(clientData || []);
      setLoading(false);

      // 2. Fetch incentive
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: incentiveData, error: incentiveError } = await supabase
        .from("incentives")
        .select("*")
        .eq("user_id", userId)
        .eq("month", startOfMonth);
      if (!incentiveError && incentiveData.length > 0) setIncentive(incentiveData[0]);

      // 3. Fetch team members from same team_id
      const { data: teamData, error: teamError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("team_id", user.team_id)
        .neq("id", user.id); // Optional: Exclude self
      if (!teamError) setTeamMembers(teamData || []);
    };

    fetchData();
  }, [user.id, user.team_id]);

  useEffect(() => {
    const fetchClientsForSelectedCA = async () => {
      // const caId = selectedCA || user.id // fallback to self
      const caId =
        currentView === "myself" ? user.id : selectedCA || user.id


      const { data: clientData, error } = await supabase
        .from("clients")
        .select("*")
        .eq("assigned_ca_id", caId)

      if (!error) setClients(clientData || [])
    }

    fetchClientsForSelectedCA()
  }, [selectedCA, currentView])

  useEffect(() => {
    const fetchBaseSalary = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('base_salary')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setBaseSalary(data.base_salary || 0);
      }
    };
    fetchBaseSalary();
  }, [user.id]);


  // ----------------------------------------------------------------------

  // const handleStatusUpdate = (
  //   clientId: string,
  //   newStatus: string,
  //   reason?: string,
  //   emailsSent?: number,
  //   jobsApplied?: number,
  // ) => {
  //   setClients((prev) =>
  //     prev.map((client) =>
  //       client.id === clientId
  //         ? {
  //             ...client,
  //             status: newStatus,
  //             emails_submitted: emailsSent !== undefined ? emailsSent : client.emails_submitted,
  //             jobs_applied: jobsApplied !== undefined ? jobsApplied : client.jobs_applied,
  //             last_update: new Date().toISOString().split("T")[0],
  //           }
  //         : client,
  //     ),
  //   )
  //   setStatusUpdateOpen(false)
  // }
  const handleStatusUpdate = async (
    clientId: string,
    newStatus: string,
    reason?: string,
    emailsSent?: number,
    jobsApplied?: number,
  ) => {
    // 1) Update client in Supabase
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        status: newStatus,
        emails_submitted: emailsSent ?? 0,
        jobs_applied: jobsApplied ?? 0,
        last_update: new Date().toISOString().split("T")[0],
        work_done_by: user.id,
        remarks: reason || "",
      })
      .eq("id", clientId)

    if (updateError) {
      alert(`Error updating client: ${updateError.message}`)
      return
    }
    if (newStatus === 'Started') {
      // 2) Update clients table in Supabase
      const { error: logError } = await supabase.from("clients").update({
        start_time: new Date().toISOString(),
      }).eq("id", clientId)
      if (logError) {
        alert(`Error logging work: ${logError.message}`)
        return
      }
    }
    if (newStatus === 'Completed') {
      const { error: logError } = await supabase.from("clients").update({
        end_time: new Date().toISOString(),
      }).eq("id", clientId)
      if (logError) {
        alert(`Error logging work: ${logError.message}`)
        return
      }
    }

    // 2) Update clients table in Supabase
    // const { error: logError } = await supabase.from("clients").update([
    //   {
    //     work_done_by: user.id, // CA logged in
    //     emails_submitted: emailsSent ?? 0,
    //     jobs_applied: jobsApplied ?? 0,
    //     status: newStatus,
    //   },
    // ]).eq("id", clientId)
    // if (logError) {
    //   alert(`Error logging work: ${logError.message}`)
    //   return
    // }



    // 3) Update local state
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? {
            ...client,
            status: newStatus,
            emails_submitted: emailsSent ?? client.emails_submitted,
            jobs_applied: jobsApplied ?? client.jobs_applied,
            last_update: new Date().toISOString().split("T")[0],
          }
          : client,
      ),
    )
    setStatusUpdateOpen(false)
    alert("Status updated and work logged successfully!")
  }


  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">🧭 ApplyWizz CA Performance Tracker</h1>
            <p className="text-slate-600">Welcome back, {user.name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Profile Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-lg">{user.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <p className="text-lg">{user.role}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fixed Salary</Label>
                    <p className="text-lg font-bold text-green-600">₹{baseSalary.toLocaleString()}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>

        {/* Enhanced Calendar Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar & Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  variant={trackingMode === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTrackingMode("daily")}
                >
                  Daily Tracking
                </Button>
                {/* <Button
                  variant={trackingMode === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTrackingMode("monthly")}
                >
                  Monthly Tracking
                </Button> */}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">From:</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
                <Label className="text-sm">To:</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
                <Button variant="outline" size="sm">
                  Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toggle View */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Work Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              {/* <Button
                variant={currentView === "myself" ? "default" : "outline"}
                onClick={() => setCurrentView("myself")}
              >
                🌟 Myself
              </Button> */}
              <Button
                variant={currentView === "myself" ? "default" : "outline"}
                onClick={() => {
                  setCurrentView("myself")
                  setSelectedCA("")   // <-- Reset to empty so self-fetch triggers
                }}
              >
                🌟 Myself
              </Button>
              <Button
                variant={currentView === "onbehalf" ? "default" : "outline"}
                onClick={() => setCurrentView("onbehalf")}
              >
                👥 On Behalf of Someone
              </Button>

              {currentView === "onbehalf" && (
                <div className="flex items-center gap-2">
                  <Select value={selectedCA} onValueChange={setSelectedCA}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Choose team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={user.id}>🌟 {user.name} (Myself)</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Badge variant="secondary">Performance credit goes to selected CA</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Card: Client List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.status === "Completed"
                              ? "default"
                              : client.status === "Started"
                                ? "secondary"
                                : client.status === "Paused"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedClient(client)}>
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white">
                            <DialogHeader>
                              <DialogTitle>Update Client Status</DialogTitle>
                            </DialogHeader>
                            <StatusUpdateForm client={selectedClient} onUpdate={handleStatusUpdate} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right Card: Performance Snapshot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-600">Base Salary</Label>
                  <p className="text-2xl font-bold text-green-600">₹{baseSalary.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Designation</Label>
                  <p className="text-lg font-semibold">{user.designation}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600">Incentive</Label>
                <p className="text-xl font-bold text-blue-600">
                  ₹{incentive ? incentive.incentive_amount : 0}
                </p>
              </div>
              <div>
                <Label className="text-sm text-slate-600">Badge</Label>
                <p className="text-lg">{incentive ? incentive.badge : "No Badge"}</p>
              </div>

              {incentive?.badge && (
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    🏅 {incentive.badge}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Status Update Form Component (Unchanged)
function StatusUpdateForm({
  client,
  onUpdate,
}: { client: any; onUpdate: (id: string, status: string, reason?: string, emails?: number, jobs?: number) => void }) {
  const [status, setStatus] = useState(client?.status || "")
  const [reason, setReason] = useState("")
  const [emailsSent, setEmailsSent] = useState(client?.emails_submitted?.toString() || "")
  const [jobsApplied, setJobsApplied] = useState(client?.jobs_applied?.toString() || "")

  if (!client) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(
      client.id,
      status,
      reason,
      emailsSent ? Number.parseInt(emailsSent) : undefined,
      jobsApplied ? Number.parseInt(jobsApplied) : undefined,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Client: {client.name}</Label>
      </div>

      <div>
        <Label htmlFor="status" className="text-sm font-medium">
          New Status
        </Label>
        {/* <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="Started">Started</SelectItem>
              
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
             
          </SelectContent>
        </Select> */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {client?.status === "Started" ? (
              <>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="Started">Started</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

      </div>
      {(status === "Paused" || status === "Completed") && ( // Add this condition
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emails" className="text-sm font-medium">
                Number of Emails Recieved
              </Label>
              <Input
                id="emails"
                type="number"
                value={emailsSent}
                onChange={(e) => setEmailsSent(e.target.value)}
                placeholder="Enter email count"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="jobs" className="text-sm font-medium">
                Number of Jobs Applied
              </Label>
              <Input
                id="jobs"
                type="number"
                value={jobsApplied}
                onChange={(e) => setJobsApplied(e.target.value)}
                placeholder="Enter job applications"
                className="mt-1"
                required
              />
            </div>
          </div>

          {status === "Paused" && (
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for Pause
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for pausing..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </>
      )}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        Update Status
      </Button>
    </form>
  )
}
