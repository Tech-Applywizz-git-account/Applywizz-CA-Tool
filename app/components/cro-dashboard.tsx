// "use client"

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { AlertTriangle, CheckCircle, Upload, FileSpreadsheet } from "lucide-react"
// import { useState } from "react"
// import { Calendar } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Plus } from "lucide-react"
// import { NewClientForm } from "./new-client-form"

// interface CRODashboardProps {
//   user: any
//   onLogout: () => void
// }

// const mockClients = [
//   {
//     id: "1",
//     name: "John Miller",
//     assignedCA: "ca1@applywizz.com",
//     time: "09:30 AM",
//     jobsApplied: 15,
//     emailsSubmitted: 3,
//     status: "Completed",
//   },
//   {
//     id: "2",
//     name: "Riya Patel",
//     assignedCA: "ca1@applywizz.com",
//     time: "10:15 AM",
//     jobsApplied: 8,
//     emailsSubmitted: 1,
//     status: "Paused",
//   },
//   {
//     id: "3",
//     name: "Ahmed Khan",
//     assignedCA: "ca2@applywizz.com",
//     time: "Not submitted",
//     jobsApplied: 0,
//     emailsSubmitted: 0,
//     status: "Started",
//     alert: true,
//   },
//   {
//     id: "4",
//     name: "Sarah Wilson",
//     assignedCA: "ca2@applywizz.com",
//     time: "Not submitted",
//     jobsApplied: 0,
//     emailsSubmitted: 0,
//     status: "Started",
//     alert: true,
//   },
//   {
//     id: "5",
//     name: "Alice Brown",
//     assignedCA: "ca3@applywizz.com",
//     time: "11:20 AM",
//     jobsApplied: 12,
//     emailsSubmitted: 0,
//     status: "Completed",
//   },
// ]

// const mockTeamMembers = [
//   {
//     email: "ca1@applywizz.com",
//     name: "CA 1",
//     teamLead: "tl1@applywizz.com",
//   },
//   {
//     email: "ca2@applywizz.com",
//     name: "CA 2",
//     teamLead: "tl1@applywizz.com",
//   },
//   {
//     email: "ca3@applywizz.com",
//     name: "CA 3",
//     teamLead: "tl2@applywizz.com",
//   },
//   {
//     email: "ca4@applywizz.com",
//     name: "CA 4",
//     teamLead: "tl2@applywizz.com",
//   },
// ]

// export function CRODashboard({ user, onLogout }: CRODashboardProps) {
//   const [clients, setClients] = useState(mockClients)
//   const [newClientOpen, setNewClientOpen] = useState(false)
//   const [importOpen, setImportOpen] = useState(false)
//   const [selectedTeamLead, setSelectedTeamLead] = useState("all")
//   const [dateFrom, setDateFrom] = useState("2024-01-29")
//   const [dateTo, setDateTo] = useState("2024-01-29")
//   const [sheetsUrl, setSheetsUrl] = useState("")
//   const [importStatus, setImportStatus] = useState("")

//   // Calculate Team Lead incentives
//   const calculateTeamLeadIncentives = (teamLeadEmail: string) => {
//     const teamCAs = mockTeamMembers.filter((ca) => ca.teamLead === teamLeadEmail)
//     const avgClientsPerCA =
//       teamCAs.reduce((sum, ca) => {
//         const caClients = clients.filter((c) => c.assignedCA === ca.email)
//         return sum + caClients.filter((c) => c.status === "Completed").length
//       }, 0) / teamCAs.length

//     let tlBonus = 0
//     if (avgClientsPerCA >= 4) tlBonus = 1000
//     if (avgClientsPerCA >= 5) tlBonus = 2000
//     if (avgClientsPerCA >= 6) tlBonus = 3000

//     return { avgClientsPerCA: Math.round(avgClientsPerCA * 10) / 10, tlBonus }
//   }

//   const handleGoogleSheetsImport = async () => {
//     if (!sheetsUrl) {
//       setImportStatus("Please enter a valid Google Sheets URL")
//       return
//     }

//     setImportStatus("Importing data from Google Sheets...")

//     // Simulate API call to Google Sheets
//     setTimeout(() => {
//       // Mock imported data
//       const importedClients = [
//         {
//           id: Date.now().toString(),
//           name: "Imported Client 1",
//           assignedCA: "ca1@applywizz.com",
//           time: "12:00 PM",
//           jobsApplied: 5,
//           emailsSubmitted: 2,
//           status: "Started",
//         },
//         {
//           id: (Date.now() + 1).toString(),
//           name: "Imported Client 2",
//           assignedCA: "ca2@applywizz.com",
//           time: "12:30 PM",
//           jobsApplied: 10,
//           emailsSubmitted: 4,
//           status: "Completed",
//         },
//       ]

