//app/components/cro-dashboard.tsx

"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { FileSpreadsheet, Plus } from "lucide-react"
import { NewClientForm } from "./new-client-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User } from "lucide-react"


interface CRODashboardProps {
  user: any
  onLogout: () => void
}

export function CRODashboard({ user, onLogout }: CRODashboardProps) {
  const [clients, setClients] = useState<any[]>([])
  const [clients1, setClients1] = useState<any[]>([])
  const [cas, setCas] = useState<any[]>([])
  const [cas1, setCas1] = useState<any[]>([])
  const [teamLeads, setTeamLeads] = useState<any[]>([])
  const [selectedTeamLead, setSelectedTeamLead] = useState("all")
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0])
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [importStatus, setImportStatus] = useState("")
  const [caPerformance, setCaPerformance] = useState<Record<string, any>>({})
  const [caPerformance1, setCaPerformance1] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const [expandedCA, setExpandedCA] = useState<string | null>(null)
  const [caClients, setCaClients] = useState<Record<string, any[]>>({})

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
        setCaPerformance1({})
        return
      }

      const today = new Date().toISOString().split("T")[0]
      const caIds = cas.map((c) => c.id)

      // Fetch all work_logs in one query
      const { data: logs, error } = await supabase
        .from("clients")
        .select("assigned_ca_id, work_done_by, emails_submitted, jobs_applied, status")
        .in("work_done_by", caIds)
        .eq("date", today)

      if (error) {
        console.error("Error fetching work logs:", error)
        return
      } else {
        console.log('viv', logs)
        console.log('viv1', new Date().toISOString().split("T")[0])
      }

      const { data: data1, error: error1 } = await supabase
        .from("work_history")
        .select(`
          ca_id,
          date,
          completed_profiles 
          `)
        .in("ca_id", caIds)
        .gte("date", dateFrom)
        .lte("date", dateTo)
      if (!error1 && data1) console.log('vivek', data1)

      
      const { data: data2, error: error2 } = await supabase
        .from("work_history")
        .select(`
          ca_id,
          date,
          completed_profiles 
          `)
        .gte("date", dateFrom)
        .lte("date", dateTo)
      if (!error2 && data2) console.log('vivek2', data2)
      
      const workingDays = [...new Set(data2?.map(item => item.date))].length;
      console.log('bhan', workingDays)



      // Aggregate results
      const performance: Record<string, any> = {}
      for (const ca of cas) {
        // const { data: logs1, error: error1 } = await supabase
        //   .from("work_history")
        //   .select("work_done_by, emails_submitted, jobs_applied, status,incentives")
        //   .eq("work_done_by", ca.id)
        const caLogs = logs?.filter((log) => log.work_done_by === ca.id) || []
        if (caLogs.length > 0) {
          const totalEmails = caLogs.reduce((sum, l) => sum + (l.emails_submitted || 0), 0)
          const totalJobs = caLogs.reduce((sum, l) => sum + (l.jobs_applied || 0), 0)
          const lastStatus = caLogs[caLogs.length - 1].status
          // performance[ca.id] = { ...ca, emails_submitted: totalEmails, jobs_applied: totalJobs, status: lastStatus }
          performance[ca.id] = { ...ca, emails_submitted: totalEmails, jobs_applied: totalJobs, status: lastStatus, incentives: 0 }
        } else {
          // performance[ca.id] = { ...ca, emails_submitted: 0, jobs_applied: 0, status: "Not Yet Started" }
          performance[ca.id] = { ...ca, emails_submitted: 0, jobs_applied: 0, status: "Not Yet Started", incentives: 0 }
        }
      }
      setCaPerformance(performance)
      const performance1: Record<string, any> = {}
      for (const ca of cas) {
        console.log('vivek11', ca)

        const cadata = data1?.filter((data) => data.ca_id === ca.id) || []
        if (cadata.length > 0) {
          const totalProfile = cadata.reduce((sum, l) => sum + (l.completed_profiles.length || 0), 0)
          const incentive = ca.designation === 'Junior CA' ? (totalProfile - (2 * workingDays) < 0 ? 0 : totalProfile - (2 * workingDays)) : (totalProfile - (4 * workingDays) < 0 ? 0 : totalProfile - (4 * workingDays))
          const totalWorkingdays = workingDays

          performance1[ca.id] = { ...ca, incentives: incentive, totalProfiles: totalProfile, totalWorkingDays: totalWorkingdays }
        } else {
          performance1[ca.id] = { ...ca, incentives: 0 }
        }
      }
      setCaPerformance1(performance1)
    }
    fetchCAData()
  }, [cas, dateFrom, dateTo])


  const fetchClientsForCA = async (caId: string) => {
    if (caClients[caId]) {
      setExpandedCA(expandedCA === caId ? null : caId)
      return
    }
    const { data, error } = await supabase.from("clients").select("*").eq("assigned_ca_id", caId)
    if (error) {
      console.error("Error fetching clients:", error)
      return
    }
    setCaClients((prev) => ({ ...prev, [caId]: data || [] }))
    setExpandedCA(caId)
  }

  // --- KPI Calculations ---
  const totalCAs = cas.length
  const totalClients = clients1.length -2
  const submittedClients = clients1.filter((c) => c.status === "Completed").length
  const missedToday = clients1.filter((c) => c.status === "Started" && c.jobs_applied === 0).length
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
      const { data: logData, error: logError } = await supabase //data1 or data??
      .from("clients")
      .select(
        'id, name, emails_submitted, jobs_applied, status, date_assigned, start_time, end_time, client_designation, work_done_by'
      )
      .eq("work_done_by", ca.id)
      if (logError) {
        alert(`Error logging reset data: ${logError.message}`)
        return
      }
      // console.log("log data Bhanutejaaa: ", logData)
      
      let date = new Date().toISOString().split("T")[0];
      let noofprofiles = ca.role === 'Junior CA' ? logData.length <= 2 ? 0 : logData.length - 2 : logData.length <= 4 ? 0 : logData.length - 4;
      
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
        .select('id, date, ca_id, ca_name, completed_profiles')
        .eq("ca_id", ca.id)
      if (caResetError) {
        alert("Error fetching CA reset data")
        return
      } else {
        console.log("CA reset data fetched successfully:", caData)
      }
       // alert("CA reset data fetched successfully")
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
                  Add New Client
                  <Plus className="h-4 w-4 mr-2" />
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
                <div className="text-sm text-slate-600"> {teamLeads.find((tl) => tl.id === selectedTeamLead)?.name} Team Incentives</div>
                <div className="text-2xl font-bold text-green-600">₹2000</div>
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

        {dateFrom === new Date().toISOString().split("T")[0] && dateTo === new Date().toISOString().split("T")[0] &&
          <>

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
                      <div key={ca.id} className="flex flex-col border rounded-lg bg-white">
                        {/* CA Card Summary */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => fetchClientsForCA(ca.id)}
                        >
                          <div>
                            <h3 className="font-semibold">{ca.name}</h3>
                            <p className="text-sm text-slate-600">{ca.designation || "CA"} • {ca.email}</p>
                          </div>
                          <div className="flex gap-4">
                            <Badge variant="secondary">Incentives : {ca.incentives}</Badge>
                            <Badge variant="secondary">Email Received: {ca.emails_submitted}</Badge>
                            <Badge variant="secondary">Jobs Applied: {ca.jobs_applied}</Badge>
                          </div>
                        </div>

                        {/* Expanded Clients Section */}
                        {expandedCA === ca.id && (
                          <div className="p-4 bg-slate-50 border-t">
                            {caClients[ca.id]?.length > 0 ? (
                              <ul className="space-y-2">
                                {caClients[ca.id].map((client) => (
                                  <li key={client.id} className="flex justify-between p-2 bg-white rounded border">
                                    <div>
                                      <p className="font-medium">{client.name}</p>
                                      <p className="text-sm text-slate-600">{client.email}</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                      <Badge>{client.status}</Badge>
                                      <Badge variant="secondary">Emails: {client.emails_submitted}</Badge>
                                      <Badge variant="secondary">Jobs: {client.jobs_applied}</Badge>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500">No clients assigned.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </CardContent>
              </Card>
            )}

          </>
        }
        {(dateFrom !== new Date().toISOString().split("T")[0] || dateTo !== new Date().toISOString().split("T")[0]) &&
          <>

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
                    {Object.values(caPerformance1).map((ca: any) => (

                      <div key={ca.id} className="flex flex-col border rounded-lg bg-white">
                        {/* CA Card Summary */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => fetchClientsForCA(ca.id)}
                        >
                          <div>
                            <h3 className="font-semibold">{ca.name}</h3>
                            <p className="text-sm text-slate-600">{ca.designation || "CA"} • {ca.email}</p>
                          </div>
                          <div className="flex gap-4">
                            <Badge variant="secondary">Total profiles : {ca.totalProfiles}</Badge>
                            <Badge variant="secondary">Incentives : {ca.incentives}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </>
        }
      </div>
    </div>
  )
}
