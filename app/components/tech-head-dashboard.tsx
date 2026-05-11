"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Users, DollarSign, Calendar, Search, LogOut, LayoutDashboard, Target,
  Trophy, Eye, ChevronLeft, ChevronRight, FileText, Loader2, Crown, Activity,
  Database, Code2, EyeOff, IndianRupee, ExternalLink
} from "lucide-react"
import Link from "next/link"

interface TechHeadDashboardProps {
  user: any;
  onLogout: () => void;
}

type TabType = "overview" | "leaderboard" | "tracker" | "roster";

export function TechHeadDashboard({ user, onLogout }: TechHeadDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [techReps, setTechReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [trackerSearchQuery, setTrackerSearchQuery] = useState("")
  const [confirmRep, setConfirmRep] = useState<{ id: string, isActive: boolean, name: string } | null>(null)
  const [showYield, setShowYield] = useState(false)

  // Month navigation
  const [monthOffset, setMonthOffset] = useState(0)
  const targetDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset])
  const monthName = useMemo(() => targetDate.toLocaleString("en-US", { month: "long", year: "numeric" }), [targetDate])

  // Financial Engine & API Data
  const [totalPortfolios, setTotalPortfolios] = useState<number>(0)
  const [totalGithubs, setTotalGithubs] = useState<number>(0)
  const [portfolioPoolUsd, setPortfolioPoolUsd] = useState<number>(0)
  const [githubPoolUsd, setGithubPoolUsd] = useState<number>(0)
  const [totalPoolUsd, setTotalPoolUsd] = useState<number>(0)
  const [globalGitSalesCount, setGlobalGitSalesCount] = useState<number>(0)
  const [globalActiveRepsCount, setGlobalActiveRepsCount] = useState<number>(0)
  const [conversionRate, setConversionRate] = useState<number>(85)
  
  const [portfoliosData, setPortfoliosData] = useState<any[]>([])
  const [githubData, setGithubData] = useState<any[]>([])
  const [backendInsights, setBackendInsights] = useState<Record<string, any>>({})

  const fetchTechUsersAndData = useCallback(async () => {
    setLoading(true)
    try {
      const [calcRes, usersRes] = await Promise.all([
        fetch(`/api/calculate-tech-incentives?period=${encodeURIComponent(monthName)}&t=${Date.now()}`),
        supabase.from("users").select("id, name, email, role, designation, isactive, department, created_at, incentive_amount").eq("department", "Tech")
      ])

      let insights: Record<string, any> = {}
      if (calcRes.ok) {
        const data = await calcRes.json()
        setTotalPortfolios(data.totalPortfolios || 0)
        setTotalGithubs(data.totalGithubs || 0)
        setTotalPoolUsd(data.totalPoolUSD || 0)
        setPortfolioPoolUsd(data.portfolioPoolUSD || 0)
        setGithubPoolUsd(data.githubPoolUSD || 0)
        setConversionRate(data.conversionRate || 85)
        setGlobalActiveRepsCount(data.processedCount || 0)
        setGlobalGitSalesCount(data.totalGlobalGitSalesCount || 0)
        insights = data.personalSalesInsights || {}
        setBackendInsights(insights)
        setPortfoliosData(data.portfoliosData || [])
        setGithubData(data.githubData || [])
      }

      if (!usersRes.error && usersRes.data) {
        const targetDateForEnd = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0, 23, 59, 59)
        const normalizedData = usersRes.data
          .filter((u: any) => {
            const userJoinDate = u.created_at ? new Date(u.created_at) : new Date("2000-01-01")
            const isTechHead = (u.role || "").toLowerCase() === "technical head" || (u.designation || "").toLowerCase() === "technical head"
            return userJoinDate <= targetDateForEnd && !isTechHead
          })
          .map((u: any) => {
            const emailKey = u.email ? u.email.toLowerCase() : ""
            const insight = insights[emailKey] || {}
            const isTraineeRep = (u.designation || "").toLowerCase().includes("trainee") || (u.role || "").toLowerCase().includes("trainee")
            
            return {
              id: u.id,
              name: u.name || u.email,
              email: u.email,
              role: u.role,
              designation: u.designation,
              isactive: u.isactive === true,
              isTrainee: isTraineeRep,
              portfolioPoolInr: isTraineeRep ? 0 : insight.portfolioPoolInr || 0,
              githubPoolInr: isTraineeRep ? 0 : insight.githubPoolInr || 0,
              gitSalesInr: isTraineeRep ? 0 : insight.salesIncentiveInr || 0,
              totalCombinedInr: isTraineeRep ? 0 : insight.totalCombinedInr || 0,
              salesCount: isTraineeRep ? 0 : (insight.salesLog?.length || 0)
            }
          })
        setTechReps(normalizedData)
      }
    } catch (e) {
      console.error("Fetch Data Error:", e)
    } finally {
      setLoading(false)
    }
  }, [monthName, monthOffset])

  useEffect(() => {
    fetchTechUsersAndData()
  }, [fetchTechUsersAndData])

  const handleToggleActive = async (repId: string, currentIsActive: boolean) => {
    const { error } = await supabase.from("users").update({ isactive: !currentIsActive }).eq("id", repId)
    if (!error) {
      setTechReps(prev => prev.map(r => r.id === repId ? { ...r, isactive: !currentIsActive } : r))
    } else {
      alert("Failed to toggle active state: " + error.message)
    }
  }

  const handlePromoteTrainee = async (repId: string) => {
    const { error } = await supabase.from("users").update({ role: "Technical Associate", designation: "Technical Associate" }).eq("id", repId)
    if (!error) {
      setTechReps(prev => prev.map(r => r.id === repId ? { ...r, role: "Technical Associate", designation: "Technical Associate", isTrainee: false } : r))
    } else {
      alert("Failed to promote trainee: " + error.message)
    }
  }

  // --- Filtered & Organized Data ---
  const filteredReps = useMemo(() => {
    if (!searchQuery.trim()) return techReps
    const q = searchQuery.toLowerCase()
    return techReps.filter(r => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q))
  }, [techReps, searchQuery])

  const activeReps = filteredReps.filter(r => r.isactive && !r.isTrainee)
  const activeTrainees = filteredReps.filter(r => r.isactive && r.isTrainee)
  const inactiveReps = filteredReps.filter(r => !r.isactive && !r.isTrainee)
  const totalActiveReps = activeReps.length

  const sumIncentives = totalPoolUsd * conversionRate

  // --- Leaderboard Calculation (Based on Tasks Completed) ---
  const leaderboardReps = useMemo(() => {
    // Tally tasks per user email/name
    const tasksMap: Record<string, { portfolios: number, githubs: number }> = {}
    
    // Initialize map with active reps
    activeReps.forEach(r => {
      if (r.email) tasksMap[r.email.toLowerCase()] = { portfolios: 0, githubs: 0 }
    })

    // Count portfolios
    portfoliosData.forEach(p => {
      const by = (p.updated_by || "").toLowerCase()
      // Fuzzy match by email or name
      const rep = activeReps.find(r => r.email?.toLowerCase() === by || r.name?.toLowerCase() === by)
      if (rep && rep.email) {
        if (!tasksMap[rep.email.toLowerCase()]) tasksMap[rep.email.toLowerCase()] = { portfolios: 0, githubs: 0 }
        tasksMap[rep.email.toLowerCase()].portfolios++
      }
    })

    // Count githubs
    githubData.forEach(g => {
      const by = (g.updated_by || "").toLowerCase()
      const rep = activeReps.find(r => r.email?.toLowerCase() === by || r.name?.toLowerCase() === by)
      if (rep && rep.email) {
        if (!tasksMap[rep.email.toLowerCase()]) tasksMap[rep.email.toLowerCase()] = { portfolios: 0, githubs: 0 }
        tasksMap[rep.email.toLowerCase()].githubs++
      }
    })

    return activeReps.map(rep => {
      const email = rep.email?.toLowerCase() || ""
      const tallies = tasksMap[email] || { portfolios: 0, githubs: 0 }
      const totalTasks = tallies.portfolios + tallies.githubs
      return {
        ...rep,
        completedPortfolios: tallies.portfolios,
        completedGithubs: tallies.githubs,
        totalTasks
      }
    }).sort((a, b) => {
      if (b.totalTasks !== a.totalTasks) return b.totalTasks - a.totalTasks
      return b.totalCombinedInr - a.totalCombinedInr
    })
  }, [activeReps, portfoliosData, githubData])

  const topPerformer = leaderboardReps.length > 0 && leaderboardReps[0].totalTasks > 0 ? leaderboardReps[0] : null

  const filteredPortfolios = useMemo(() => {
    return portfoliosData.filter(p => !trackerSearchQuery || p.lead_id?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  }, [portfoliosData, trackerSearchQuery])

  const filteredGithubs = useMemo(() => {
    return githubData.filter(g => !trackerSearchQuery || g.lead_id?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  }, [githubData, trackerSearchQuery])

  // --- Navigation Tabs ---
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "tracker", label: "Tech Tracker", icon: Database },
    { id: "roster", label: "Techies", icon: Users },
  ] as const

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Total Tasks", "Total Incentive (INR)"]
    const csvRows = [headers.join(",")]

    leaderboardReps.forEach(rep => {
      csvRows.push([
        `"${(rep.name || "").replace(/"/g, '""')}"`,
        `"${(rep.email || "").replace(/"/g, '""')}"`,
        `"${(rep.role || "").replace(/"/g, '""')}"`,
        `"${rep.isactive ? "Active" : "Inactive"}"`,
        rep.totalTasks,
        rep.totalCombinedInr
      ].join(","))
    })

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Tech_Team_Report_${monthName.replace(" ", "_")}.csv`
    link.click()
  }

  // --- UI Components ---
  const overviewStatCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card 
        onClick={() => setActiveTab("roster")}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Active Pool Size</CardTitle>
          <Users className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-2 pb-5">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-slate-800 tracking-tight">{globalActiveRepsCount}</div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Members</span>
          </div>
        </CardContent>
      </Card>

      <Card 
        onClick={() => {
          setActiveTab("tracker")
          setTimeout(() => document.getElementById("portfolios-log")?.scrollIntoView({ behavior: "smooth" }), 100)
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Total Portfolios</CardTitle>
          <Code2 className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-2 pb-5">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-slate-800 tracking-tight">{totalPortfolios}</div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Completed</span>
          </div>
        </CardContent>
      </Card>

      <Card 
        onClick={() => {
          setActiveTab("tracker")
          setTimeout(() => document.getElementById("githubs-log")?.scrollIntoView({ behavior: "smooth" }), 100)
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Total Githubs</CardTitle>
          <Database className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-2 pb-5">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-slate-800 tracking-tight">{totalGithubs}</div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Completed</span>
          </div>
        </CardContent>
      </Card>

      <Card 
        onClick={() => setActiveTab("leaderboard")}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group bg-gradient-to-br from-indigo-50 via-white to-blue-50/50 border-blue-200 cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 bg-transparent relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-blue-800 uppercase tracking-widest">Master Pool Yield</CardTitle>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowYield(!showYield);
            }} 
            className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
          >
            {showYield ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </CardHeader>
        <CardContent className="pt-3 relative z-10 pb-5">
          <div className="flex flex-col mb-2">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800 tracking-tighter leading-none">
              {showYield ? `₹${sumIncentives.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
            </span>
          </div>
          <p className="text-[10px] text-blue-800/70 font-semibold mt-1">Shared among active members</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/10">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600 shadow-lg shadow-indigo-500/25">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Tech Head Command Center</h1>
              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-500" />
                Monitoring {totalActiveReps} active associate{totalActiveReps !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-1.5 py-1 rounded-xl border border-slate-200/60 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setMonthOffset(p => p - 1)}>
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <div className="flex items-center gap-1.5 px-3 min-w-[160px] justify-center">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-sm font-black text-slate-700">{monthName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setMonthOffset(p => p + 1)}>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </Button>
            {monthOffset !== 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-2" onClick={() => setMonthOffset(0)}>
                Today
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-1.5 rounded-full border border-indigo-200/50">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-black text-[10px] uppercase shadow-sm">
                {user.name?.substring(0, 2)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-tight">{user.name}</p>
                <p className="text-[9px] text-indigo-500 font-bold">Technical Head</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 pb-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] border border-b-0 border-slate-200/60'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                  }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6 animate-in fade-in duration-500">
        
        {/* Toggle Modal */}
        <Dialog open={!!confirmRep} onOpenChange={() => setConfirmRep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>Toggle the active status of this technical associate.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Are you sure you want to{" "}
              <span className="font-semibold text-slate-800">
                {confirmRep?.isActive ? "set this associate as Inactive" : "set this associate as Active"}
              </span>
              ?
            </p>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConfirmRep(null)}>Cancel</Button>
              <Button
                className={confirmRep?.isActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}
                onClick={() => {
                  if (confirmRep) {
                    handleToggleActive(confirmRep.id, confirmRep.isActive)
                    setConfirmRep(null)
                  }
                }}
              >
                {confirmRep?.isActive ? "Yes, Set Inactive" : "Yes, Set Active"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-semibold">Synchronizing Tech Metrics...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {overviewStatCards}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-xl ring-1 ring-slate-200/50 bg-white overflow-hidden lg:col-span-1">
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-indigo-500" />
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Target className="h-5 w-5 text-indigo-500" /> Top Performer Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center text-center">
                      {topPerformer && topPerformer.totalTasks > 0 ? (
                        <>
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4 relative">
                            <Crown className="h-10 w-10 text-white" />
                          </div>
                          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{topPerformer.name}</h2>
                          <p className="text-slate-500 font-medium mt-1">{topPerformer.email}</p>
                          <div className="flex items-center gap-4 mt-6">
                            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total Tasks</p>
                              <p className="text-2xl font-black text-emerald-700">{topPerformer.totalTasks}</p>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Incentive Yield</p>
                              <p className="text-2xl font-black text-indigo-700">₹{topPerformer.totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-400 italic">No task completions recorded yet for this month.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white lg:col-span-2 flex flex-col">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" /> Leaderboard Snippet
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("leaderboard")} className="text-indigo-600 text-xs h-7">View Full</Button>
                    </CardHeader>
                    <div className="flex-1 p-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16 text-center text-xs">Rank</TableHead>
                            <TableHead className="text-xs">Associate</TableHead>
                            <TableHead className="text-center text-xs">Total Tasks</TableHead>
                            <TableHead className="text-center text-xs">Git Sales</TableHead>
                            <TableHead className="text-right pr-6 text-xs">Yield</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboardReps.slice(0, 4).map((rep, idx) => (
                             <TableRow key={rep.id}>
                               <TableCell className="text-center font-bold text-slate-500">{idx + 1}</TableCell>
                               <TableCell className="font-semibold text-slate-700">{rep.name}</TableCell>
                               <TableCell className="text-center"><Badge variant="secondary" className="shadow-none">{rep.totalTasks}</Badge></TableCell>
                               <TableCell className="text-center"><Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 shadow-none">{rep.salesCount}</Badge></TableCell>
                               <TableCell className="text-right pr-6 font-bold text-indigo-600">₹{rep.totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                             </TableRow>
                          ))}
                          {leaderboardReps.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No active members yet.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Database className="h-5 w-5 text-indigo-500" /> Recent Activity
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("tracker")} className="text-indigo-600 text-xs h-7">View All Logs</Button>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableBody>
                           {(() => {
                             const recent = [...portfoliosData.map(p => ({...p, type: 'Portfolio'})), ...githubData.map(g => ({...g, type: 'Github'}))]
                               .sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                               .slice(0, 5);
                             if (recent.length === 0) return <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No activity logged.</TableCell></TableRow>;
                             return recent.map((item, i) => (
                               <TableRow key={i}>
                                 <TableCell className="pl-6">
                                   <Badge className={item.type === 'Portfolio' ? "bg-emerald-50 text-emerald-600 border-0 shadow-none" : "bg-indigo-50 text-indigo-600 border-0 shadow-none"}>{item.type}</Badge>
                                 </TableCell>
                                 <TableCell className="font-mono text-xs font-semibold">{item.lead_id}</TableCell>
                                 <TableCell className="text-xs text-slate-500">{item.updated_by || 'Unassigned'}</TableCell>
                                 <TableCell className="text-right pr-6 text-xs text-slate-400">{new Date(item.updated_at).toLocaleDateString()}</TableCell>
                               </TableRow>
                             ))
                           })()}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-500" /> Techies Breakdown
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("roster")} className="text-indigo-600 text-xs h-7">Manage Techies</Button>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center"><Users className="h-4 w-4 text-indigo-600" /></div>
                            <span className="font-bold text-indigo-900">Active Associates</span>
                          </div>
                          <span className="text-2xl font-black text-indigo-600">{activeReps.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><Activity className="h-4 w-4 text-emerald-600" /></div>
                            <span className="font-bold text-emerald-900">Active Trainees</span>
                          </div>
                          <span className="text-2xl font-black text-emerald-600">{activeTrainees.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><EyeOff className="h-4 w-4 text-slate-500" /></div>
                            <span className="font-bold text-slate-700">Inactive Members</span>
                          </div>
                          <span className="text-2xl font-black text-slate-500">{inactiveReps.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="space-y-6">
                {overviewStatCards}

                <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" /> Technical Leaderboard
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2 font-semibold">
                      <FileText className="h-4 w-4" /> Export Leaders
                    </Button>
                  </CardHeader>
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Rank</TableHead>
                        <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Associate</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Portfolios</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Githubs</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Git Sales</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-indigo-600">Total Tasks</TableHead>
                        <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Incentive Yield</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardReps.length === 0 ? (
                         <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">No active tech reps found.</TableCell></TableRow>
                      ) : (
                        leaderboardReps.map((rep, idx) => (
                          <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                            <TableCell className="text-center">
                              {idx === 0 ? (
                                <div className="h-8 w-8 mx-auto rounded-full bg-amber-100 flex items-center justify-center"><Crown className="h-4 w-4 text-amber-600" /></div>
                              ) : idx === 1 ? (
                                <div className="h-8 w-8 mx-auto rounded-full bg-slate-100 flex items-center justify-center"><span className="text-slate-500 font-black">2</span></div>
                              ) : idx === 2 ? (
                                <div className="h-8 w-8 mx-auto rounded-full bg-orange-50 flex items-center justify-center"><span className="text-orange-600 font-black">3</span></div>
                              ) : (
                                <span className="font-bold text-slate-400">{idx + 1}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-slate-800">{rep.name}</div>
                              <div className="text-xs text-slate-400">{rep.email}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-slate-100 text-slate-700 shadow-none hover:bg-slate-200 border-0">{rep.completedPortfolios}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-slate-100 text-slate-700 shadow-none hover:bg-slate-200 border-0">{rep.completedGithubs}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-amber-50 text-amber-700 shadow-none hover:bg-amber-100 border border-amber-200">{rep.salesCount}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-lg">
                                {rep.totalTasks}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="font-black text-base text-slate-800">₹{rep.totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* TECH TRACKER */}
            {activeTab === "tracker" && (
              <div className="space-y-6">
                {overviewStatCards}

                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search records by AWL ID..." value={trackerSearchQuery} onChange={(e) => setTrackerSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <Card id="portfolios-log" className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white scroll-mt-24">
                  <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-emerald-500" /> Completed Portfolios Log
                    </CardTitle>
                    <Badge variant="secondary" className="font-black">{filteredPortfolios.length} Records</Badge>
                  </CardHeader>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <Table>
                      <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="pl-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed By</TableHead>
                          <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Updated At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPortfolios.length === 0 ? (
                           <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No portfolios logged for this month.</TableCell></TableRow>
                        ) : (
                          filteredPortfolios.map((row, i) => (
                            <TableRow key={i} className="hover:bg-slate-50 border-b border-slate-50">
                              <TableCell className="pl-6 font-mono text-xs font-bold">
                                <Link 
                                  href={`https://applywizz-crm-tool.vercel.app/leads/${row.lead_id}`}
                                  target="_blank"
                                  className="text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  {row.lead_id}
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </TableCell>
                              <TableCell><Badge className="bg-emerald-50 text-emerald-600 border-0">{row.status}</Badge></TableCell>
                              <TableCell className="text-sm font-semibold text-slate-700">{row.updated_by || 'Unassigned'}</TableCell>
                              <TableCell className="text-right pr-6 text-xs text-slate-500">{new Date(row.updated_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                <Card id="githubs-log" className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white scroll-mt-24">
                  <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Database className="h-5 w-5 text-indigo-500" /> Completed Githubs Log
                    </CardTitle>
                    <Badge variant="secondary" className="font-black">{filteredGithubs.length} Records</Badge>
                  </CardHeader>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <Table>
                      <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="pl-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed By</TableHead>
                          <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Updated At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGithubs.length === 0 ? (
                           <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No githubs logged for this month.</TableCell></TableRow>
                        ) : (
                          filteredGithubs.map((row, i) => (
                            <TableRow key={i} className="hover:bg-slate-50 border-b border-slate-50">
                              <TableCell className="pl-6 font-mono text-xs font-bold">
                                <Link 
                                  href={`https://applywizz-crm-tool.vercel.app/leads/${row.lead_id}`}
                                  target="_blank"
                                  className="text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  {row.lead_id}
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </TableCell>
                              <TableCell><Badge className="bg-emerald-50 text-emerald-600 border-0">{row.status}</Badge></TableCell>
                              <TableCell className="text-sm font-semibold text-slate-700">{row.updated_by || 'Unassigned'}</TableCell>
                              <TableCell className="text-right pr-6 text-xs text-slate-500">{new Date(row.updated_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}

            {/* TECHIES */}
            {activeTab === "roster" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search reps by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" /> Active Techies
                    </CardTitle>
                    <Badge variant="secondary" className="font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100">{activeReps.length} Active</Badge>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Identity Details</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Yield</TableHead>
                          <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeReps.length === 0 ? (
                           <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">No active members found.</TableCell></TableRow>
                        ) : (
                          activeReps.map((rep) => (
                            <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                              <TableCell className="pl-6 py-4">
                                <div className="font-bold text-slate-800">{rep.name}</div>
                                <div className="text-xs text-slate-400">{rep.email}</div>
                              </TableCell>
                              <TableCell><Badge className="bg-emerald-100 text-emerald-800 shadow-none border-0">Active</Badge></TableCell>
                              <TableCell className="text-right font-black text-indigo-700">₹{rep.totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7" onClick={() => setConfirmRep({ id: rep.id, isActive: true, name: rep.name })}>
                                    Set Inactive
                                  </Button>
                                  <Link href={`/cro-dashboard/tech/${rep.id}?month=${encodeURIComponent(monthName)}`}>
                                    <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-xs h-7">
                                      <Eye className="h-3.5 w-3.5" /> View Dashboard
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                {inactiveReps.length > 0 && (
                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white opacity-80 mt-6">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <EyeOff className="h-4 w-4" /> Inactive Registry
                      </CardTitle>
                    </CardHeader>
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Identity Details</TableHead>
                          <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inactiveReps.map((rep) => (
                          <TableRow key={rep.id} className="hover:bg-slate-50">
                            <TableCell className="pl-6 py-3">
                              <div className="font-bold text-slate-600">{rep.name}</div>
                              <div className="text-xs text-slate-400">{rep.email}</div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="outline" size="sm" className="bg-white text-emerald-600 hover:bg-emerald-50 border-emerald-100 text-xs h-7" onClick={() => setConfirmRep({ id: rep.id, isActive: false, name: rep.name })}>
                                Reactivate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                {activeTrainees.length > 0 && (
                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white mt-6">
                    <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-500" /> Active Tech Trainees
                      </CardTitle>
                      <Badge variant="secondary" className="font-black bg-emerald-50 text-emerald-700">{activeTrainees.length} Trainees</Badge>
                    </CardHeader>
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Identity Details</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                          <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTrainees.map((rep) => (
                          <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                            <TableCell className="pl-6 py-4">
                              <div className="font-bold text-slate-800">{rep.name}</div>
                              <div className="text-xs text-slate-400">{rep.email}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{rep.role}</div>
                            </TableCell>
                            <TableCell><Badge className="bg-slate-100 text-slate-600 shadow-none border-0">Trainee</Badge></TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 text-xs h-7" onClick={() => handlePromoteTrainee(rep.id)}>
                                Promote to Associate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}