//       setClients((prev) => [...prev, ...importedClients])
//       setImportStatus(`Successfully imported ${importedClients.length} clients from Google Sheets`)
//       setSheetsUrl("")

//       setTimeout(() => {
//         setImportOpen(false)
//         setImportStatus("")
//       }, 2000)
//     }, 2000)
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">CRO Dashboard</h1>
//             <p className="text-slate-600">Team Leader Level - CA Performance Tracking</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Dialog open={importOpen} onOpenChange={setImportOpen}>
//               <DialogTrigger asChild>
//                 <Button variant="outline">
//                   <FileSpreadsheet className="h-4 w-4 mr-2" />
//                   Import from Google Sheets
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Import Data from Google Sheets</DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="sheetsUrl">Google Sheets URL</Label>
//                     <Input
//                       id="sheetsUrl"
//                       value={sheetsUrl}
//                       onChange={(e) => setSheetsUrl(e.target.value)}
//                       placeholder="https://docs.google.com/spreadsheets/d/..."
//                       className="mt-1"
//                     />
//                     <p className="text-xs text-slate-500 mt-1">
//                       Make sure the sheet is publicly accessible or shared with the service account
//                     </p>
//                   </div>

//                   {importStatus && (
//                     <div
//                       className={`p-3 rounded-lg text-sm ${
//                         importStatus.includes("Successfully")
//                           ? "bg-green-50 text-green-700 border border-green-200"
//                           : importStatus.includes("Importing")
//                             ? "bg-blue-50 text-blue-700 border border-blue-200"
//                             : "bg-red-50 text-red-700 border border-red-200"
//                       }`}
//                     >
//                       {importStatus}
//                     </div>
//                   )}

//                   <div className="flex gap-2">
//                     <Button
//                       onClick={handleGoogleSheetsImport}
//                       disabled={!sheetsUrl || importStatus.includes("Importing")}
//                     >
//                       <Upload className="h-4 w-4 mr-2" />
//                       {importStatus.includes("Importing") ? "Importing..." : "Import Data"}
//                     </Button>
//                     <Button variant="outline" onClick={() => setImportOpen(false)}>
//                       Cancel
//                     </Button>
//                   </div>

//                   <div className="border-t pt-4">
//                     <h4 className="font-medium text-sm mb-2">Expected Sheet Format:</h4>
//                     <div className="text-xs text-slate-600 space-y-1">
//                       <p>Column A: Client Name</p>
//                       <p>Column B: Assigned CA Email</p>
//                       <p>Column C: Jobs Applied</p>
//                       <p>Column D: Emails Submitted</p>
//                       <p>Column E: Status (Started/Paused/Completed)</p>
//                     </div>
//                   </div>
//                 </div>
//               </DialogContent>
//             </Dialog>

//             <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
//               <DialogTrigger asChild>
//                 <Button>
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add New Client
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Add New Client</DialogTitle>
//                 </DialogHeader>
//                 <NewClientForm
//                   onSubmit={(data) => {
//                     const newClient = {
//                       id: Date.now().toString(),
//                       ...data,
//                       emailsSubmitted: 0,
//                       jobsApplied: 0,
//                       dateAssigned: new Date().toISOString().split("T")[0],
//                       lastUpdate: new Date().toISOString().split("T")[0],
//                     }
//                     setClients((prev) => [...prev, newClient])
//                     setNewClientOpen(false)
//                   }}
//                 />
//               </DialogContent>
//             </Dialog>
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="flex gap-4 mb-6">
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Select Team Leader</label>
//             <Select value={selectedTeamLead} onValueChange={setSelectedTeamLead}>
//               <SelectTrigger className="w-48">
//                 <SelectValue placeholder="All Team Leaders" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Team Leaders</SelectItem>
//                 <SelectItem value="tl1@applywizz.com">Team Lead North</SelectItem>
//                 <SelectItem value="tl2@applywizz.com">Team Lead South</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
//             <div className="flex items-center gap-2">
//               <Button variant="outline" size="sm">
//                 Today
//               </Button>
//               <span className="text-sm text-slate-600">July 29th, 2025</span>
//             </div>
//           </div>
//         </div>

