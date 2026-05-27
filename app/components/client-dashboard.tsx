// app/components/client-dashboard.tsx

"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Mail, Briefcase, Clock, TrendingUp, User, CalendarDays, ChevronLeft, ChevronRight,
  Activity, BarChart3, FileText, Target, Zap, Flame, CheckCircle2, TrendingDown,
  ChevronUp, ChevronDown as ChevronDownIcon
} from "lucide-react"

interface ClientDashboardProps {
  clientId: string
}

type HistoryRow = {
  date: string
  ca_name: string
  emails_submitted: number
  emails_required: number
  jobs_applied: number
  status: string
  start_time: string | null
  end_time: string | null
  client_designation: string | null
  work_done_by: string | null
}

export function ClientDashboard({ clientId }: ClientDashboardProps) {
  const [client, setClient] = useState<any>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [assignedCA, setAssignedCA] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  
  // Filters
  const [filterCA, setFilterCA] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Designation metrics toggle
  const [desigMetricIdx, setDesigMetricIdx] = useState(0)
  const desigMetrics = ["Duration", "Jobs/hr", "Emails/hr", "Jobs/min", "Emails/min"]
  const activeDesigMetric = desigMetrics[desigMetricIdx]

  const handleNextMetric = () => setDesigMetricIdx(p => (p + 1) % desigMetrics.length)
  const handlePrevMetric = () => setDesigMetricIdx(p => (p - 1 + desigMetrics.length) % desigMetrics.length)

  // Date helpers
  const fmtDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const getMonthRange = (offset: number) => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const next = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
    return { start: fmtDate(start), end: fmtDate(next) }
  }

  const getMonthLabel = (offset: number) => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    return target.toLocaleString("default", { month: "long", year: "numeric" })
  }

  const activeRange = useMemo(() => {
    if (dateRange.from && dateRange.to) {
      // For custom range, we want to include the 'to' date
      // getMonthRange returns {start: inclusive, end: exclusive}
      // so we add 1 day to 'to' for consistency with the filter logic
      const nextDay = new Date(dateRange.to)
      nextDay.setDate(nextDay.getDate() + 1)
      
      return {
        start: fmtDate(dateRange.from),
        end: fmtDate(nextDay),
        label: `${dateRange.from.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${dateRange.to.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
      }
    }
    const range = getMonthRange(monthOffset)
    return { ...range, label: getMonthLabel(monthOffset) }
  }, [dateRange, monthOffset])

  const [onboardingDate, setOnboardingDate] = useState<string | null>(null)

  // Fetch client details
  useEffect(() => {
    const fetchClient = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single()

      if (!error && data) {
        setClient(data)

        // Fetch assigned CA details
        if (data.assigned_ca_id) {
          const { data: caData } = await supabase
            .from("users")
            .select("id, name, email, designation, role")
            .eq("id", data.assigned_ca_id)
            .single()
          setAssignedCA(caData)
        }

        // Fetch oldest date_assigned from work_history_profiles for Client Onboarding Date via API
        try {
          const statsResponse = await fetch("/api/client-onboarding-stats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ clientIds: [clientId] }),
          })
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            if (statsData.onboardingDates && statsData.onboardingDates[clientId]) {
              setOnboardingDate(statsData.onboardingDates[clientId])
            } else {
              setOnboardingDate(null)
            }
          } else {
            setOnboardingDate(null)
          }
        } catch (err) {
          console.error("Error fetching onboarding date:", err)
          setOnboardingDate(null)
        }
      }
      setLoading(false)
    }
    fetchClient()
  }, [clientId])

  // Fetch work history profiles for this client
  useEffect(() => {
    const fetchHistory = async () => {
      const { start, end } = activeRange

      const { data, error } = await supabase
        .from("work_history_profiles")
        .select(`
          emails_submitted,
          emails_required,
          jobs_applied,
          status,
          start_time,
          end_time,
          client_designation,
          work_done_by,
          work_history:work_history_id (
            date,
            ca_name
          )
        `)
        .eq("client_id", clientId)
        .not("work_history", "is", null)

      if (error) {
        console.error("Error fetching history:", error)
        return
      }

      // Flatten join and filter by date range
      const rows: HistoryRow[] = (data || [])
        .filter((r: any) => {
          const d = r.work_history?.date
          return d && d >= start && d < end
        })
        .map((r: any) => ({
          date: r.work_history?.date || "",
          ca_name: r.work_history?.ca_name || "—",
          emails_submitted: r.emails_submitted || 0,
          emails_required: r.emails_required || 25,
          jobs_applied: r.jobs_applied || 0,
          status: r.status || "—",
          start_time: r.start_time || null,
          end_time: r.end_time || null,
          client_designation: r.client_designation || null,
          work_done_by: r.work_done_by || null,
        }))
        .sort((a, b) => (a.date < b.date ? 1 : -1))

      setHistory(rows)
    }
    fetchHistory()
  }, [clientId, activeRange])

  // Filtered history
  const filteredHistory = useMemo(() => {
    return history.filter((r) => {
      if (filterCA !== "all" && r.ca_name !== filterCA) return false
      if (filterStatus !== "all" && r.status !== filterStatus) return false
      return true
    })
  }, [history, filterCA, filterStatus])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterCA, filterStatus, activeRange])

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Unique lists for filter dropdowns
  const uniqueCAs = useMemo(() => Array.from(new Set(history.map(r => r.ca_name))), [history])
  const uniqueStatuses = useMemo(() => Array.from(new Set(history.map(r => r.status))), [history])

  // Analytics calculations based on FILTERED history
  const analytics = useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        totalEmails: 0,
        totalJobs: 0,
        avgEmails: 0,
        avgJobs: 0,
        completionRate: 0,
        totalWorkingDays: 0,
        avgDurationMin: 0,
        caBreakdown: [] as { name: string; days: number; emails: number; jobs: number; durationMin: number; designations: { name: string; durationMin: number; jobs: number; emails: number }[] }[],
      }
    }

    const totalEmails = filteredHistory.reduce((sum, r) => sum + r.emails_submitted, 0)
    const totalJobs = filteredHistory.reduce((sum, r) => sum + r.jobs_applied, 0)
    const completedDays = filteredHistory.filter((r) => r.status === "Completed").length
    const totalWorkingDays = filteredHistory.length

    // Average duration
    let totalDuration = 0
    let durationCount = 0
    for (const r of filteredHistory) {
      if (r.start_time && r.end_time) {
        const st = new Date(r.start_time).getTime()
        const et = new Date(r.end_time).getTime()
        if (!isNaN(st) && !isNaN(et) && et > st) {
          totalDuration += (et - st) / 60000
          durationCount++
        }
      }
    }
    // CA breakdown
    const caMap = new Map<string, { days: number; emails: number; jobs: number; durationMin: number; designations: Map<string, {durationMin: number; jobs: number; emails: number}> }>()
    for (const r of filteredHistory) {
      const key = r.ca_name || "Unknown"
      const prev = caMap.get(key) || { days: 0, emails: 0, jobs: 0, durationMin: 0, designations: new Map() }
      
      let rDur = 0
      if (r.start_time && r.end_time) {
        const st = new Date(r.start_time).getTime()
        const et = new Date(r.end_time).getTime()
        if (!isNaN(st) && !isNaN(et) && et > st) {
          rDur = (et - st) / 60000
        }
      }

      const desig = r.client_designation || "Unknown"
      const prevD = prev.designations.get(desig) || { durationMin: 0, jobs: 0, emails: 0 }
      prev.designations.set(desig, {
        durationMin: prevD.durationMin + rDur,
        jobs: prevD.jobs + r.jobs_applied,
        emails: prevD.emails + r.emails_submitted
      })

      caMap.set(key, { 
        days: prev.days + 1, 
        emails: prev.emails + r.emails_submitted,
        jobs: prev.jobs + r.jobs_applied,
        durationMin: prev.durationMin + rDur,
        designations: prev.designations
      })
    }

    return {
      totalEmails,
      totalJobs,
      avgEmails: totalWorkingDays > 0 ? Math.round(totalEmails / totalWorkingDays) : 0,
      avgJobs: totalWorkingDays > 0 ? Math.round(totalJobs / totalWorkingDays) : 0,
      completionRate: totalWorkingDays > 0 ? Math.round((completedDays / totalWorkingDays) * 100) : 0,
      totalWorkingDays,
      avgDurationMin: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      caBreakdown: Array.from(caMap.entries()).map(([name, data]) => ({
        name,
        days: data.days,
        emails: data.emails,
        jobs: data.jobs,
        durationMin: data.durationMin,
        designations: Array.from(data.designations.entries()).map(([d, stats]) => ({ name: d, durationMin: stats.durationMin, jobs: stats.jobs, emails: stats.emails }))
      })),
    }
  }, [filteredHistory])

  // Time formatters
  const fmtIST = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-IN", {
          hour12: true, hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
        })
      : "—"

  const calcDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "—"
    const st = new Date(start).getTime()
    const et = new Date(end).getTime()
    if (isNaN(st) || isNaN(et) || et < st) return "—"
    const mins = Math.round((et - st) / 60000)
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }

  const calcJobsHr = (start: string | null, end: string | null, jobs: number) => {
    if (!start || !end) return "—"
    const st = new Date(start).getTime()
    const et = new Date(end).getTime()
    if (isNaN(st) || isNaN(et) || et <= st) return "—"
    
    const minsRaw = (et - st) / 60000
    // Strictly require at least 1 minute of work to calculate velocity,
    // otherwise a few seconds will incorrectly project into huge numbers.
    if (minsRaw < 1) return "0.0"
    
    return ((jobs / minsRaw) * 60).toFixed(1)
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading client dashboard…</div>
  if (!client) return <div className="p-8 text-center text-red-500">Client not found.</div>

  return (
    <div className="space-y-6">
      {/* Client Info Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Client Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Name</p>
                <p className="font-semibold text-slate-900">{client.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                <p className="text-sm text-slate-700 break-all">{client.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Designation</p>
                <p className="text-sm text-slate-700">{client.client_designation || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Experience</p>
                <p className="text-sm text-slate-700">{client.experience != null ? `${client.experience} yrs` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Visa Type</p>
                <p className="text-sm text-slate-700">{client.visa_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Sponsorship</p>
                <Badge variant={client.sponsorship ? "default" : "secondary"}>
                  {client.sponsorship ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">ApplyWizz ID</p>
                <p className="text-sm text-slate-700 font-mono">{client.applywizz_id || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Emails Required</p>
                <p className="text-sm font-semibold text-blue-600">{client.emails_required ?? 25}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                <Badge
                  className={
                    client.status === "Completed" ? "bg-green-500 text-white"
                    : client.status === "Started" ? "bg-orange-500 text-white"
                    : client.status === "Paused" ? "bg-white text-black border border-slate-300"
                    : "bg-red-500 text-white"
                  }
                >
                  {client.status || "Not Started"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Client Onboarding Date</p>
                <p className="text-sm text-slate-700 font-semibold">
                  {onboardingDate 
                    ? new Date(onboardingDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) 
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned CA Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-green-600" />
              Assigned CA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedCA ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Name</p>
                  <p className="font-semibold text-slate-900">{assignedCA.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Email</p>
                  <p className="text-sm text-slate-700 break-all">{assignedCA.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Role</p>
                  <Badge variant="outline">{assignedCA.role || assignedCA.designation || "CA"}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No CA assigned</p>
            )}
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-slate-500 uppercase">Active Status</p>
              <Badge className={client.is_active ? "bg-green-600 text-white mt-1" : "bg-red-600 text-white mt-1"}>
                {client.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-semibold">{activeRange.label}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg mr-2 shrink-0">
                <Button 
                  variant={!dateRange.from ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 text-xs px-3"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Monthly
                </Button>
                <Button 
                  variant={dateRange.from ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 text-xs px-3"
                  onClick={() => {
                    if (!dateRange.from) {
                      const now = new Date()
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                      setDateRange({ from: startOfMonth, to: now })
                    }
                  }}
                >
                  Custom
                </Button>
              </div>

              {dateRange.from ? (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider -mb-0.5 ml-0.5">From</span>
                      <Input 
                        type="date" 
                        className="h-8 text-xs w-[135px] px-2 bg-white border-slate-200"
                        value={fmtDate(dateRange.from)}
                        onChange={(e) => {
                          const d = e.target.value ? new Date(e.target.value) : undefined
                          if (d) setDateRange(prev => ({ ...prev, from: d }))
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider -mb-0.5 ml-0.5">To</span>
                      <Input 
                        type="date" 
                        className="h-8 text-xs w-[135px] px-2 bg-white border-slate-200"
                        value={dateRange.to ? fmtDate(dateRange.to) : ""}
                        onChange={(e) => {
                          const d = e.target.value ? new Date(e.target.value) : undefined
                          if (d) setDateRange(prev => ({ ...prev, to: d }))
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setMonthOffset(p => p - 1)} className="h-8">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMonthOffset(0)} className="h-8 px-3">
                    This Month
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMonthOffset(p => p + 1)} disabled={monthOffset >= 0} className="h-8">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics KPIs (Standard Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-slate-500 mb-1">Total Emails</p>
            <p className="text-xl font-bold text-slate-800">{analytics.totalEmails}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-slate-500 mb-1">Avg Emails/Day</p>
            <p className="text-xl font-bold text-slate-800">{analytics.avgEmails}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-slate-500 mb-1">Total Jobs</p>
            <p className="text-xl font-bold text-slate-800">{analytics.totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-slate-500 mb-1">Completion Rate</p>
            <p className="text-xl font-bold text-slate-800">{analytics.completionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-slate-500 mb-1">Avg Duration</p>
            <p className="text-xl font-bold text-slate-800">{analytics.avgDurationMin}m</p>
          </CardContent>
        </Card>
      </div>

      {/* CA Performance Breakdown */}
      {analytics.caBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              CA Performance Breakdown — {activeRange.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {analytics.caBreakdown.map((ca) => (
                <div key={ca.name} className="flex flex-col min-w-[320px] max-w-[320px] p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow shrink-0">
                  <div className="flex items-center justify-between mb-3 border-b pb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{ca.name}</p>
                      <p className="text-xs text-slate-500">{ca.days} working day{ca.days !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-xs text-slate-500">Total Emails</p>
                      <p className="font-medium text-slate-800">{ca.emails}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Jobs</p>
                      <p className="font-medium text-slate-800">{ca.jobs}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 font-medium">{activeDesigMetric} by Designation</p>
                      <div className="flex flex-col">
                        <ChevronUp className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700" onClick={handlePrevMetric} />
                        <ChevronDownIcon className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700 -mt-1" onClick={handleNextMetric} />
                      </div>
                    </div>
                    {ca.designations.map((d, i) => {
                      let displayVal = "";
                      let unitVal = "";
                      if (activeDesigMetric === "Duration") {
                        displayVal = `${Math.floor(d.durationMin / 60)}h ${Math.round(d.durationMin % 60)}m`;
                      } else if (activeDesigMetric === "Jobs/hr") {
                        displayVal = d.durationMin >= 1 ? ((d.jobs / d.durationMin) * 60).toFixed(1) : "0.0";
                        unitVal = " Jobs/hr";
                      } else if (activeDesigMetric === "Emails/hr") {
                        displayVal = d.durationMin >= 1 ? ((d.emails / d.durationMin) * 60).toFixed(1) : "0.0";
                        unitVal = " Emails/hr";
                      } else if (activeDesigMetric === "Jobs/min") {
                        displayVal = d.durationMin >= 1 ? (d.jobs / d.durationMin).toFixed(2) : "0.00";
                        unitVal = " Jobs/min";
                      } else if (activeDesigMetric === "Emails/min") {
                        displayVal = d.durationMin >= 1 ? (d.emails / d.durationMin).toFixed(2) : "0.00";
                        unitVal = " Emails/min";
                      }
                      return (
                        <div key={i} className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-700 truncate mr-2" title={d.name}>{d.name}</span>
                          <span className="font-medium text-slate-900 whitespace-nowrap">
                            {displayVal}
                            {unitVal && <span className="text-[10px] text-slate-500 ml-1 font-normal">{unitVal}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work History Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-slate-600" />
              Daily Work History — {activeRange.label}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={filterCA} onValueChange={setFilterCA}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue placeholder="All CAs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All CAs</SelectItem>
                  {uniqueCAs.map(ca => (
                    <SelectItem key={ca} value={ca}>{ca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No work history found for this month with the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>CA Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-center">Emails Req</TableHead>
                    <TableHead className="text-center">Emails Sent</TableHead>
                    <TableHead className="text-center">Jobs Applied</TableHead>
                    <TableHead className="text-center text-indigo-600">Jobs/hr</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistory.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {new Date(`${row.date}T00:00:00`).toLocaleDateString("en-IN", {
                          weekday: "short", day: "2-digit", month: "short",
                        })}
                      </TableCell>
                      <TableCell>{row.ca_name}</TableCell>
                      <TableCell className="text-sm text-slate-600">{row.client_designation || "—"}</TableCell>
                      <TableCell className="text-center">{row.emails_required}</TableCell>
                      <TableCell className="text-center font-semibold">{row.emails_submitted}</TableCell>
                      <TableCell className="text-center">{row.jobs_applied}</TableCell>
                      <TableCell className="text-center text-sm font-medium text-indigo-600 bg-indigo-50/30">
                        {calcJobsHr(row.start_time, row.end_time, row.jobs_applied)}
                      </TableCell>
                      <TableCell className="text-sm">{fmtIST(row.start_time)}</TableCell>
                      <TableCell className="text-sm">{fmtIST(row.end_time)}</TableCell>
                      <TableCell className="text-sm">{calcDuration(row.start_time, row.end_time)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            row.status === "Completed" ? "bg-green-100 text-green-800"
                            : row.status === "Started" ? "bg-orange-100 text-orange-800"
                            : row.status === "Paused" ? "bg-slate-100 text-slate-700"
                            : "bg-red-100 text-red-800"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} entries
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <span className="text-sm text-slate-700 font-medium px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
