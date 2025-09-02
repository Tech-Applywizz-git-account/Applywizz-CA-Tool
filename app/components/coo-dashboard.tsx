

// app/components/coo-dashboard.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NewClientForm } from "./new-client-form"
import { AlertTriangle, AlertCircle, Loader2, Plus, FileSpreadsheet } from "lucide-react"
import Link from "next/link"

interface COODashboardProps {
  user: any
  onLogout: () => void
}

type Team = { id: string; name: string | null }
type CAUser = { id: string; name: string; email: string; designation: string | null; team_id: string | null }
type Client = {
  id: string
  name: string | null
  email: string
  status: "Not Started" | "Started" | "Paused" | "Completed" | string
  assigned_ca_id: string | null
  team_id: string | null
  emails_submitted: number | null
  jobs_applied: number | null
  date_assigned: string | null
  is_active: boolean | null
  work_done_by: string | null
  start_time?: string | null
  end_time?: string | null
  remarks?: string | null
  date?: string | null
}

export function COODashboard({ user, onLogout }: COODashboardProps) {
  // --------- Filters / UI state ----------
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("all")

  const [dateFrom, setDateFrom] = useState<string>(new Date().toISOString().split("T")[0])
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split("T")[0])

  const [loading, setLoading] = useState(false)
  const [loadingCAs, setLoadingCAs] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)

  // --------- Data caches ----------
  const [cas, setCAs] = useState<CAUser[]>([])          // filtered by team (or all)
  const [casAll, setCAsAll] = useState<CAUser[]>([])    // unfiltered (for reset processing)
  const [clients, setClients] = useState<Client[]>([])   // filtered by team + date range
  const [clientsAll, setClientsAll] = useState<Client[]>([]) // unfiltered cache for misc ops

  // --------- Expandable rows ----------
  const [expandedCA, setExpandedCA] = useState<string | null>(null)
  const [caClients, setCaClients] = useState<Record<string, Client[]>>({})

  // --------- Confirmation dialog for active toggle ----------
  const [confirmClient, setConfirmClient] = useState<{ id: string; isActive: boolean; caId: string } | null>(null)

  // --------- Import modal placeholders (optional parity with CRO) ----------
  const [importOpen, setImportOpen] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [importStatus, setImportStatus] = useState("")
  const [newClientOpen, setNewClientOpen] = useState(false) // placeholder if you later reuse <NewClientForm/>

  // --------- Reset overlay (parity with CRO) ----------
  const [isResetting, setIsResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState<string>("")
  const [clients1, setClients1] = useState<Client[]>([]) // unfiltered cache (parity with CRO)

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from("teams").select("id, name")
      if (!error && data) setTeams(data)
    }
    fetchTeams()
  }, [])

  useEffect(() => {
    const fetchCAs = async () => {
      setLoadingCAs(true)
      let query = supabase
        .from("users")
        .select("id, name, email, designation, team_id")
        .in("role", ["CA", "Junior CA"])

      if (selectedTeam !== "all") {
        query = query.eq("team_id", selectedTeam)
      }
      const { data, error } = await query
      if (!error && data) setCAs(data as CAUser[])
      setLoadingCAs(false)
    }
    fetchCAs()
  }, [selectedTeam])

  // Unfiltered CAs (used in reset, mirrors CRO’s cas1)
  useEffect(() => {
    const fetchCAsAll = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, designation, team_id, role")
        .in("role", ["CA", "Junior CA"])
      if (!error && data) setCAsAll(data as any)
    }
    fetchCAsAll()
  }, [])


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

  // Unfiltered clients cache (mirrors CRO’s clients1)
  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
      if (!error && data) setClients1(data)
      console.log('Clients:', data)  
    }
    fetchClients()
  }, [])


  const [caPerformanceToday, setCaPerformanceToday] = useState<Record<string, any>>({})
  const [caPerformanceRange, setCaPerformanceRange] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchCAData = async () => {
      if (cas.length === 0) {
        setCaPerformanceToday({})
        setCaPerformanceRange({})
        return
      }

      const today = new Date().toISOString().split("T")[0]
      const caIds = cas.map((c) => c.id)

      // "Today" logs from clients table (same as CRO)
      const { data: logs, error } = await supabase
        .from("clients")
        .select("work_done_by, emails_submitted, jobs_applied, status")
        .in("work_done_by", caIds)
        .eq("date", today)
      if (error) {
        console.error("Error fetching work logs:", error)
      }

      // Historical from work_history (range)
      const { data: histByCA, error: histErr } = await supabase
        .from("work_history")
        .select(`ca_id, date, completed_profiles`)
        .in("ca_id", caIds)
        .gte("date", dateFrom)
        .lte("date", dateTo)

      // For workingDays baseline, use all histories in range
      const { data: histAll, error: histAllErr } = await supabase
        .from("work_history")
        .select(`ca_id, date, completed_profiles`)
        .gte("date", dateFrom)
        .lte("date", dateTo)

      const workingDays = [...new Set((histAll || []).map((item: any) => item.date))].length

      // Aggregate today
      const perfToday: Record<string, any> = {}
      for (const ca of cas) {
        const caLogs = (logs || []).filter((l) => l.work_done_by === ca.id)
        if (caLogs.length > 0) {
          const totalEmails = caLogs.reduce((sum, l: any) => sum + (l.emails_submitted || 0), 0)
          const totalJobs = caLogs.reduce((sum, l: any) => sum + (l.jobs_applied || 0), 0)
          const lastStatus = caLogs[caLogs.length - 1].status
          perfToday[ca.id] = { ...ca, emails_submitted: totalEmails, jobs_applied: totalJobs, status: lastStatus, incentives: 0 }
        } else {
          perfToday[ca.id] = { ...ca, emails_submitted: 0, jobs_applied: 0, status: "Not Yet Started", incentives: 0 }
        }
      }
      setCaPerformanceToday(perfToday)

      // Aggregate range
      const perfRange: Record<string, any> = {}
      for (const ca of cas) {
        const rows = (histByCA || []).filter((r: any) => r.ca_id === ca.id)
        if (rows.length > 0) {
          const totalProfiles = rows.reduce((sum: number, r: any) => {
            const len = Array.isArray(r.completed_profiles) ? r.completed_profiles.length : 0
            return sum + len
          }, 0)

          const baseline = (ca.designation === "Junior CA" ? 2 : 4) * (workingDays || 0)
          const incentive = Math.max(0, totalProfiles - baseline)

          perfRange[ca.id] = { ...ca, totalProfiles, incentives: incentive, totalWorkingDays: workingDays }
        } else {
          perfRange[ca.id] = { ...ca, incentives: 0, totalProfiles: 0, totalWorkingDays: workingDays }
        }
      }
      setCaPerformanceRange(perfRange)
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
    setCaClients((prev) => ({ ...prev, [caId]: (data as Client[]) || [] }))
    setExpandedCA(caId)
  }

  const handleToggleActive = async (clientId: string, currentIsActive: boolean, caId?: string) => {
    const { data, error } = await supabase
      .from("clients")
      .update({ is_active: !currentIsActive })
      .eq("id", clientId)
      .select("id, is_active")
      .single()

    if (error) {
      alert("Failed to toggle active state: " + error.message)
      return
    }

    if (caId) {
      setCaClients((prev) => ({
        ...prev,
        [caId]: (prev[caId] || []).map((c) => (c.id === clientId ? { ...c, is_active: data?.is_active ?? !currentIsActive } : c)),
      }))
    }

    // Keep caches in sync
    setClientsAll((prev) => prev.map((c) => (c.id === clientId ? { ...c, is_active: data?.is_active ?? !currentIsActive } : c)))
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, is_active: data?.is_active ?? !currentIsActive } : c)))
  }


  const totalCAs = cas.length
  const totalClients = clients1.length
  const submittedClients = clients1.filter((c) => c.status === "Completed").length
  const missedToday = clients1.filter((c) => c.status === "Started" && (c.jobs_applied || 0) === 0).length
  const pausedClients = clients1.filter((c) => c.is_active === false).length
  const activeClients = clients1.filter((c) => c.is_active === true).length
  const submissionRate = activeClients > 0 ? Math.round((submittedClients / activeClients) * 100) : 0

  const alerts = useMemo(() => {
    const out: { message: string; level: "HIGH" | "MEDIUM" }[] = []
    const grouped = groupBy(clients, "team_id")

    Object.entries(grouped).forEach(([teamId, arr]) => {
      const tName = (selectedTeam !== "all"
        ? teams.find((t) => t.id === selectedTeam)?.name
        : teams.find((t) => t.id === teamId)?.name) || "Unnamed Team"

      const submitted = arr.filter((c) => c.status === "Completed").length
      const active = arr.filter((c) => c.is_active).length
      const rate = active > 0 ? (submitted / active) * 100 : 0
      const missed = arr.filter((c) => c.status === "Started" && (c.jobs_applied || 0) === 0).length

      if (missed > 5) out.push({ message: `${tName}: ${missed} clients missed today`, level: "HIGH" })
      if (rate < 60) out.push({ message: `${tName}: submission rate below 60%`, level: "HIGH" })
      if (arr.some((c) => c.status === "Paused")) out.push({ message: `${tName}: has paused clients`, level: "MEDIUM" })
    })

    return out
  }, [clients, teams, selectedTeam])

  function groupBy<T extends Record<string, any>>(arr: T[], key: keyof T) {
    return arr.reduce<Record<string, T[]>>((acc, item) => {
      const k = String(item[key] ?? "none")
      if (!acc[k]) acc[k] = []
      acc[k].push(item)
      return acc
    }, {})
  }

  const handleGoogleSheetsImport = async () => {
    if (!sheetsUrl) {
      setImportStatus("Please enter a valid Google Sheets URL")
      return
    }
    setImportStatus("Importing data from Google Sheets...")
    setTimeout(() => {
      setImportStatus("Successfully imported data from Google Sheets")
      setSheetsUrl("")
      setTimeout(() => {
        setImportOpen(false)
        setImportStatus("")
      }, 1200)
    }, 1200)
  }


  const handleReset = async () => {
    setIsResetting(true)
    setResetMsg("Collecting today’s work from clients…")

    try {
      // Process each CA (using casAll like CRO)
      for (const ca of casAll as any[]) {
        setResetMsg(`Logging work for ${ca.name}...`)
        const { data: logData, error: logError } = await supabase
          .from("clients")
          .select("id, name, emails_submitted, jobs_applied, status, date_assigned, start_time, end_time, client_designation, work_done_by")
          .eq("work_done_by", ca.id)

        if (logError) {
          alert(`Error logging reset data: ${logError.message}`)
          return
        }

        const today = new Date().toISOString().split("T")[0]
        const quota = ca.designation === "Junior CA" ? 2 : 4
        const noofprofiles = Math.max(0, (logData?.length || 0) - quota)

        const { error: insertErr } = await supabase
          .from("work_history")
          .insert({
            date: today,
            ca_id: ca.id,
            ca_name: ca.name,
            completed_profiles: logData || [],
            incentives: noofprofiles,
          })

        if (insertErr) {
          alert("Error logging reset data")
          console.error(insertErr)
          return
        }
      }

      setResetMsg("Resetting all clients for a fresh day...")
      // Reset all clients (batch by id — loop kept for parity)
      for (const client of clientsAll) {
        const today = new Date().toISOString().split("T")[0]
        const { error: resetErr } = await supabase
          .from("clients")
          .update({
            status: "Not Started",
            emails_submitted: 0,
            jobs_applied: 0,
            work_done_by: null,
            start_time: null,
            end_time: null,
            remarks: null,
            date: today,
          })
          .eq("id", client.id)
        if (resetErr) {
          alert("Error resetting daily data")
          return
        }
      }

      alert("Reset today's data successfully!")
      // Refresh filtered lists
      setExpandedCA(null)
      setCaClients({})
      // Re-run main fetchers cheaply:
      setDateFrom((d) => d) // trigger effects
    } finally {
      setIsResetting(false)
      setResetMsg("")
    }
  }

  useEffect(() => {
    setLoading(loadingCAs || loadingClients)
  }, [loadingCAs, loadingClients])

  const isToday =
    dateFrom === new Date().toISOString().split("T")[0] &&
    dateTo === new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">COO Dashboard</h1>
            <p className="text-slate-600">Team-level operations & CA productivity</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Optional: Import like CRO */}
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import from Google Sheets
            </Button>
            {/* Placeholder New Client (kept for parity) */}
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
            <Button onClick={handleReset} disabled={isResetting}>
              {isResetting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting…
                </span>
              ) : (
                "Reset"
              )}
            </Button>
          </div>
        </div>

        {/* Import Dialog */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Data from Google Sheets</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700">Google Sheets URL</label>
              <Input
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              {importStatus && <div className="text-sm">{importStatus}</div>}
              <Button onClick={handleGoogleSheetsImport}>Import</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Select Team</label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name || "Unnamed Team"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            </div>
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

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Critical Team Alerts (filtered)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${alert.level === "HIGH" ? "bg-red-100" : "bg-orange-100"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.level === "HIGH" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                    <span className={alert.level === "HIGH" ? "text-red-800" : "text-orange-800"}>
                      {alert.message}
                    </span>
                  </div>
                  <Badge variant={alert.level === "HIGH" ? "destructive" : "outline"}>{alert.level}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* KPI Cards (filtered) */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalCAs}</div><div className="text-sm text-slate-600">Total CAs</div></CardContent></Card>
          {/* <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card> */}
          <Link href="/coo-dashboard/clients" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalClients}</div><div className="text-sm text-slate-600">Total Clients</div></CardContent></Card></Link>
          {/* <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{activeClients}</div><div className="text-sm text-slate-600">Active Clients</div></CardContent></Card> */}
          <Link href="/coo-dashboard/clients/active" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{activeClients}</div><div className="text-sm text-slate-600">Active Clients</div></CardContent></Card></Link>
          {/* <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{pausedClients}</div><div className="text-sm text-slate-600">Paused Clients</div></CardContent></Card> */}
          <Link href="/coo-dashboard/clients/paused" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{pausedClients}</div><div className="text-sm text-slate-600">Paused Clients</div></CardContent></Card></Link>
          {/* <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{submittedClients}</div><div className="text-sm text-slate-600">Submitted</div></CardContent></Card> */}
          <Link href="/coo-dashboard/clients/completed" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{submittedClients}</div><div className="text-sm text-slate-600">Submitted</div></CardContent></Card></Link>
          {/* <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{missedToday}</div><div className="text-sm text-slate-600">Missed Today</div></CardContent></Card> */}
          <Link href="/coo-dashboard/clients/inprogress" className="block"><Card className="cursor-pointer hover:shadow-md transition"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{missedToday}</div><div className="text-sm text-slate-600">Missed Today</div></CardContent></Card></Link>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{submissionRate}%</div><div className="text-sm text-slate-600">Submission Rate</div></CardContent></Card>
        </div>

        {/* Today vs Range CA list (same behavior as CRO) */}
        {isToday ? (
          <>
            {loading && <div className="text-center my-4 text-blue-600 font-semibold text-lg">Loading...</div>}

            {!loading && (
              <Card>
                <CardHeader><CardTitle>Career Associates (Today)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(caPerformanceToday).map((ca: any) => (
                      <div key={ca.id} className="flex flex-col border rounded-lg bg-white">
                        {/* CA Summary Row */}
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

                        {/* Expanded Clients */}
                        {expandedCA === ca.id && (
                          <div className="p-4 bg-slate-50 border-t">
                            {caClients[ca.id]?.length > 0 ? (
                              <ul className="space-y-2">
                                {caClients[ca.id].map((client) => (
                                  <li key={client.id} className="flex justify-between p-2 bg-white rounded border">
                                    <div className="flex gap-2 items-center">
                                      <span className="w-56 truncate font-medium text-slate-900">
                                        {client.name}
                                      </span>
                                      {/* Status colored badge */}
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
                                      <Badge variant="secondary">Emails Received: {client.emails_submitted ?? 0}</Badge>
                                      <Badge variant="secondary">Jobs Applied: {client.jobs_applied ?? 0}</Badge>
                                      <Badge className={client.is_active ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                                        {client.is_active ? "Active" : "Inactive"}
                                      </Badge>

                                      {/* Toggle button opens confirmation dialog */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-blue-300"
                                        onClick={() => setConfirmClient({ id: client.id, isActive: !!client.is_active, caId: ca.id })}
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
        ) : (
          <>
            {loading && <div className="text-center my-4 text-blue-600 font-semibold text-lg">Loading...</div>}

            {!loading && (
              <Card>
                <CardHeader><CardTitle>Career Associates (Range)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(caPerformanceRange).map((ca: any) => (
                      <div key={ca.id} className="flex flex-col border rounded-lg bg-white">
                        <div
                          className="flex items-center justify-between p-4"
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
        )}
      </div>

      {/* Reset overlay */}
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
            <p className="text-xs text-slate-500">Do not close this tab until the reset completes.</p>
          </div>

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