//         {/* Calendar Section */}
// <Card className="mb-6">
//   <CardContent className="p-4">
//     <div className="flex items-center gap-4">
//       <Calendar className="h-4 w-4" />
//       <Label className="text-sm">From:</Label>
//       <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
//       <Label className="text-sm">To:</Label>
//       <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
//       {selectedTeamLead !== "all" && (
//         <div className="ml-4 p-2 bg-blue-50 rounded">
//           <span className="text-sm font-medium">Team Lead Incentive: </span>
//           <span className="text-lg font-bold text-blue-600">
//             ₹{calculateTeamLeadIncentives(selectedTeamLead).tlBonus.toLocaleString()}
//           </span>
//         </div>
//       )}
//     </div>
//   </CardContent>
// </Card>

//         {/* KPI Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
//               <div className="text-sm text-slate-600">Total Clients</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-green-600">
//                 {clients.filter((c) => c.status === "Completed").length}
//               </div>
//               <div className="text-sm text-slate-600">Submitted</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-red-600">{clients.filter((c) => c.alert).length}</div>
//               <div className="text-sm text-slate-600">Missed Today</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-purple-600">
//                 {Math.round((clients.filter((c) => c.status === "Completed").length / clients.length) * 100)}%
//               </div>
//               <div className="text-sm text-slate-600">Submission Rate</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-green-600">
//                 {clients.filter((c) => c.status === "Completed").length}
//               </div>
//               <div className="text-sm text-slate-600">Completed</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Client List */}
//         <Card>
//           <CardHeader>
//             <CardTitle>All Team Leaders' Clients Today</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {clients.map((client, index) => (
//                 <div
//                   key={index}
//                   className={`flex items-center justify-between p-4 rounded-lg border ${
//                     client.alert ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
//                   }`}
//                 >
//                   <div className="flex items-center gap-3">
//                     {client.status === "Completed" ? (
//                       <CheckCircle className="h-5 w-5 text-green-500" />
//                     ) : client.alert ? (
//                       <AlertTriangle className="h-5 w-5 text-red-500" />
//                     ) : (
//                       <CheckCircle className="h-5 w-5 text-green-500" />
//                     )}
//                     <div>
//                       <h3 className="font-semibold">{client.name}</h3>
//                       <p className="text-sm text-slate-600">
//                         CA: {client.assignedCA} • {client.time}
//                       </p>
//                       {client.alert && (
//                         <Badge variant="destructive" className="mt-1">
//                           Missing Update
//                         </Badge>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-8 text-center">
//                     <div>
//                       <div className="text-lg font-bold">{client.jobsApplied}</div>
//                       <div className="text-xs text-slate-600">Jobs Applied</div>
//                     </div>
//                     <div>
//                       <div className="text-lg font-bold">{client.emailsSubmitted}</div>
//                       <div className="text-xs text-slate-600">Emails Received</div>
//                     </div>
//                     <Badge
//                       variant={
//                         client.status === "Completed" ? "default" : client.status === "Paused" ? "secondary" : "outline"
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
// import { Calendar, AlertTriangle, CheckCircle, FileSpreadsheet, Upload, Plus } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { NewClientForm } from "./new-client-form"

// interface CRODashboardProps {
//   user: any
//   onLogout: () => void
// }

// export function CRODashboard({ user, onLogout }: CRODashboardProps) {
//   const [clients, setClients] = useState<any[]>([])
//   const [teamLeads, setTeamLeads] = useState<any[]>([])
//   const [selectedTeamLead, setSelectedTeamLead] = useState("all")
//   const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0])
//   const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0])
//   const [newClientOpen, setNewClientOpen] = useState(false)
//   const [importOpen, setImportOpen] = useState(false)
//   const [sheetsUrl, setSheetsUrl] = useState("")
//   const [importStatus, setImportStatus] = useState("")
//   const [cas, setCas] = useState<any[]>([])


//   // --- Fetch Team Leads on load ---
//   useEffect(() => {
//     const fetchTeamLeads = async () => {
//       const { data, error } = await supabase.from("users").select("id, name, email").eq("role", "Team Lead")
//       if (!error && data) setTeamLeads(data)
//     }
//     fetchTeamLeads()
//   }, [])

//   // --- Fetch Clients whenever filters change ---
//   useEffect(() => {
//     const fetchClients = async () => {
//       let query = supabase.from("clients").select("*").gte("date_assigned", dateFrom).lte("date_assigned", dateTo)

