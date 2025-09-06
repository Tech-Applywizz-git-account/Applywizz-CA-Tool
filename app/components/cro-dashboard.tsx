//app/components/cro-dashboard.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
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
import { User, Loader2 } from "lucide-react"
import Link from "next/link"



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

  const [isResetting, setIsResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState<string>("")
  const [confirmClient, setConfirmClient] = useState<{ id: string, isActive: boolean, caId: string } | null>(null)
  // Track currently selected team id (derived from Team Lead)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)



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
      let query = supabase
        .from("users")
        .select("id, name, email, designation, team_id")
        .in("role", ["CA", "Junior CA"])

      if (selectedTeamLead !== "all") {
        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("id")
          .eq("lead_id", selectedTeamLead)
          .single()

        if (!teamError && team) {
          // store the selected team id
          setSelectedTeamId(team.id)
          query = query.eq("team_id", team.id)
        } else {
          setSelectedTeamId(null)
          setCas([])
          setLoading(false)
          return
        }
      } else {
        // "All Team Leaders"
        setSelectedTeamId(null)
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

  // Add this directly under fetchClientsForCA(...)
  const handleToggleActive = async (
    clientId: string,
    currentIsActive: boolean,
    caId?: string
  ) => {
    const { data, error } = await supabase
      .from("clients")
      .update({ is_active: !currentIsActive })
      .eq("id", clientId)
      .select("id, is_active")
      .single();

    if (error) {
      alert("Failed to toggle active state: " + error.message);
      return;
    }

    // Update the expanded CA's client list (if provided)
    if (caId) {
      setCaClients((prev) => ({
        ...prev,
        [caId]: (prev[caId] || []).map((c) =>
          c.id === clientId ? { ...c, is_active: data.is_active } : c
        ),
      }));
    }

    // Keep global client cache in sync for KPI cards, etc.
    setClients1((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, is_active: data.is_active } : c))
    );
  };

  // ---- Time helpers (IST) ----
  const fmtIST = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-IN", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
      : "—";

  const calcDurationLabel = (startISO?: string | null, endISO?: string | null) => {
    if (!startISO) return "—";
    const st = new Date(startISO).getTime();
    if (Number.isNaN(st)) return "—";

    // If there's no end, show "In progress (Xm)"
    if (!endISO) {
      const now = Date.now();
      const mins = Math.max(0, Math.round((now - st) / 60000));
      return `In progress (${mins} min)`;
    }

    const et = new Date(endISO).getTime();
    if (Number.isNaN(et) || et < st) return "—";

    const mins = Math.round((et - st) / 60000);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  // Team-aware visible clients (used by KPI cards)
  const visibleClients = useMemo(() => {
    // If no TL filter, show all
    if (selectedTeamId === null) return clients1

    // Filter by the CAs that belong to the selected team
    const caIds = new Set(cas.map(c => c.id))
    return clients1.filter(c => c.assigned_ca_id && caIds.has(c.assigned_ca_id as string))
  }, [clients1, cas, selectedTeamId])


  // --- KPI Calculations (team-aware via visibleClients) ---
  const totalCAs = cas.length

  const totalClients = visibleClients.length
  const pausedClients = visibleClients.filter((c) => c.is_active === false).length
  const activeClients = visibleClients.filter((c) => c.is_active === true).length
  const submittedClients = visibleClients.filter((c) => c.status === "Completed").length
  const missedToday = visibleClients.filter((c) => c.status === "Started" && (c.jobs_applied ?? 0) === 0).length
  const submissionRate = activeClients > 0
    ? Math.round((submittedClients / activeClients) * 100)
    : 0



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
    setIsResetting(true)
    setResetMsg("Collecting today’s work from clients…")

    try {
      // ✅ First loop: Process all CAs one by one
      for (const ca of cas1) {
        setResetMsg(`Logging work for ${ca.name}...`)
        // --- Fetch all clients worked on by this CA today ---
        // console.log("log data Bhanutejaaa: ", logData)
        const { data: logData, error: logError } = await supabase //data1 or data??
          .from("clients")
          .select(
            'id, name,emails_required, emails_submitted, jobs_applied, status, date_assigned, start_time, end_time, client_designation, work_done_by'
          )
          .eq("work_done_by", ca.id)
        if (logError) {
          alert(`Error logging reset data: ${logError.message}`)
          return
        }
        let totalProfiles = 0;
        for (let index = 0; index < logData.length; index++) {
          const element = logData[index].emails_required;
          if (element == 25) { totalProfiles += 1 }
          else if (element == 40) {
            if (logData[index].emails_submitted >= 40) totalProfiles += 1.5
            else if (logData[index].emails_submitted >= 36) totalProfiles += 1.3
            else if (logData[index].emails_submitted >= 30) totalProfiles += 1.2
            else totalProfiles += 1
          }
          else if (element == 50) {
            if (logData[index].emails_submitted >= 50) totalProfiles += 2
            else if (logData[index].emails_submitted >= 45) totalProfiles += 1.8
            else if (logData[index].emails_submitted >= 41) totalProfiles += 1.7
            else if (logData[index].emails_submitted >= 36) totalProfiles += 1.3
            else if (logData[index].emails_submitted >= 30) totalProfiles += 1.2
            else totalProfiles += 1
          }
        }
        console.log("vivek",totalProfiles);
        let date = new Date();
        date.setDate(date.getDate() - 1);
        let yesterday = date.toISOString().split("T")[0];

        let incentives = ca.role === 'Junior CA' ? totalProfiles <= 2 ? 0 : totalProfiles - 2 : totalProfiles <= 4 ? 0 : totalProfiles - 4;

        const { error: logInsertError } = await supabase
          .from("work_history")
          .insert({
            date: yesterday,
            ca_id: ca.id,
            ca_name: ca.name,
            completed_profiles: logData,
            incentives: incentives,
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
      setResetMsg("Resetting all clients' for a fresh day...")
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
    } finally {
      setIsResetting(false)
      setResetMsg("")
    }
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
            {/* <Button onClick={handleReset}> Reset </Button> */}
            <Button onClick={handleReset} disabled={isResetting}>
              {isResetting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting…
                </span>
              ) : (
                "ResetV"
              )}
            </Button>
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
                <div className="text-2xl font-bold text-green-600">Adding feature soon...</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPI Cards */}
        {/* <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalCAs}</div><div className="text-sm text-slate-600">Total CAs</div></CardContent></Card>
          <Link href="/cro-dashboard/clients" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card></Link>
          <Link href="/cro-dashboard/clients/active" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{activeClients}</div><div className="text-sm text-slate-600">Active Clients</div></CardContent></Card></Link>
          <Link href="/cro-dashboard/clients/paused" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{pausedClients}</div><div className="text-sm text-slate-600">Paused Clients</div></CardContent></Card></Link>
          <Link href="/cro-dashboard/clients/completed" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{submittedClients}</div><div className="text-sm text-slate-600">Submitted</div></CardContent></Card></Link>
          <Link href="/cro-dashboard/clients/inprogress" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{missedToday}</div><div className="text-sm text-slate-600">Inprogress Today</div></CardContent></Card></Link>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{submissionRate}%</div><div className="text-sm text-slate-600">Submission Rate</div></CardContent></Card>
        </div> */}
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalCAs}</div>
              <div className="text-sm text-slate-600">Total CAs</div>
            </CardContent>
          </Card>

          {/* Total Clients */}
          <Link
            href={{
              pathname: "/cro-dashboard/clients",
              query: selectedTeamId ? { teamId: selectedTeamId } : {},
            }}
            className="block"
          >
            <Card className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
                <div className="text-sm text-slate-600">Total Clients</div>
              </CardContent>
            </Card>
          </Link>

          {/* Active Clients */}
          <Link
            href={{
              pathname: "/cro-dashboard/clients/active",
              query: selectedTeamId ? { teamId: selectedTeamId, active: "active" } : { active: "active" },
            }}
            className="block"
          >
            <Card className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{activeClients}</div>
                <div className="text-sm text-slate-600">Active Clients</div>
              </CardContent>
            </Card>
          </Link>

          {/* Paused Clients (inactive) */}
          <Link
            href={{
              pathname: "/cro-dashboard/clients/paused",
              query: selectedTeamId ? { teamId: selectedTeamId, active: "inactive" } : { active: "inactive" },
            }}
            className="block"
          >
            <Card className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{pausedClients}</div>
                <div className="text-sm text-slate-600">Paused Clients</div>
              </CardContent>
            </Card>
          </Link>

          {/* Submitted (Completed) */}
          <Link
            href={{
              pathname: "/cro-dashboard/clients/completed",
              query: selectedTeamId ? { teamId: selectedTeamId, status: "Completed" } : { status: "Completed" },
            }}
            className="block"
          >
            <Card className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{submittedClients}</div>
                <div className="text-sm text-slate-600">Submitted</div>
              </CardContent>
            </Card>
          </Link>

          {/* In-progress Today (for now: status=Started; we’ll refine jobsApplied=0 next step) */}
          <Link
            href={{
              pathname: "/cro-dashboard/clients/inprogress",
              query: selectedTeamId ? { teamId: selectedTeamId, status: "Started" } : { status: "Started" },
            }}
            className="block"
          >
            <Card className="cursor-pointer hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{missedToday}</div>
                <div className="text-sm text-slate-600">Inprogress Today</div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{submissionRate}%</div>
              <div className="text-sm text-slate-600">Submission Rate</div>
            </CardContent>
          </Card>
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
                            {/* <Badge variant="secondary">Incentives : {ca.incentives}</Badge> */}
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
                                    <div className="flex gap-4 items-center">
                                      {/* <Badge>{client.status}</Badge> */}
                                      <span className="w-56 truncate font-medium text-slate-900 mr-16">
                                        {client.name}
                                      </span>
                                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                        {/* <span className="inline-flex items-center gap-1">
                                          <span className="font-semibold">Start:</span> {fmtIST(client.start_time)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <span className="font-semibold">End:</span> {fmtIST(client.end_time)}
                                        </span> */}
                                        <span className="inline-flex items-center gap-1">
                                          <span className="font-semibold">Time Taken:</span> {calcDurationLabel(client.start_time, client.end_time)}
                                        </span>
                                      </div>
                                    </div>
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
                                    <Badge variant="secondary">Emails Received: {client.emails_submitted}</Badge>
                                    <Badge variant="secondary">Jobs Applied: {client.jobs_applied}</Badge>
                                    <Badge
                                      className={client.is_active ? "bg-green-600 text-white" : "bg-red-900 text-white"}
                                    >
                                      {client.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-300"
                                      onClick={() => setConfirmClient({ id: client.id, isActive: client.is_active, caId: ca.id })}
                                    >
                                      {client.is_active ? "Set Inactive" : "Set Active"}
                                    </Button>

                                    {/* Confirmation Dialog */}
                                    <Dialog open={!!confirmClient} onOpenChange={() => setConfirmClient(null)}>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Confirm Status Change</DialogTitle>
                                        </DialogHeader>
                                        <p>
                                          Are you sure you want to{" "}
                                          <span className="font-semibold">
                                            {confirmClient?.isActive ? "set this client as Inactive" : "set this client as Active"}
                                          </span>
                                          ?
                                        </p>
                                        <div className="flex justify-end gap-2 mt-4">
                                          <Button variant="outline" onClick={() => setConfirmClient(null)}>Cancel</Button>
                                          <Button
                                            className={confirmClient?.isActive ? "bg-red-500 text-white" : "bg-green-500 text-white"}
                                            onClick={() => {
                                              if (confirmClient) {
                                                handleToggleActive(confirmClient.id, confirmClient.isActive, confirmClient.caId)
                                                setConfirmClient(null)
                                              }
                                            }}
                                          >
                                            {confirmClient?.isActive ? "Yes, Set Inactive" : "Yes, Set Active"}
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    {/* </div> */}
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
      {isResetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Reset in progress</h2>
            <p className="text-sm text-slate-600 mb-4">{resetMsg || "Please wait while we finalize your reset…"}</p>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
              <div className="h-full bg-slate-800 animate-[indeterminate_1.4s_ease_infinite]" />
            </div>

            <p className="text-xs text-slate-500">
              Do not close this tab until the reset completes.
            </p>
          </div>

          {/* Keyframes for the indeterminate bar */}
          <style jsx>{`
      @keyframes indeterminate {
        0% { transform: translateX(-100%); width: 40%; }
        50% { transform: translateX(30%); width: 50%; }
        100% { transform: translateX(100%); width: 40%; }
      }
    `}</style>
        </div>
      )}
    </div>
  )

}
