// app/components/client-assessments-tracker.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Search, Building2, Eye, FileText, ArrowUpDown, Loader2 } from "lucide-react"
import Link from "next/link"

interface ClientAssessmentsTrackerProps {
  user: any
  scope: "team-lead" | "executive"
  teamMembers?: any[] // Only passed for team-lead to help with filtering
  clients: any[] // In scope clients (already filtered by TL team, or all clients for executive)
}

export function ClientAssessmentsTracker({ user, scope, teamMembers = [], clients }: ClientAssessmentsTrackerProps) {
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applicationDaysMap, setApplicationDaysMap] = useState<Map<string, number>>(new Map())
  const [loadingDays, setLoadingDays] = useState(false)

  // Compute base path dynamic based on user role
  const basePath = useMemo(() => {
    if (!user || !user.role) return ""
    const role = user.role.toLowerCase().replace(" ", "-")
    return `/${role}-dashboard`
  }, [user])

  // Filters
  const todayStr = new Date().toISOString().split("T")[0]
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [assessmentType, setAssessmentType] = useState("all")
  const [companySearch, setCompanySearch] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [selectedCA, setSelectedCA] = useState("all")

  // Selected Image for Preview Dialog
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState<"summary" | "comparison" | "logs">("summary")

  // Cohort comparison bucket filter
  const [selectedCohort, setSelectedCohort] = useState<string>("all")

  // Dialog for Unique Companies
  const [showUniqueCompaniesDialog, setShowUniqueCompaniesDialog] = useState(false)
  const [modalCompanySearch, setModalCompanySearch] = useState("")

  // Reset modal search on close
  useEffect(() => {
    if (!showUniqueCompaniesDialog) {
      setModalCompanySearch("")
    }
  }, [showUniqueCompaniesDialog])

  // Fetch assessments
  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("client_assessments")
          .select("*")
          .order("assessment_received_date", { ascending: false })

        if (!error && data) {
          setAssessments(data)
        }
      } catch (err) {
        console.error("Error fetching client assessments:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAssessments()
  }, [])

  useEffect(() => {
    const fetchApplicationDays = async () => {
      if (!clients || clients.length === 0) return
      setLoadingDays(true)
      try {
        const clientIds = clients.map(c => c.id)
        const response = await fetch("/api/client-onboarding-stats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientIds }),
        })

        if (response.ok) {
          const resData = await response.json()
          const counts = new Map<string, number>()
          if (resData.counts) {
            Object.keys(resData.counts).forEach(key => {
              counts.set(key, resData.counts[key])
            })
          }
          setApplicationDaysMap(counts)
        } else {
          console.error("Failed to fetch application days from API:", response.statusText)
        }
      } catch (err) {
        console.error("Error fetching application days count:", err)
      } finally {
        setLoadingDays(false)
      }
    }
    fetchApplicationDays()
  }, [clients])

  // Create a map/set of client IDs that are in-scope
  const inScopeClientIds = useMemo(() => new Set(clients.map(c => c.id)), [clients])
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter(item => {
      // 1. Scope filter (must belong to in-scope clients)
      if (!inScopeClientIds.has(item.client_id)) return false

      // 2. Date filters (assessment_received_date)
      if (dateFrom && item.assessment_received_date < dateFrom) return false
      if (dateTo && item.assessment_received_date > dateTo) return false

      // 3. Type filter
      if (assessmentType !== "all" && item.assessment_type !== assessmentType) return false

      // 4. Company Search
      if (companySearch.trim() && !item.company_name?.toLowerCase().includes(companySearch.toLowerCase())) return false

      // 5. CA Filter
      if (selectedCA !== "all" && item.created_by !== selectedCA) return false

      // 6. Client Search
      if (clientSearch.trim()) {
        const client = clientsMap.get(item.client_id)
        const clientName = client?.name?.toLowerCase() || ""
        const clientEmail = client?.email?.toLowerCase() || ""
        const query = clientSearch.toLowerCase()
        if (!clientName.includes(query) && !clientEmail.includes(query)) return false
      }

      return true
    })
  }, [assessments, inScopeClientIds, dateFrom, dateTo, assessmentType, companySearch, selectedCA, clientSearch, clientsMap])

  // Stats computed from assessments filtered by all criteria EXCEPT assessmentType
  const statsAssessments = useMemo(() => {
    return assessments.filter(item => {
      // 1. Scope filter (must belong to in-scope clients)
      if (!inScopeClientIds.has(item.client_id)) return false

      // 2. Date filters (assessment_received_date)
      if (dateFrom && item.assessment_received_date < dateFrom) return false
      if (dateTo && item.assessment_received_date > dateTo) return false

      // 3. Company Search
      if (companySearch.trim() && !item.company_name?.toLowerCase().includes(companySearch.toLowerCase())) return false

      // 4. CA Filter
      if (selectedCA !== "all" && item.created_by !== selectedCA) return false

      // 5. Client Search
      if (clientSearch.trim()) {
        const client = clientsMap.get(item.client_id)
        const clientName = client?.name?.toLowerCase() || ""
        const clientEmail = client?.email?.toLowerCase() || ""
        const query = clientSearch.toLowerCase()
        if (!clientName.includes(query) && !clientEmail.includes(query)) return false
      }

      return true
    })
  }, [assessments, inScopeClientIds, dateFrom, dateTo, companySearch, selectedCA, clientSearch, clientsMap])

  const stats = useMemo(() => {
    let interviews = 0
    let tests = 0
    let screeningCalls = 0
    const uniqueCompanies = new Set<string>()

    statsAssessments.forEach(item => {
      if (item.assessment_type === "interview") interviews++
      else if (item.assessment_type === "assessment") tests++
      else if (item.assessment_type === "screening_call") screeningCalls++
      
      if (item.company_name) {
        uniqueCompanies.add(item.company_name.trim().toLowerCase())
      }
    })

    return {
      interviews,
      tests,
      screeningCalls,
      total: statsAssessments.length,
      companiesCount: uniqueCompanies.size
    }
  }, [statsAssessments])

  // Group by Unique Companies (all of them, not just top 10)
  const allCompaniesList = useMemo(() => {
    const counts: Record<
      string,
      { total: number; interviews: number; tests: number; screening: number; displayName: string }
    > = {}
    statsAssessments.forEach(item => {
      if (!item.company_name) return
      const name = item.company_name.trim()
      const key = name.toLowerCase()
      if (!counts[key]) {
        counts[key] = { total: 0, interviews: 0, tests: 0, screening: 0, displayName: name }
      }
      counts[key].total++
      if (item.assessment_type === "interview") counts[key].interviews++
      else if (item.assessment_type === "assessment") counts[key].tests++
      else if (item.assessment_type === "screening_call") counts[key].screening++
    })

    return Object.values(counts).sort((a, b) => b.total - a.total)
  }, [statsAssessments])

  const filteredModalCompanies = useMemo(() => {
    return allCompaniesList.filter(c =>
      c.displayName.toLowerCase().includes(modalCompanySearch.toLowerCase())
    )
  }, [allCompaniesList, modalCompanySearch])

  // Group by Top Companies
  const topCompanies = useMemo(() => {
    const counts: Record<string, { total: number; interviews: number; tests: number; screening: number }> = {}
    filteredAssessments.forEach(item => {
      if (!item.company_name) return
      const name = item.company_name.trim()
      const key = name.toLowerCase()
      if (!counts[key]) {
        counts[key] = { total: 0, interviews: 0, tests: 0, screening: 0 }
      }
      counts[key].total++
      if (item.assessment_type === "interview") counts[key].interviews++
      else if (item.assessment_type === "assessment") counts[key].tests++
      else if (item.assessment_type === "screening_call") counts[key].screening++
      // Keep reference to exact name representation
      ;(counts[key] as any).displayName = name
    })

    return Object.values(counts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [filteredAssessments])

  // Today's assessments (always based on received date = today, ignoring active date filters)
  const todaysAssessments = useMemo(() => {
    return assessments.filter(item => {
      return inScopeClientIds.has(item.client_id) && item.assessment_received_date === todayStr
    })
  }, [assessments, inScopeClientIds, todayStr])

  // Cohort Analysis: Group clients by client_designation (domain) & experience
  const cohorts = useMemo(() => {
    // Group all in-scope clients
    const groups: Record<string, { designation: string; experience: string; clients: any[] }> = {}
    
    clients.forEach(c => {
      const desig = (c.client_designation || "Not Specified").trim()
      const exp = c.experience !== null && c.experience !== undefined ? `${c.experience} Years` : "Not Specified"
      const key = `${desig.toLowerCase()}_${exp.toLowerCase()}`

      if (!groups[key]) {
        groups[key] = {
          designation: desig,
          experience: exp,
          clients: []
        }
      }

      // Count assessments for this client in the current filtered set
      const clientAssessments = filteredAssessments.filter(a => a.client_id === c.id)
      const interviews = clientAssessments.filter(a => a.assessment_type === "interview").length
      const tests = clientAssessments.filter(a => a.assessment_type === "assessment").length
      const screening = clientAssessments.filter(a => a.assessment_type === "screening_call").length

      groups[key].clients.push({
        ...c,
        interviewsCount: interviews,
        testsCount: tests,
        screeningCount: screening,
        totalAssessmentsCount: clientAssessments.length,
        companiesList: Array.from(new Set(clientAssessments.map(a => a.company_name).filter(Boolean)))
      })
    })

    // Filter out cohorts with only 1 client if we want comparison, but let's show all cohorts sorted by size
    return Object.values(groups)
      .filter(g => g.clients.length > 0)
      .sort((a, b) => b.clients.length - a.clients.length)
  }, [clients, filteredAssessments])

  // Sorted unique bucket names for dropdown filter in ascending order
  const sortedBucketNames = useMemo(() => {
    const names = cohorts.map(cohort => `${cohort.designation} (${cohort.experience})`)
    const uniqueNames = Array.from(new Set(names))
    return uniqueNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
  }, [cohorts])

  // Quick Filter Handler
  const handleQuickFilter = (type: "today" | "yesterday" | "last7" | "last30" | "thismonth" | "all") => {
    const today = new Date()
    if (type === "all") {
      setDateFrom("")
      setDateTo("")
    } else if (type === "today") {
      setDateFrom(todayStr)
      setDateTo(todayStr)
    } else if (type === "yesterday") {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().split("T")[0]
      setDateFrom(yStr)
      setDateTo(yStr)
    } else if (type === "last7") {
      const last7 = new Date(today)
      last7.setDate(last7.getDate() - 7)
      setDateFrom(last7.toISOString().split("T")[0])
      setDateTo(todayStr)
    } else if (type === "last30") {
      const last30 = new Date(today)
      last30.setDate(last30.getDate() - 30)
      setDateFrom(last30.toISOString().split("T")[0])
      setDateTo(todayStr)
    } else if (type === "thismonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setDateFrom(firstDay.toISOString().split("T")[0])
      setDateTo(todayStr)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Cards & Quick Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Client Assessment & Interview Analytics ({scope === "executive" ? "Executive View" : "My Team"})
            </CardTitle>
            <p className="text-xs text-slate-500">Track and compare screening calls, coding assessments, and interview invitations</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleQuickFilter("today")}>Today</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleQuickFilter("yesterday")}>Yesterday</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleQuickFilter("last7")}>Last 7 Days</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleQuickFilter("last30")}>Last 30 Days</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleQuickFilter("thismonth")}>This Month</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs text-indigo-600 hover:text-indigo-800" onClick={() => handleQuickFilter("all")}>All Time</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pb-2">
            <div>
              <Label className="text-xs font-semibold text-slate-600">From Date</Label>
              <div className="relative mt-1">
                <Input type="date" className="h-9 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">To Date</Label>
              <div className="relative mt-1">
                <Input type="date" className="h-9 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Action Type</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="screening_call">Screening Call</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Search Company</Label>
              <Input
                placeholder="e.g. Google"
                className="h-9 text-xs mt-1"
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Search Client</Label>
              <Input
                placeholder="Name or Email..."
                className="h-9 text-xs mt-1"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Career Associate</Label>
              <Select value={selectedCA} onValueChange={setSelectedCA}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue placeholder="All CAs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All CAs</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("summary")}
          className={`py-2.5 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "summary" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Overview & Top Companies
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`py-2.5 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "comparison" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Cohort Comparison (Domain & Exp)
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`py-2.5 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "logs" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Detailed Activity Logs ({filteredAssessments.length})
        </button>
      </div>

      {/* SUMMARY TAB */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card
              onClick={() => setAssessmentType("all")}
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md flex flex-col items-center justify-center text-center select-none ${
                assessmentType === "all"
                  ? "bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-400 ring-2 ring-indigo-600 ring-offset-2 scale-[1.02] shadow-sm"
                  : "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-300"
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                <span className="text-3xl font-black text-indigo-700">{stats.total}</span>
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide mt-1">Total Invites</span>
              </CardContent>
            </Card>

            <Card
              onClick={() => setAssessmentType("interview")}
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md flex flex-col items-center justify-center text-center select-none ${
                assessmentType === "interview"
                  ? "bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-400 ring-2 ring-emerald-600 ring-offset-2 scale-[1.02] shadow-sm"
                  : "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:border-emerald-300"
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                <span className="text-3xl font-black text-emerald-700">{stats.interviews}</span>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide mt-1">Interviews</span>
              </CardContent>
            </Card>

            <Card
              onClick={() => setAssessmentType("assessment")}
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md flex flex-col items-center justify-center text-center select-none ${
                assessmentType === "assessment"
                  ? "bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400 ring-2 ring-blue-600 ring-offset-2 scale-[1.02] shadow-sm"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300"
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                <span className="text-3xl font-black text-blue-700">{stats.tests}</span>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide mt-1">Coding Tests</span>
              </CardContent>
            </Card>

            <Card
              onClick={() => setAssessmentType("screening_call")}
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md flex flex-col items-center justify-center text-center select-none ${
                assessmentType === "screening_call"
                  ? "bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400 ring-2 ring-amber-600 ring-offset-2 scale-[1.02] shadow-sm"
                  : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:border-amber-300"
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                <span className="text-3xl font-black text-amber-700">{stats.screeningCalls}</span>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide mt-1">Screening Calls</span>
              </CardContent>
            </Card>

            <Card
              onClick={() => setShowUniqueCompaniesDialog(true)}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md flex flex-col items-center justify-center text-center select-none bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:border-slate-300 col-span-2 lg:col-span-1"
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                <span className="text-3xl font-black text-slate-700">{stats.companiesCount}</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide mt-1">Unique Companies</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Alerts */}
            <Card className="border-slate-200 shadow-sm col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-red-600 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  Today's Invitations ({todaysAssessments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                {todaysAssessments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No invites logged today yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysAssessments.map((a, idx) => {
                      const c = clientsMap.get(a.client_id)
                      return (
                        <div key={idx} className="p-2.5 bg-slate-50 border rounded-md text-xs flex justify-between items-start">
                          <div>
                            {c ? (
                              <Link href={`${basePath}/client/${c.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                                {c.name}
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-800">Unknown Client</span>
                            )}
                            <div className="text-slate-500 mt-0.5">{a.company_name} - <span className="italic">{a.job_role}</span></div>
                            <div className="text-[10px] text-slate-400 mt-1">Logged by CA: {a.ca_name || "N/A"}</div>
                          </div>
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {a.assessment_type.replace("_", " ")}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Companies Analytics */}
            <Card className="border-slate-200 shadow-sm col-span-1 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 text-indigo-600" />
                  Top Hiring Companies (By Invitations Received)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topCompanies.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No data matching current filters to calculate top companies.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCompanies.map((c: any, index) => {
                      const percentage = filteredAssessments.length > 0 ? Math.round((c.total / filteredAssessments.length) * 100) : 0
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">{c.displayName}</span>
                            <span className="text-slate-600 font-medium">
                              {c.total} Invite{c.total > 1 ? "s" : ""} ({c.interviews} Int, {c.tests} Test, {c.screening} Screen)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${Math.max(5, percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* COHORT COMPARISON TAB */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span>Cohort Comparison Mode (Domain & Experience Alignment)</span>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold text-xs whitespace-nowrap">
                    {cohorts.length} Total Buckets
                  </Badge>
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Compare clients who have the same designation (domain) and experience level. This helps you identify why some clients are succeeding (e.g. Completed with job offers) while others with similar profiles are not.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto min-w-[260px]">
                <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter by Bucket:</Label>
                <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                  <SelectTrigger className="h-9 text-xs w-full bg-white border-slate-200">
                    <SelectValue placeholder="All Buckets" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Buckets</SelectItem>
                    {sortedBucketNames.map((bucket) => (
                      <SelectItem key={bucket} value={bucket}>
                        {bucket}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {cohorts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No clients available to compare.
                </div>
              ) : (
                <div className="space-y-8">
                  {cohorts
                    .filter(cohort => selectedCohort === "all" || `${cohort.designation} (${cohort.experience})` === selectedCohort)
                    .map((cohort, cIdx) => {
                      // Only display cohorts that have clients
                    if (cohort.clients.length === 0) return null
                    return (
                      <div key={cIdx} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-4 py-3 flex justify-between items-center border-b">
                          <div>
                            <span className="font-bold text-slate-800 text-sm">{cohort.designation}</span>
                            <Badge variant="secondary" className="ml-2.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                              {cohort.experience} Experience
                            </Badge>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            {cohort.clients.length} Client{cohort.clients.length !== 1 ? "s" : ""} in Cohort
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-slate-50/50">
                              <TableRow>
                                <TableHead className="text-xs font-semibold text-slate-600">Client Name & Email</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600">Assigned CA</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-center">Client Status</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-center">Interviews</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-center">Coding Tests</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-center">Screen Calls</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-center">Total Invites</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 text-center">application_days</TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600">Interviews Companies</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cohort.clients.map((client: any, clIdx: number) => (
                                <TableRow key={clIdx} className="hover:bg-slate-50/50">
                                  <TableCell className="font-medium text-slate-800 text-xs">
                                    <Link href={`${basePath}/client/${client.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold block">
                                      {client.name}
                                    </Link>
                                    <Link href={`${basePath}/client/${client.id}`} className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline block mt-0.5">
                                      {client.email}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-700">
                                    {client.assigned_ca_name || "Not Assigned"}
                                  </TableCell>
                                  <TableCell className="text-xs text-center">
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
                                  </TableCell>
                                  <TableCell className="text-xs font-bold text-center text-emerald-600">{client.interviewsCount}</TableCell>
                                  <TableCell className="text-xs font-bold text-center text-blue-600">{client.testsCount}</TableCell>
                                  <TableCell className="text-xs font-bold text-center text-amber-600">{client.screeningCount}</TableCell>
                                  <TableCell className="text-xs font-black text-center text-indigo-700 bg-indigo-50/30">{client.totalAssessmentsCount}</TableCell>
                                  <TableCell className="text-xs font-bold text-center text-indigo-600 bg-slate-50/50">
                                    {loadingDays ? (
                                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-indigo-500" />
                                    ) : (
                                      applicationDaysMap.get(client.id) ?? 0
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-600">
                                    {client.companiesList.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {client.companiesList.map((comp: string, compIdx: number) => (
                                          <Badge key={compIdx} variant="outline" className="text-[10px] py-0">
                                            {comp}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic text-[10px]">No invites recorded yet</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* DETAILED LOGS TAB */}
      {activeTab === "logs" && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Received Date</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Client Info</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Company & Job Role</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Email Subject</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Logged By</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-center">Proof</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                        No activity records found matching the current filter options.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssessments.map((a) => {
                      const client = clientsMap.get(a.client_id)
                      return (
                        <TableRow key={a.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs text-slate-700 font-semibold whitespace-nowrap">
                            {a.assessment_received_date}
                          </TableCell>
                          <TableCell className="text-xs">
                            {client ? (
                              <>
                                <Link href={`${basePath}/client/${client.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline block">
                                  {client.name}
                                </Link>
                                <Link href={`${basePath}/client/${client.id}`} className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline block mt-0.5">
                                  {a.client_email}
                                </Link>
                              </>
                            ) : (
                              <>
                                <div className="font-semibold text-slate-800">Unknown</div>
                                <div className="text-[10px] text-slate-500">{a.client_email}</div>
                              </>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              className={
                                a.assessment_type === "interview"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : a.assessment_type === "assessment"
                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                              }
                              variant="outline"
                            >
                              <span className="capitalize">{a.assessment_type.replace("_", " ")}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-800">
                            <div className="font-bold">{a.company_name || "N/A"}</div>
                            <div className="text-slate-500 text-[10px]">{a.job_role || "N/A"}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={a.email_subject}>
                            {a.email_subject}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            <div>{a.ca_name || "N/A"}</div>
                            <div className="text-[10px] text-slate-400">{a.ca_email}</div>
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {a.screenshot_url ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setPreviewImage(a.screenshot_url)}
                                  title="View screenshot proof"
                                >
                                  <Eye className="h-4 w-4 text-indigo-600" />
                                </Button>
                              ) : (
                                <span className="text-slate-400 text-[10px]">No Pic</span>
                              )}
                              
                              {a.email_url && (
                                <a href={a.email_url} target="_blank" rel="noreferrer" title="Open email link">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshot Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>Screenshot Proof</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="mt-2 flex justify-center items-center max-h-[70vh] overflow-auto border rounded bg-slate-50 p-2">
              <img
                src={previewImage}
                alt="Assessment screenshot proof"
                className="max-w-full h-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unique Companies Dialog */}
      <Dialog open={showUniqueCompaniesDialog} onOpenChange={setShowUniqueCompaniesDialog}>
        <DialogContent className="max-w-2xl bg-white flex flex-col p-6 rounded-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Unique Companies ({allCompaniesList.length})
            </DialogTitle>
            <p className="text-xs text-slate-500">
              Click a company name to filter the tracker page for that company.
            </p>
          </DialogHeader>

          {/* Search bar inside the modal */}
          <div className="relative my-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search companies in list..."
              className="pl-9 h-9 text-xs"
              value={modalCompanySearch}
              onChange={e => setModalCompanySearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-2 max-h-[50vh]">
            {filteredModalCompanies.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No companies found.
              </div>
            ) : (
              filteredModalCompanies.map((c: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCompanySearch(c.displayName)
                    setShowUniqueCompaniesDialog(false)
                  }}
                  className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-lg text-xs flex justify-between items-center cursor-pointer transition-colors duration-150 group"
                >
                  <div>
                    <span className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {c.displayName}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {c.interviews} interviews • {c.tests} tests • {c.screening} screening calls
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors" variant="outline">
                      {c.total} Invite{c.total > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t mt-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowUniqueCompaniesDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