//       if (selectedTeamLead !== "all") {
//         // Find all CAs under the selected team lead
//         const { data: cas, error: casError } = await supabase
//           .from("users")
//           .select("id")
//           .eq("team_id", selectedTeamLead)
//           .in("role", ["CA", "Junior CA"])

//         if (!casError && cas.length > 0) {
//           const caIds = cas.map((ca) => ca.id)
//           query = query.in("assigned_ca_id", caIds)
//         } else {
//           query = query.in("assigned_ca_id", []) // no CA = no clients
//         }
//       }

//       const { data, error } = await query
//       if (!error && data) setClients(data)
//     }
//     fetchClients()
//   }, [selectedTeamLead, dateFrom, dateTo])

//   // --- Fetch CA list whenever filters change ---
//   useEffect(() => {
//     const fetchCAs = async () => {
//       let query = supabase.from("users").select("id, name, email, designation, team_id")
//         .in("role", ["CA", "Junior CA"])

//       if (selectedTeamLead !== "all") {
//         // Get selected team_id
//         const { data: team } = await supabase.from("teams").select("id").eq("lead_id", selectedTeamLead).single()
//         if (team) query = query.eq("team_id", team.id)
//       }

//       const { data, error } = await query
//       if (!error && data) setCas(data)
//     }

//     fetchCAs()
//   }, [selectedTeamLead])

//   useEffect(() => {
//     const fetchClients = async () => {
//       if (cas.length === 0) {
//         setClients([])
//         return
//       }

//       const caIds = cas.map((c) => c.id)
//       const { data, error } = await supabase
//         .from("clients")
//         .select("*")
//         .in("assigned_ca_id", caIds)

//       if (!error && data) setClients(data)
//     }

//     fetchClients()
//   }, [cas])

//   const [caPerformance, setCaPerformance] = useState<Record<string, any>>({});

//   useEffect(() => {
//     const fetchCAData = async () => {
//       let caQuery = supabase.from("users").select("id, name, email, designation").in("role", ["CA", "Junior CA"]);
//       if (selectedTeamLead !== "all") {
//         caQuery = caQuery.eq("team_id", selectedTeamLead);
//       }
//       const { data: caList } = await caQuery;
//       if (!caList) return;

//       const today = new Date().toISOString().split("T")[0];
//       const performance: Record<string, any> = {};

//       for (const ca of caList) {
//         const { data: logs } = await supabase
//           .from("work_logs")
//           .select("emails_sent, jobs_applied, status")
//           .eq("work_done_by", ca.id)
//           .eq("date", today);

//         if (logs && logs.length > 0) {
//           const totalEmails = logs.reduce((sum, l) => sum + (l.emails_sent || 0), 0);
//           const totalJobs = logs.reduce((sum, l) => sum + (l.jobs_applied || 0), 0);
//           performance[ca.id] = {
//             ...ca,
//             emails_sent: totalEmails,
//             jobs_applied: totalJobs,
//             status: logs[logs.length - 1].status,
//           };
//         } else {
//           performance[ca.id] = {
//             ...ca,
//             emails_sent: 0,
//             jobs_applied: 0,
//             status: "Not Yet Started",
//           };
//         }
//       }
//       setCaPerformance(performance);
//     };
//     fetchCAData();
//   }, [selectedTeamLead, dateFrom, dateTo]);



//   // --- KPI Calculations ---
//   // const totalClients = clients.length
//   // const submittedClients = clients.filter((c) => c.status === "Completed").length
//   // const missedToday = clients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length
//   // const submissionRate = totalClients > 0 ? Math.round((submittedClients / totalClients) * 100) : 0

//   const totalCAs = cas.length
//   const totalClients = clients.length
//   const submittedClients = clients.filter((c) => c.status === "Completed").length
//   const missedToday = clients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length
//   const submissionRate = totalClients > 0 ? Math.round((submittedClients / totalClients) * 100) : 0

//   // Build a metrics map for each CA
//   const today = new Date().toISOString().split("T")[0]
//   const caMetrics = cas.map((ca) => {
//     const caClients = clients.filter(
//       (c) => c.assigned_ca_id === ca.id && c.date_assigned === today
//     )

//     const totalJobs = caClients.reduce((sum, c) => sum + (c.jobs_applied || 0), 0)
//     const totalEmails = caClients.reduce((sum, c) => sum + (c.emails_submitted || 0), 0)

//     let status = "Not Yet Started"
//     if (caClients.some((c) => c.status === "Paused")) status = "Paused"
//     else if (caClients.every((c) => c.status === "Completed" && caClients.length > 0)) status = "Completed"
//     else if (caClients.some((c) => c.status === "Started")) status = "Started"

//     return { caId: ca.id, totalJobs, totalEmails, status }
//   })



//   // --- Handle Google Sheets Import (future integration) ---
//   const handleGoogleSheetsImport = async () => {
//     if (!sheetsUrl) {
//       setImportStatus("Please enter a valid Google Sheets URL")
//       return
//     }
//     setImportStatus("Importing data from Google Sheets...")

//     // Mock import (replace with actual API later)
//     setTimeout(() => {
//       setImportStatus(`Successfully imported data from Google Sheets`)
//       setSheetsUrl("")
//       setTimeout(() => {
//         setImportOpen(false)
//         setImportStatus("")
//       }, 1500)
//     }, 1500)
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">CRO Dashboard</h1>
//             <p className="text-slate-600">Track team performance and CA productivity</p>
//           </div>
//           <div className="flex items-center gap-4">
//             {/* Google Sheets Import */}
//             <Dialog open={importOpen} onOpenChange={setImportOpen}>
//               <DialogTrigger asChild>
//                 <Button variant="outline">
//                   <FileSpreadsheet className="h-4 w-4 mr-2" />
//                   Import from Google Sheets
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Import Data from Google Sheets</DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                   <Label htmlFor="sheetsUrl">Google Sheets URL</Label>
//                   <Input
//                     id="sheetsUrl"
//                     value={sheetsUrl}
//                     onChange={(e) => setSheetsUrl(e.target.value)}
//                     placeholder="https://docs.google.com/spreadsheets/d/..."
//                   />
//                   {importStatus && <div className="text-sm">{importStatus}</div>}
//                   <Button onClick={handleGoogleSheetsImport}>Import</Button>
//                 </div>
//               </DialogContent>
//             </Dialog>

//             {/* Add New Client */}
//             <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
//               <DialogTrigger asChild>
//                 <Button>
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add New Client
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Add New Client</DialogTitle>
//                 </DialogHeader>
//                 <NewClientForm fetchClients={() => { }} />
//               </DialogContent>
//             </Dialog>
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="flex gap-4 mb-6">
//           <div>
//             <label className="text-sm font-medium text-slate-700 mb-1 block">Select Team Leader</label>
//             <Select value={selectedTeamLead} onValueChange={setSelectedTeamLead}>
//               <SelectTrigger className="w-48">
//                 <SelectValue placeholder="All Team Leaders" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Team Leaders</SelectItem>
//                 {teamLeads.map((tl) => (
//                   <SelectItem key={tl.id} value={tl.id}>
//                     {tl.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="flex items-center gap-2">
//             <Label className="text-sm">From:</Label>
//             <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
//             <Label className="text-sm">To:</Label>
//             <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => {
//                 const today = new Date().toISOString().split("T")[0]
//                 setDateFrom(today)
//                 setDateTo(today)
//               }}
//             >
//               Today
//             </Button>
//           </div>

//         </div>

//         {/* KPI Cards */}
//         {/* <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{submittedClients}</div><div className="text-sm text-slate-600">Submitted</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{missedToday}</div><div className="text-sm text-slate-600">Missed Today</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{submissionRate}%</div><div className="text-sm text-slate-600">Submission Rate</div></CardContent></Card>
//           <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{submittedClients}</div><div className="text-sm text-slate-600">Completed</div></CardContent></Card>
//         </div> */}

//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-blue-600">{totalCAs}</div>
//               <div className="text-sm text-slate-600">Total CAs</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
//               <div className="text-sm text-slate-600">Total Clients</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-green-600">{submittedClients}</div>
//               <div className="text-sm text-slate-600">Submitted</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-red-600">{missedToday}</div>
//               <div className="text-sm text-slate-600">Missed Today</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <div className="text-2xl font-bold text-purple-600">{submissionRate}%</div>
//               <div className="text-sm text-slate-600">Submission Rate</div>
//             </CardContent>
//           </Card>
//         </div>


//         {/* Client List */}
//         {/* <Card>
//           <CardHeader><CardTitle>All Clients</CardTitle></CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {clients.map((client) => (
//                 <div key={client.id} className={`flex items-center justify-between p-4 rounded-lg border ${client.status === "Started" && client.jobs_applied === 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
//                   <div className="flex items-center gap-3">
//                     {client.status === "Completed" ? <CheckCircle className="h-5 w-5 text-green-500" /> : client.status === "Started" && client.jobs_applied === 0 ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
//                     <div>
//                       <h3 className="font-semibold">{client.name}</h3>
//                       <p className="text-sm text-slate-600">CA: {client.assigned_ca_id} • {client.date_assigned}</p>
//                       {client.status === "Started" && client.jobs_applied === 0 && (
//                         <Badge variant="destructive" className="mt-1">Missing Update</Badge>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-8 text-center">
//                     <div><div className="text-lg font-bold">{client.jobs_applied}</div><div className="text-xs text-slate-600">Jobs Applied</div></div>
//                     <div><div className="text-lg font-bold">{client.emails_submitted}</div><div className="text-xs text-slate-600">Emails Received</div></div>
//                     <Badge variant={client.status === "Completed" ? "default" : client.status === "Paused" ? "secondary" : "outline"}>{client.status}</Badge>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card> */}
//         {/* CA List */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Career Associates</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {Object.values(caPerformance).map((ca: any) => (
//                 <div key={ca.id} className="flex items-center justify-between p-4 rounded-lg border bg-white">
//                   <div>
//                     <h3 className="font-semibold">{ca.name}</h3>
//                     <p className="text-sm text-slate-600">{ca.designation || "CA"} • {ca.email}</p>
//                   </div>
//                   <div className="flex gap-4">
//                     <Badge variant="secondary">Email Recieved: {ca.emails_sent}</Badge>
//                     <Badge variant="secondary">Jobs Applied: {ca.jobs_applied}</Badge>
//                     <Badge
//                       variant={
//                         ca.status === "Completed" ? "default"
//                           : ca.status === "Paused" ? "secondary"
//                             : ca.status === "Started" ? "outline"
//                               : "destructive"
//                       }
//                     >
//                       {ca.status}
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
import { FileSpreadsheet, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NewClientForm } from "./new-client-form"

interface CRODashboardProps {
  user: any
  onLogout: () => void
}

export function CRODashboard({ user, onLogout }: CRODashboardProps) {
  const [clients, setClients] = useState<any[]>([])
  const [clients1, setClients1] = useState<any[]>([])
  const [cas1, setCas1] = useState<any[]>([])
  const [teamLeads, setTeamLeads] = useState<any[]>([])
  const [selectedTeamLead, setSelectedTeamLead] = useState("all")
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0])
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [importStatus, setImportStatus] = useState("")
  const [cas, setCas] = useState<any[]>([])
  const [caPerformance, setCaPerformance] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // --- Fetch Team Leads ---
  useEffect(() => {
    const fetchTeamLeads = async () => {
      const { data, error } = await supabase.from("users").select("id, name, email").eq("role", "Team Lead")
      if (!error && data) setTeamLeads(data)
    }
    fetchTeamLeads()
  }, [])

  // --- Fetch CAs based on Team Lead ---
  useEffect(() => {
    const fetchCAs = async () => {
      setLoading(true)
      let query = supabase.from("users").select("id, name, email, designation, team_id").in("role", ["CA", "Junior CA"])

      if (selectedTeamLead !== "all") {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("id")
          .eq("lead_id", selectedTeamLead)
          .single()

        if (!teamError && team) {
          query = query.eq("team_id", team.id)
        } else {
          setCas([])
          return
        }
      }
      const { data, error } = await query
      if (!error && data) setCas(data)
      setLoading(false)
    }
    fetchCAs()
  }, [selectedTeamLead])

  // --- Fetch Clients for KPI (all CAs) ---
  useEffect(() => {
    if (cas.length === 0) {
      setClients([])
      return
    }
    const fetchClients = async () => {
      setLoading(true)
      const caIds = cas.map((c) => c.id)
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .in("assigned_ca_id", caIds)
        .gte("date_assigned", dateFrom)
        .lte("date_assigned", dateTo)
      if (!error && data) setClients(data)
      setLoading(false)
    }
    fetchClients()
  }, [cas, dateFrom, dateTo])

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
      if (!error && data) setClients1(data)
    }
    fetchClients()
  }, [])
  useEffect(() => {
    const fetchCAs = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .in("role", ["CA", "Junior CA"])
      if (!error && data) setCas1(data)
    }
    fetchCAs()
  }, [])

  // --- Optimized Performance Metrics ---
  useEffect(() => {
    const fetchCAData = async () => {
      if (cas.length === 0) {
        setCaPerformance({})
        return
      }

      const today = new Date().toISOString().split("T")[0]
      const caIds = cas.map((c) => c.id)

      // Fetch all work_logs in one query
      const { data: logs, error } = await supabase
        .from("clients")
        .select("assigned_ca_id, work_done_by, emails_submitted, jobs_applied, status")
        .in("assigned_ca_id", caIds)
        .eq("date", today)

      if (error) {
        console.error("Error fetching work logs:", error)
        return
      }

      
      
      // Aggregate results
      const performance: Record<string, any> = {}
      for (const ca of cas) {
        const { data: logs1, error: error1 } = await supabase
          .from("work_history")
          .select("work_done_by, emails_submitted, jobs_applied, status,incentives")
          .eq("work_done_by", ca.id)
        const caLogs = logs?.filter((log) => log.work_done_by === ca.id) || []
        if (caLogs.length > 0) {
          const totalEmails = caLogs.reduce((sum, l) => sum + (l.emails_submitted || 0), 0)
          const totalJobs = caLogs.reduce((sum, l) => sum + (l.jobs_applied || 0), 0)
          const lastStatus = caLogs[caLogs.length - 1].status
          performance[ca.id] = { ...ca, emails_submitted: totalEmails, jobs_applied: totalJobs, status: lastStatus }
        } else {
          performance[ca.id] = { ...ca, emails_submitted: 0, jobs_applied: 0, status: "Not Yet Started" }
        }
      }
      setCaPerformance(performance)
    }
    fetchCAData()
  }, [cas, dateFrom, dateTo])




  // --- KPI Calculations ---
  const totalCAs = cas.length
  const totalClients = clients.length
  const submittedClients = clients.filter((c) => c.status === "Completed").length
  const missedToday = clients.filter((c) => c.status === "Started" && c.jobs_applied === 0).length
  const submissionRate = totalClients > 0 ? Math.round((submittedClients / totalClients) * 100) : 0

  // --- Google Sheets Import (mock) ---
  const handleGoogleSheetsImport = async () => {
    if (!sheetsUrl) {
      setImportStatus("Please enter a valid Google Sheets URL")
      return
    }
    setImportStatus("Importing data from Google Sheets...")
    setTimeout(() => {
      setImportStatus(`Successfully imported data from Google Sheets`)
      setSheetsUrl("")
      setTimeout(() => {
        setImportOpen(false)
        setImportStatus("")
      }, 1500)
    }, 1500)
  }

  // const handleReset = async () => {
  //   cas1.forEach(async (ca) => {
  //     const { data: logData, error: logError } = await supabase
  //       .from("clients")     
  //       .select(
  //         'id, name, emails_submitted, jobs_applied, status, date_assigned, start_time, end_time, client_designation, work_done_by'   
  //       )
  //       .eq("assigned_ca_id", ca.id) 

  //     if (logError) {
  //       alert(`Error logging reset data: ${logError.message}`)
  //       return
  //     } 


  //     let date = new Date().toISOString().split("T")[0]; 
  //     const { error: logInsertError } = await supabase
  //       .from("work_history")
  //       .insert({
  //         date: date,
  //         ca_id: ca.id,
  //         ca_name: ca.name,
  //         completed_profiles:logData
  //       })
  //     if (logInsertError) {
  //       alert(`Error logging reset data: `)
  //       console.error("Error logging reset data:", logInsertError)
  //       return    
  //     }
  //     else {
  //       console.log("ca name:", ca.name);
  //       console.log("Reset data logged successfully:", logData);
  //     }   
  //   })

  //   // Reset all clients data


  //   clients1.forEach(async (client) => { 
  //     // Reset client data
  //     const { error: resetError } = await supabase
  //       .from("clients")
  //       .update({
  //         status: "Not Started",
  //         emails_submitted: 0,
  //         jobs_applied: 0,
  //         work_done_by: null,
  //         start_time: null,
  //         end_time: null,
  //         remarks: null,
  //         date: new Date().toISOString().split("T")[0],
  //       }).eq("id", client.id)

  //     if (resetError) {
  //       alert(`Error Resetting daily data: `)
  //       return
  //     }
  //   })

  //   alert("Reset today's data successfully!")
  // }
  const handleReset = async () => {
    // ✅ First loop: Process all CAs one by one
    for (const ca of cas1) {
      const { data: logData, error: logError } = await supabase
        .from("clients")
        .select(
          'id, name, emails_submitted, jobs_applied, status, date_assigned, start_time, end_time, client_designation, work_done_by'
        )
        .eq("work_done_by", ca.id)

      if (logError) {
        alert(`Error logging reset data: ${logError.message}`)
        return
      }

      let date = new Date().toISOString().split("T")[0];
      let noofprofiles = logData.length<=2 ?0:logData.length-2;

      const { error: logInsertError } = await supabase
        .from("work_history")
        .insert({
          date: date,
          ca_id: ca.id,
          ca_name: ca.name,
          completed_profiles: logData,
          incentives: noofprofiles,
        })

      if (logInsertError) {
        alert("Error logging reset data")
        console.error("Error logging reset data:", logInsertError)
        return
      } else {
        console.log("ca name:", ca.name)
      }
      const { data: caData, error: caResetError } = await supabase
        .from("work_history")
        .select('id,date, ca_id, ca_name, completed_profiles')
        .eq("ca_id", ca.id)
      if (caResetError) {
        alert("Error fetching CA reset data")
        return
      } else {
        console.log("CA reset data fetched successfully:", caData)
      }
    }

    // ✅ Second loop: Reset all client data AFTER CAs loop completes
    for (const client of clients1) {
      const currentDate = new Date().toISOString().split("T")[0];
      console.log("Resetting with date:", currentDate);
      const { error: resetError } = await supabase
        .from("clients")
        .update({
          status: "Not Started",
          emails_submitted: 0,
          jobs_applied: 0,
          work_done_by: null,
          start_time: null,
          end_time: null,
          remarks: null,
          date: currentDate,
        })
        .eq("id", client.id)

      if (resetError) {
        alert("Error resetting daily data")
        return
      }
    }
    alert("Reset today's data successfully!")
  }



  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">CRO Dashboard</h1>
            <p className="text-slate-600">Track team performance and CA productivity</p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Import from Google Sheets
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Data from Google Sheets</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label htmlFor="sheetsUrl">Google Sheets URL</Label>
                  <Input
                    id="sheetsUrl"
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                  {importStatus && <div className="text-sm">{importStatus}</div>}
                  <Button onClick={handleGoogleSheetsImport}>Import</Button>
                </div>
              </DialogContent>
            </Dialog>
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
                <NewClientForm fetchClients={() => { }} />
              </DialogContent>
            </Dialog>
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
            <Button onClick={handleReset}> Reset </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Select Team Leader</label>
            <Select value={selectedTeamLead} onValueChange={setSelectedTeamLead}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Team Leaders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Leaders</SelectItem>
                {teamLeads.map((tl) => (
                  <SelectItem key={tl.id} value={tl.id}>
                    {tl.name}
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
        </div>

        {/* Team Incentives (only when a specific Team Lead is selected) */}
        {selectedTeamLead !== "all" && (
          <div className="mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">₹2000</div>
                <div className="text-sm text-slate-600">Team Incentives</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalCAs}</div><div className="text-sm text-slate-600">Total CAs</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{submittedClients}</div><div className="text-sm text-slate-600">Submitted</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{missedToday}</div><div className="text-sm text-slate-600">Missed Today</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{submissionRate}%</div><div className="text-sm text-slate-600">Submission Rate</div></CardContent></Card>
        </div>

        {
          loading && (
            <div className="text-center my-4 text-blue-600 font-semibold text-lg">
              Loading...
            </div>
          )
        }

        {/* CA List */}
        {!loading && (
          <Card>
            <CardHeader><CardTitle>Career Associates</CardTitle></CardHeader>
            <CardContent>
              {/* CA List content here */}

              <div className="space-y-3">
                {Object.values(caPerformance).map((ca: any) => (
                  <div key={ca.id} className="flex items-center justify-between p-4 rounded-lg border bg-white">
                    <div>
                      <h3 className="font-semibold">{ca.name}</h3>
                      <p className="text-sm text-slate-600">{ca.designation || "CA"} • {ca.email}</p>
                    </div>
                    <div className="flex gap-4">
                      <Badge variant="secondary">Incentives :  {ca.emails_submitted}</Badge>
                      <Badge variant="secondary">Email Received: {ca.emails_submitted}</Badge>
                      <Badge variant="secondary">Jobs Applied: {ca.jobs_applied}</Badge>
                      <Badge
                        variant={
                          ca.status === "Completed" ? "default"
                            : ca.status === "Paused" ? "secondary"
                              : ca.status === "Started" ? "outline"
                                : "destructive"
                        }
                      >
                        {ca.status}
                      </Badge>
                    </div>
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
